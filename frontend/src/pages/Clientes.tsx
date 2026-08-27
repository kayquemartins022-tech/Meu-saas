import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, Pencil, Plus, Receipt, Search, Trash2, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ClientModal from "@/components/clientes/ClientModal";
import PaymentDialog from "@/components/pagamentos/PaymentDialog";
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
import { apiDelete, apiGet } from "@/lib/api";
import { brl, cobrancaMessage, dueLabel, fullDate, whatsappLink } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Client, MessageOut } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "ativos", label: "Ativos" },
  { key: "vencendo", label: "Vencendo" },
  { key: "atraso", label: "Em atraso" },
  { key: "inativos", label: "Inativos" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const daysUntil = (iso: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

export default function Clientes() {
  const qc = useQueryClient();
  const { data: user } = useSession();
  const { data, isError, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => apiGet<Client[]>("/clients"),
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [paymentFor, setPaymentFor] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<MessageOut>(`/clients/${id}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Cliente excluído");
      setDeleting(null);
    },
    onError: () => toast.error("Não foi possível excluir o cliente"),
  });

  const clients = isError ? [] : (data ?? []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (term && !`${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(term)) return false;
      const days = daysUntil(c.next_due_date);
      switch (filter) {
        case "ativos":
          return c.status === "ativo";
        case "inativos":
          return c.status === "inativo";
        case "vencendo":
          return c.status === "ativo" && days >= 0 && days <= 7;
        case "atraso":
          return c.status === "ativo" && days < 0;
        default:
          return true;
      }
    });
  }, [clients, search, filter]);

  const businessName = user?.business_name ?? "Meu negócio";

  const charge = (c: Client) => {
    const message = cobrancaMessage(businessName, c.name, c.plan_value, c.next_due_date);
    if (!c.phone) {
      toast.info("Cliente sem WhatsApp cadastrado. Mensagem copiada.");
      void navigator.clipboard?.writeText(message);
      return;
    }
    window.open(whatsappLink(c.phone, message), "_blank", "noopener");
  };

  return (
    <AppShell
      title="Clientes"
      subtitle="Cadastre, edite e acompanhe o vencimento de cada cliente."
      actions={
        <Button
          data-testid="clientes-new-button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="h-11 rounded-xl bg-indigo-700 font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-800 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Novo cliente
        </Button>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            data-testid="clientes-search-input"
            placeholder="Buscar por nome, WhatsApp ou e-mail"
            className="h-12 pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              data-testid={`clientes-filter-${f.key}`}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors duration-150",
                filter === f.key
                  ? "border-indigo-700 bg-indigo-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <p
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          data-testid="clientes-offline-notice"
        >
          Não foi possível carregar a lista agora. Tente novamente em instantes.
        </p>
      ) : null}

      <div className="mt-5 space-y-3" data-testid="clientes-list">
        {filtered.map((c) => {
          const days = daysUntil(c.next_due_date);
          const inactive = c.status === "inativo";
          return (
            <article
              key={c.id}
              data-testid={`client-card-${c.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition-[border-color,box-shadow] duration-200 hover:border-indigo-300 hover:shadow-sm md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="truncate text-base font-bold text-slate-900"
                      data-testid={`client-name-${c.id}`}
                    >
                      {c.name}
                    </h3>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        inactive
                          ? "bg-slate-100 text-slate-500"
                          : days < 0
                            ? "bg-rose-100 text-rose-700"
                            : days === 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {inactive ? "inativo" : days < 0 ? "em atraso" : "ativo"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {c.phone || "sem WhatsApp"}
                    {c.email ? ` · ${c.email}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                    <span className="font-mono text-lg font-extrabold text-slate-900">
                      {brl(c.plan_value)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Vence {fullDate(c.next_due_date)}
                    </span>
                    {!inactive ? (
                      <span
                        className={cn(
                          "text-xs font-bold",
                          days < 0 ? "text-rose-700" : days <= 7 ? "text-amber-700" : "text-slate-500",
                        )}
                      >
                        {dueLabel(days)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                  <button
                    type="button"
                    aria-label={`Enviar cobrança para ${c.name}`}
                    data-testid={`client-charge-${c.id}`}
                    onClick={() => charge(c)}
                    className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-150 hover:bg-emerald-100"
                  >
                    <MessageCircle className="size-[18px]" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Registrar pagamento de ${c.name}`}
                    data-testid={`client-payment-${c.id}`}
                    onClick={() => setPaymentFor(c)}
                    className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 transition-colors duration-150 hover:bg-indigo-100"
                  >
                    <Receipt className="size-[18px]" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Editar ${c.name}`}
                    data-testid={`client-edit-${c.id}`}
                    onClick={() => {
                      setEditing(c);
                      setModalOpen(true);
                    }}
                    className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-colors duration-150 hover:bg-slate-200"
                  >
                    <Pencil className="size-[18px]" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir ${c.name}`}
                    data-testid={`client-delete-${c.id}`}
                    onClick={() => setDeleting(c)}
                    className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600 transition-colors duration-150 hover:bg-rose-100"
                  >
                    <Trash2 className="size-[18px]" />
                  </button>
                </div>
              </div>
              {c.notes ? (
                <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-600">
                  {c.notes}
                </p>
              ) : null}
            </article>
          );
        })}

        {!isLoading && filtered.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
            data-testid="clientes-empty-state"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <Users className="size-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-slate-900">Nenhum cliente encontrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Ajuste a busca ou cadastre seu primeiro cliente.
            </p>
            <Button
              data-testid="clientes-empty-new-button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="mt-6 h-11 rounded-xl bg-indigo-700 font-bold text-white hover:bg-indigo-800"
            >
              <Plus className="size-4" /> Cadastrar cliente
            </Button>
          </div>
        ) : null}
      </div>

      <ClientModal open={modalOpen} onOpenChange={setModalOpen} client={editing} />
      <PaymentDialog
        open={paymentFor !== null}
        onOpenChange={(open) => !open && setPaymentFor(null)}
        presetClientId={paymentFor?.id}
      />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm" data-testid="client-delete-dialog">
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>
              {deleting
                ? `“${deleting.name}” será removido permanentemente da sua carteira.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-testid="client-delete-cancel"
              onClick={() => setDeleting(null)}
              className="h-11 rounded-xl font-semibold"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              data-testid="client-delete-confirm"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
              className="h-11 rounded-xl font-bold"
            >
              {remove.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
