import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiPost, apiPut } from "@/lib/api";
import { todayIso } from "@/lib/format";
import type { Client, ClientInput } from "@/lib/types";

const empty = (): ClientInput => ({
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  service: "",
  plan_value: 0,
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
  const [form, setForm] = useState<ClientInput>(empty());

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
            plan_value: client.plan_value,
            next_due_date: client.next_due_date,
            status: client.status,
            notes: client.notes,
          }
        : empty(),
    );
  }, [open, client]);

  const mutation = useMutation({
    mutationFn: () =>
      client
        ? apiPut<Client>(`/clients/${client.id}`, form)
        : apiPost<Client>("/clients", form),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (client) await qc.invalidateQueries({ queryKey: ["client", client.id] });
      toast.success(client ? "Cliente atualizado" : "Cliente cadastrado");
      onOpenChange(false);
    },
    onError: () => toast.error("Não foi possível salvar o cliente"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg" data-testid="client-modal">
        <DialogHeader>
          <DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Valor do plano e data de vencimento alimentam o painel automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form
          id="client-form"
          data-testid="client-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              toast.error("Informe o nome do cliente");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="c-name">Nome do cliente</Label>
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
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                data-testid="client-value-input"
                className="h-11 font-mono"
                value={String(form.plan_value)}
                onChange={(e) => setForm({ ...form, plan_value: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-due">Próximo vencimento</Label>
              <Input
                id="c-due"
                type="date"
                required
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

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid="client-cancel-button"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="client-form"
            data-testid="client-save-button"
            disabled={mutation.isPending}
            className="h-11 rounded-xl bg-indigo-700 font-bold text-white hover:bg-indigo-800"
          >
            {mutation.isPending ? "Salvando…" : client ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
