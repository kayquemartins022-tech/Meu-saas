import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PaymentDialog from "@/components/pagamentos/PaymentDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";
import { brl, fullDate } from "@/lib/format";
import type { Payment } from "@/lib/types";

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
};

export default function Pagamentos() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => apiGet<Payment[]>("/payments"),
  });
  const [open, setOpen] = useState(false);

  const payments = isError ? [] : (data ?? []);
  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppShell
      title="Pagamentos"
      subtitle="Histórico de tudo o que você já recebeu."
      actions={
        <Button
          data-testid="pagamentos-new-button"
          onClick={() => setOpen(true)}
          className="h-11 rounded-xl bg-indigo-700 font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-800 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Registrar pagamento
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" data-testid="pagamentos-total-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Total recebido
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold text-emerald-900">{brl(total)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5" data-testid="pagamentos-count-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Pagamentos registrados
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold text-slate-900">{payments.length}</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <h2 className="text-base font-bold text-slate-900">Histórico</h2>
        {payments.length > 0 ? (
          <div className="mt-4" data-testid="pagamentos-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} data-testid={`payment-row-${p.id}`}>
                    <TableCell className="font-semibold text-slate-900">{p.client_name}</TableCell>
                    <TableCell className="text-slate-600">{fullDate(p.paid_at)}</TableCell>
                    <TableCell className="text-slate-600">
                      {METHOD_LABELS[p.method] ?? p.method}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900">
                      {brl(p.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !isLoading ? (
          <div className="py-14 text-center" data-testid="pagamentos-empty-state">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <Receipt className="size-5" />
            </span>
            <p className="mt-4 text-sm font-bold text-slate-900">Nenhum pagamento registrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Registre um recebimento para começar seu histórico.
            </p>
          </div>
        ) : null}
      </section>

      <PaymentDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
