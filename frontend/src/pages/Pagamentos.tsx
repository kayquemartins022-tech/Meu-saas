import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Receipt, Search, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiDelete, apiGet } from "@/lib/api";
import { brl, fullDate, todayIso } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/types";
import type { MessageOut, Payment } from "@/lib/types";

const METHOD_FILTERS: Record<string, string> = { todos: "Todos os métodos", ...PAYMENT_METHODS };

export default function Pagamentos() {
  const qc = useQueryClient();
  const { data, isError, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => apiGet<Payment[]>("/payments"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("todos");

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<MessageOut>(`/payments/${id}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["payments"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      await qc.invalidateQueries({ queryKey: ["client"] });
      toast.success("Pagamento excluído");
      setDeleting(null);
    },
    onError: () => toast.error("Não foi possível excluir o pagamento"),
  });

  const payments = isError ? [] : (data ?? []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (term && !p.client_name.toLowerCase().includes(term)) return false;
      if (methodFilter !== "todos" && p.method !== methodFilter) return false;
      return true;
    });
  }, [payments, search, methodFilter]);

  const total = visible.reduce((sum, p) => sum + p.amount, 0);
  const monthPrefix = todayIso().slice(0, 7);
  const monthTotal = payments
    .filter((p) => p.paid_at.startsWith(monthPrefix))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppShell
      title="Pagamentos"
      subtitle="Registre, edite e acompanhe tudo o que você já recebeu."
      actions={
        <Button
          data-testid="pagamentos-new-button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="h-11 rounded-xl bg-indigo-700 font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-800 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Registrar pagamento
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
          data-testid="pagamentos-month-card"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Recebido no mês
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold text-emerald-900">
            {brl(monthTotal)}
          </p>
        </div>
        <div
          className="rounded-2xl border border-slate-200 bg-white p-5"
          data-testid="pagamentos-total-card"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total filtrado
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold text-slate-900">{brl(total)}</p>
        </div>
        <div
          className="rounded-2xl border border-slate-200 bg-white p-5"
          data-testid="pagamentos-count-card"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Pagamentos listados
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold text-slate-900">{visible.length}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              data-testid="pagamentos-search-input"
              placeholder="Buscar por cliente"
              className="h-12 pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={methodFilter} onValueChange={(v: string) => setMethodFilter(v)}>
            <SelectTrigger
              data-testid="pagamentos-method-filter"
              className="h-12 w-full md:w-[220px]"
              aria-label="Filtrar por método"
            >
              <SelectValue>{(v) => METHOD_FILTERS[v as string] ?? "Todos os métodos"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METHOD_FILTERS).map(([value, label]) => (
                <SelectItem key={value} value={value} data-testid={`pagamentos-filter-${value}`}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError ? (
        <p
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          data-testid="pagamentos-offline-notice"
        >
          Não foi possível carregar o histórico agora. Tente novamente em instantes.
        </p>
      ) : null}

      <section className="mt-5 space-y-3" data-testid="pagamentos-list">
        {visible.map((p) => (
          <article
            key={p.id}
            data-testid={`payment-row-${p.id}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-[border-color] duration-200 hover:border-indigo-300 md:p-5"
          >
            <div className="min-w-0 flex-1 basis-full sm:basis-0">
              <p className="truncate text-base font-bold text-slate-900">{p.client_name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {fullDate(p.paid_at)} · {PAYMENT_METHODS[p.method] ?? p.method}
              </p>
              {p.notes ? (
                <p className="mt-1.5 text-xs italic text-slate-500">{p.notes}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
              <span className="font-mono text-lg font-extrabold text-slate-900">
                {brl(p.amount)}
              </span>
              <button
                type="button"
                aria-label={`Editar pagamento de ${p.client_name}`}
                data-testid={`payment-edit-${p.id}`}
                onClick={() => {
                  setEditing(p);
                  setOpen(true);
                }}
                className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-colors duration-150 hover:bg-slate-200"
              >
                <Pencil className="size-[18px]" />
              </button>
              <button
                type="button"
                aria-label={`Excluir pagamento de ${p.client_name}`}
                data-testid={`payment-delete-${p.id}`}
                onClick={() => setDeleting(p)}
                className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-600 transition-colors duration-150 hover:bg-rose-100"
              >
                <Trash2 className="size-[18px]" />
              </button>
            </div>
          </article>
        ))}

        {!isLoading && visible.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
            data-testid="pagamentos-empty-state"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <Receipt className="size-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-slate-900">Nenhum pagamento encontrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Registre um recebimento para começar seu histórico.
            </p>
          </div>
        ) : null}
      </section>

      <PaymentDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        payment={editing}
      />

      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm" data-testid="payment-delete-dialog">
          <DialogHeader>
            <DialogTitle>Excluir pagamento</DialogTitle>
            <DialogDescription>
              {deleting
                ? `O pagamento de ${brl(deleting.amount)} de ${deleting.client_name} será removido.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-testid="payment-delete-cancel"
              onClick={() => setDeleting(null)}
              className="h-11 rounded-xl font-semibold"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              data-testid="payment-delete-confirm"
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
