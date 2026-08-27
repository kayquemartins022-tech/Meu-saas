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
import { apiGet, apiPost } from "@/lib/api";
import { brl } from "@/lib/format";
import type { Client, Payment } from "@/lib/types";

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
};

export default function PaymentDialog({
  open,
  onOpenChange,
  presetClientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetClientId?: string;
}) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("0");
  const [method, setMethod] = useState("pix");

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGet<Client[]>("/clients"),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const initial = presetClientId ?? "";
    setClientId(initial);
    setMethod("pix");
    const found = clients?.find((c) => c.id === initial);
    setAmount(found ? String(found.plan_value) : "0");
  }, [open, presetClientId, clients]);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<Payment>("/payments", {
        client_id: clientId,
        amount: Number(amount),
        method,
      }),
    onSuccess: async (payment) => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success(
        `Pagamento de ${brl(payment.amount)} registrado para ${payment.client_name}`,
      );
      onOpenChange(false);
    },
    onError: () => toast.error("Não foi possível registrar o pagamento"),
  });

  const clientLabel = (id: string) =>
    clients?.find((c) => c.id === id)?.name ?? "Selecione o cliente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="payment-modal">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            Ao registrar, o próximo vencimento do cliente avança automaticamente um mês.
          </DialogDescription>
        </DialogHeader>

        <form
          id="payment-form"
          data-testid="payment-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!clientId) {
              toast.error("Selecione um cliente");
              return;
            }
            if (Number(amount) <= 0) {
              toast.error("Informe um valor maior que zero");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="p-client">Cliente</Label>
            <Select
              value={clientId}
              onValueChange={(v: string) => {
                setClientId(v);
                const found = clients?.find((c) => c.id === v);
                if (found) setAmount(String(found.plan_value));
              }}
            >
              <SelectTrigger id="p-client" data-testid="payment-client-select" className="h-11 w-full">
                <SelectValue placeholder="Selecione o cliente">
                  {(v) => clientLabel(v as string)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id} data-testid={`payment-client-option-${c.id}`}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-amount">Valor recebido (R$)</Label>
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
            <Label htmlFor="p-method">Forma de pagamento</Label>
            <Select value={method} onValueChange={(v: string) => setMethod(v)}>
              <SelectTrigger id="p-method" data-testid="payment-method-select" className="h-11 w-full">
                <SelectValue>{(v) => METHOD_LABELS[v as string] ?? "Pix"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} data-testid={`payment-method-${value}`}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid="payment-cancel-button"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="payment-form"
            data-testid="payment-save-button"
            disabled={mutation.isPending}
            className="h-11 rounded-xl bg-indigo-700 font-bold text-white hover:bg-indigo-800"
          >
            {mutation.isPending ? "Registrando…" : "Registrar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
