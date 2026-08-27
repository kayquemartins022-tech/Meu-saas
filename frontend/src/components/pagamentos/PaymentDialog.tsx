import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { errorMessage, parseMoney } from "@/lib/errors";
import { brl, todayIso } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/types";
import type { Client, Payment } from "@/lib/types";

export default function PaymentDialog({
  open,
  onOpenChange,
  presetClientId,
  payment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetClientId?: string;
  /** When set the dialog edits an existing payment instead of creating one. */
  payment?: Payment | null;
}) {
  const qc = useQueryClient();
  const editing = Boolean(payment);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("0");
  const [method, setMethod] = useState("pix");
  const [paidAt, setPaidAt] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [advance, setAdvance] = useState(true);

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGet<Client[]>("/clients"),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (payment) {
      setClientId(payment.client_id);
      setAmount(String(payment.amount));
      setMethod(payment.method);
      setPaidAt(payment.paid_at);
      setNotes(payment.notes);
      return;
    }
    const initial = presetClientId ?? "";
    setClientId(initial);
    setMethod("pix");
    setPaidAt(todayIso());
    setNotes("");
    setAdvance(true);
    const found = clients?.find((c) => c.id === initial);
    setAmount(found ? String(found.plan_value) : "0");
  }, [open, presetClientId, clients, payment]);

  const mutation = useMutation({
    mutationFn: () =>
      payment
        ? apiPut<Payment>(`/payments/${payment.id}`, {
            amount: parseMoney(amount),
            method,
            paid_at: paidAt,
            notes,
          })
        : apiPost<Payment>("/payments", {
            client_id: clientId,
            amount: parseMoney(amount),
            method,
            paid_at: paidAt,
            notes,
            advance_due_date: advance,
          }),
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["payments"] });
      await qc.invalidateQueries({ queryKey: ["client", saved.client_id] });
      toast.success(
        editing
          ? "Pagamento atualizado"
          : `Pagamento de ${brl(saved.amount)} registrado para ${saved.client_name}`,
      );
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err, "Não foi possível salvar o pagamento")),
  });

  const clientLabel = (id: string) =>
    clients?.find((c) => c.id === id)?.name ?? payment?.client_name ?? "Selecione o cliente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="payment-modal"
        className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[28rem] flex-col gap-0 overflow-hidden p-0 sm:w-full"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-200 px-5 py-4 text-left">
          <DialogTitle>{editing ? "Editar pagamento" : "Registrar pagamento"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Ajuste valor, data, método ou observação deste recebimento."
              : "Ao registrar, o próximo vencimento do cliente avança um mês (opcional abaixo)."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="payment-form"
          data-testid="payment-form"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!clientId) {
              toast.error("Selecione um cliente");
              return;
            }
            if (parseMoney(amount) <= 0) {
              toast.error("Informe um valor maior que zero");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="p-client">Cliente</Label>
            {editing ? (
              <Input
                id="p-client"
                readOnly
                data-testid="payment-client-readonly"
                className="h-11 bg-slate-50"
                value={payment?.client_name ?? ""}
              />
            ) : (
              <Select
                value={clientId}
                onValueChange={(v: string) => {
                  setClientId(v);
                  const found = clients?.find((c) => c.id === v);
                  if (found) setAmount(String(found.plan_value));
                }}
              >
                <SelectTrigger
                  id="p-client"
                  data-testid="payment-client-select"
                  className="h-11 w-full"
                >
                  <SelectValue placeholder="Selecione o cliente">
                    {(v) => clientLabel(v as string)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(clients ?? []).map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      data-testid={`payment-client-option-${c.id}`}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-amount">Valor (R$)</Label>
              <Input
                id="p-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                data-testid="payment-amount-input"
                className="h-11 font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-date">Data</Label>
              <Input
                id="p-date"
                type="date"
                required
                data-testid="payment-date-input"
                className="h-11"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-method">Método</Label>
            <Select value={method} onValueChange={(v: string) => setMethod(v)}>
              <SelectTrigger id="p-method" data-testid="payment-method-select" className="h-11 w-full">
                <SelectValue>{(v) => PAYMENT_METHODS[v as string] ?? "PIX"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <SelectItem key={value} value={value} data-testid={`payment-method-${value}`}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-notes">Observação</Label>
            <Textarea
              id="p-notes"
              rows={2}
              data-testid="payment-notes-input"
              placeholder="Ex.: pago via PIX pelo responsável"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {!editing ? (
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Checkbox
                checked={advance}
                onCheckedChange={(v) => setAdvance(v === true)}
                data-testid="payment-advance-checkbox"
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Avançar o vencimento em 1 mês
                </span>
                <span className="block text-xs text-slate-500">
                  Desmarque para pagamentos avulsos que não alteram a recorrência.
                </span>
              </span>
            </label>
          ) : null}
        </form>

        <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            data-testid="payment-cancel-button"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-xl font-semibold sm:flex-none sm:px-5"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="payment-form"
            data-testid="payment-save-button"
            disabled={mutation.isPending}
            className="h-11 flex-1 rounded-xl bg-indigo-700 font-bold text-white hover:bg-indigo-800"
          >
            {mutation.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Registrar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
