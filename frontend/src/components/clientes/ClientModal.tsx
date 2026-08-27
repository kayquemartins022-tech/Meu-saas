import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { apiPost, apiPut } from "@/lib/api";
import { errorMessage, parseMoney } from "@/lib/errors";
import { todayIso } from "@/lib/format";
import type { Client, ClientInput } from "@/lib/types";

interface FormState extends Omit<ClientInput, "plan_value"> {
  /** Kept as a string so pt-BR input ("150,50") survives until submit. */
  plan_value: string;
}

const empty = (): FormState => ({
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  service: "",
  plan_value: "",
  next_due_date: todayIso(5),
  status: "ativo",
  notes: "",
});

const STATUS_LABELS: Record<string, string> = { ativo: "Ativo", inativo: "Inativo" };

export default function ClientModal({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(empty());

  useEffect(() => {
    if (!open) return;
    setForm(
      client
        ? {
            name: client.name,
            phone: client.phone,
            whatsapp: client.whatsapp,
            email: client.email,
            service: client.service,
            plan_value: String(client.plan_value ?? 0),
            next_due_date: client.next_due_date,
            status: client.status,
            notes: client.notes,
          }
        : empty(),
    );
  }, [open, client]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: ClientInput = {
        ...form,
        name: form.name.trim(),
        plan_value: parseMoney(form.plan_value),
        next_due_date: form.next_due_date || todayIso(),
      };
      return client
        ? apiPut<Client>(`/clients/${client.id}`, payload)
        : apiPost<Client>("/clients", payload);
    },
    onSuccess: async (saved) => {
      // Refresh the list and the dashboard counters before closing, so the new client
      // is already visible when the modal disappears.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["clients"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
        client
          ? qc.invalidateQueries({ queryKey: ["client", client.id] })
          : Promise.resolve(),
      ]);
      toast.success(client ? "Cliente atualizado" : `${saved.name} foi cadastrado`);
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(errorMessage(err, "Não foi possível salvar o cliente")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Mobile-safe sheet: the whole dialog is capped to the *dynamic* viewport (dvh, so
        the browser chrome can't hide it), only the body scrolls, and the footer is pinned
        so "Salvar" is always reachable without scrolling.
      */}
      <DialogContent
        data-testid="client-modal"
        className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[32rem] flex-col gap-0 overflow-hidden p-0 sm:w-full"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-200 px-5 py-4 text-left">
          <DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Valor do plano e data de vencimento alimentam o painel automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form
          id="client-form"
          data-testid="client-form"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5"
          onSubmit={submit}
        >
          <div className="space-y-2">
            <Label htmlFor="c-name">
              Nome do cliente <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="c-name"
              required
              data-testid="client-name-input"
              placeholder="Ex.: Academia Corpo Forte"
              className="h-11"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-phone">Telefone</Label>
              <Input
                id="c-phone"
                inputMode="tel"
                data-testid="client-phone-input"
                placeholder="5511999990000"
                className="h-11"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-whatsapp">WhatsApp</Label>
              <Input
                id="c-whatsapp"
                inputMode="tel"
                data-testid="client-whatsapp-input"
                placeholder="Vazio = usa o telefone"
                className="h-11"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-email">E-mail</Label>
              <Input
                id="c-email"
                type="email"
                inputMode="email"
                data-testid="client-email-input"
                placeholder="cliente@email.com"
                className="h-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-service">Serviço / produto</Label>
              <Input
                id="c-service"
                data-testid="client-service-input"
                placeholder="Ex.: Plano mensal"
                className="h-11"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-value">Valor do plano (R$)</Label>
              <Input
                id="c-value"
                inputMode="decimal"
                data-testid="client-value-input"
                placeholder="0,00"
                className="h-11 font-mono"
                value={form.plan_value}
                onChange={(e) => setForm({ ...form, plan_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-due">Próximo vencimento</Label>
              <Input
                id="c-due"
                type="date"
                data-testid="client-due-input"
                className="h-11"
                value={form.next_due_date}
                onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v: string) => setForm({ ...form, status: v })}
            >
              <SelectTrigger id="c-status" data-testid="client-status-select" className="h-11 w-full">
                <SelectValue>{(v) => STATUS_LABELS[v as string] ?? "Ativo"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo" data-testid="client-status-ativo">
                  Ativo
                </SelectItem>
                <SelectItem value="inativo" data-testid="client-status-inativo">
                  Inativo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-notes">Observações</Label>
            <Textarea
              id="c-notes"
              rows={3}
              data-testid="client-notes-input"
              placeholder="Detalhes do contrato, forma de pagamento…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </form>

        {/* Pinned action bar — never scrolls out of reach, clears the iOS home indicator. */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              data-testid="client-cancel-button"
              onClick={() => onOpenChange(false)}
              className="h-11 flex-1 rounded-xl font-semibold sm:flex-none sm:px-5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="client-form"
              data-testid="client-save-button"
              disabled={mutation.isPending}
              className="h-11 flex-1 rounded-xl bg-indigo-700 font-bold text-white hover:bg-indigo-800"
            >
              {mutation.isPending
                ? "Salvando…"
                : client
                  ? "Salvar alterações"
                  : "Cadastrar cliente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
