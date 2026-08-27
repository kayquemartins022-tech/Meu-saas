import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarClock,
  History,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Receipt,
  Trash2,
} from "lucide-react";
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
import { apiDelete, apiGet } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useCharge } from "@/lib/charge";
import { brl, dueLabel, fullDate } from "@/lib/format";
import {
  PAYMENT_METHODS,
  SITUATION_LABELS,
  SITUATION_STYLES,
} from "@/lib/types";
import type { ClientDetail, MessageOut, Payment } from "@/lib/types";
import { cn } from "@/lib/utils";

function Panel({
  title,
  icon: Icon,
  action,
  children,
  testid,
}: {
  title: string;
  icon?: typeof History;
  action?: React.ReactNode;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <section
      data-testid={testid}
      className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          {Icon ? <Icon className="size-[18px] text-slate-400" /> : null}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ClienteDetalhe() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const charge = useCharge();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => apiGet<ClientDetail>(`/clients/${id}/detail`),
    enabled: Boolean(id),
    retry: false,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteClientOpen, setDeleteClientOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const removeClient = useMutation({
    mutationFn: () => apiDelete<MessageOut>(`/clients/${id}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Cliente excluído");
      navigate("/app/clientes", { replace: true });
    },
    onError: (err) => toast.error(errorMessage(err, "Não foi possível excluir o cliente")),
  });

  const removePayment = useMutation({
    mutationFn: (paymentId: string) => apiDelete<MessageOut>(`/payments/${paymentId}`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["client", id] });
      await qc.invalidateQueries({ queryKey: ["payments"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Pagamento excluído");
      setDeletingPayment(null);
    },
    onError: (err) => toast.error(errorMessage(err, "Não foi possível excluir o pagamento")),
  });

  const client = data?.client;

  if (isError) {
    return (
      <AppShell title="Cliente" subtitle="Não encontramos este cliente.">
        <div
          className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center"
          data-testid="client-detail-error"
        >
          <p className="text-sm font-bold text-slate-900">Cliente não encontrado</p>
          <p className="mt-1 text-sm text-slate-500">
            Ele pode ter sido excluído ou pertencer a outra conta.
          </p>
          <Link
            to="/app/clientes"
            data-testid="client-detail-back-link"
            className="mt-6 inline-flex text-sm font-bold text-indigo-700 hover:underline"
          >
            ← Voltar para clientes
          </Link>
        </div>
      </AppShell>
    );
  }

  const fields = client
    ? [
        { label: "Telefone", value: client.phone || "—", icon: Phone, testid: "detail-phone" },
        { label: "WhatsApp", value: client.whatsapp || client.phone || "—", icon: MessageCircle, testid: "detail-whatsapp" },
        { label: "E-mail", value: client.email || "—", icon: Mail, testid: "detail-email" },
        { label: "Serviço / produto", value: client.service || "—", icon: Receipt, testid: "detail-service" },
      ]
    : [];

  return (
    <AppShell
      title={client?.name ?? (isLoading ? "Carregando…" : "Cliente")}
      subtitle={
        client
          ? `${client.service || "Sem serviço informado"} · cliente desde ${fullDate(
              client.created_at.slice(0, 10),
            )}`
          : undefined
      }
      actions={
        <Link
          to="/app/clientes"
          data-testid="detail-back-button"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      }
    >
      {client ? (
        <>
          {/* Status + valores */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5"
              data-testid="detail-status-card"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Status
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold",
                  SITUATION_STYLES[client.situation],
                )}
                data-testid="detail-situation-badge"
              >
                {SITUATION_LABELS[client.situation]}
              </span>
              {client.status === "ativo" ? (
                <p className="mt-2 text-xs text-slate-500">{dueLabel(client.days)}</p>
              ) : null}
            </div>
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5"
              data-testid="detail-value-card"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Valor
              </p>
              <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900">
                {brl(client.plan_value)}
              </p>
            </div>
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5"
              data-testid="detail-due-card"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Vencimento
              </p>
              <p className="mt-2 flex items-center gap-2 font-mono text-2xl font-extrabold text-slate-900">
                <CalendarClock className="size-5 text-slate-400" />
                {fullDate(client.next_due_date)}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-5 flex flex-wrap gap-2" data-testid="detail-actions">
            <Button
              data-testid="detail-charge-button"
              onClick={() => void charge(client)}
              className="h-11 rounded-xl bg-emerald-600 font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-emerald-700 active:scale-[0.98]"
            >
              <MessageCircle className="size-4" /> Cobrar pelo WhatsApp
            </Button>
            <Button
              data-testid="detail-payment-button"
              onClick={() => {
                setEditingPayment(null);
                setPayOpen(true);
              }}
              className="h-11 rounded-xl bg-indigo-700 font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-800 active:scale-[0.98]"
            >
              <Receipt className="size-4" /> Registrar pagamento
            </Button>
            <Button
              variant="outline"
              data-testid="detail-edit-button"
              onClick={() => setEditOpen(true)}
              className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700"
            >
              <Pencil className="size-4" /> Editar
            </Button>
            <Button
              variant="outline"
              data-testid="detail-delete-button"
              onClick={() => setDeleteClientOpen(true)}
              className="h-11 rounded-xl border-rose-200 bg-white font-bold text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="size-4" /> Excluir
            </Button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <Panel title="Histórico de pagamentos" icon={Receipt} testid="panel-client-payments">
                {data.payments.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.payments.map((p) => (
                      <div
                        key={p.id}
                        data-testid={`client-payment-row-${p.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-extrabold text-slate-900">
                            {brl(p.amount)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {fullDate(p.paid_at)} · {PAYMENT_METHODS[p.method] ?? p.method}
                          </p>
                          {p.notes ? (
                            <p className="mt-1 text-xs italic text-slate-500">{p.notes}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Editar pagamento"
                            data-testid={`client-payment-edit-${p.id}`}
                            onClick={() => {
                              setEditingPayment(p);
                              setPayOpen(true);
                            }}
                            className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-colors duration-150 hover:bg-slate-200"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Excluir pagamento"
                            data-testid={`client-payment-delete-${p.id}`}
                            onClick={() => setDeletingPayment(p)}
                            className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600 transition-colors duration-150 hover:bg-rose-100"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className="py-8 text-center text-sm text-slate-500"
                    data-testid="client-payments-empty"
                  >
                    Nenhum pagamento registrado para este cliente.
                  </p>
                )}
              </Panel>

              <Panel title="Histórico de cobranças" icon={History} testid="panel-client-charges">
                {data.charges.length > 0 ? (
                  <ol className="space-y-2.5">
                    {data.charges.map((c) => (
                      <li
                        key={c.id}
                        data-testid={`client-charge-row-${c.id}`}
                        className="rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-bold",
                              c.kind === "vencido"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-indigo-100 text-indigo-700",
                            )}
                          >
                            {c.kind === "vencido" ? "Cobrança de atraso" : "Lembrete"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(c.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-600">
                          {c.message}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p
                    className="py-8 text-center text-sm text-slate-500"
                    data-testid="client-charges-empty"
                  >
                    Nenhuma cobrança enviada ainda. Use “Cobrar pelo WhatsApp”.
                  </p>
                )}
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel title="Dados do cliente" testid="panel-client-fields">
                <dl className="divide-y divide-slate-100">
                  {fields.map((f) => (
                    <div key={f.label} className="py-3 first:pt-0">
                      <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <f.icon className="size-3.5" /> {f.label}
                      </dt>
                      <dd
                        className="mt-1 break-words text-sm font-semibold text-slate-900"
                        data-testid={f.testid}
                      >
                        {f.value}
                      </dd>
                    </div>
                  ))}
                  <div className="py-3">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Data de cadastro
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900" data-testid="detail-created-at">
                      {fullDate(client.created_at.slice(0, 10))}
                    </dd>
                  </div>
                </dl>
              </Panel>

              <Panel title="Resumo" testid="panel-client-summary">
                <dl className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total recebido
                    </dt>
                    <dd
                      className="font-mono text-sm font-extrabold text-emerald-700"
                      data-testid="detail-total-paid"
                    >
                      {brl(data.total_paid)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pagamentos
                    </dt>
                    <dd className="font-mono text-sm font-extrabold text-slate-900">
                      {data.payments_count}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Cobranças enviadas
                    </dt>
                    <dd className="font-mono text-sm font-extrabold text-slate-900">
                      {data.charges.length}
                    </dd>
                  </div>
                </dl>
              </Panel>

              {client.notes ? (
                <Panel title="Observações" testid="panel-client-notes">
                  <p
                    className="whitespace-pre-line text-sm leading-relaxed text-slate-600"
                    data-testid="detail-notes"
                  >
                    {client.notes}
                  </p>
                </Panel>
              ) : null}
            </div>
          </div>

          <ClientModal open={editOpen} onOpenChange={setEditOpen} client={client} />
          <PaymentDialog
            open={payOpen}
            onOpenChange={(o) => {
              setPayOpen(o);
              if (!o) setEditingPayment(null);
            }}
            presetClientId={client.id}
            payment={editingPayment}
          />

          <Dialog open={deleteClientOpen} onOpenChange={setDeleteClientOpen}>
            <DialogContent className="sm:max-w-sm" data-testid="detail-delete-dialog">
              <DialogHeader>
                <DialogTitle>Excluir cliente</DialogTitle>
                <DialogDescription>
                  “{client.name}” e todo o histórico de pagamentos e cobranças serão removidos.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  data-testid="detail-delete-cancel"
                  onClick={() => setDeleteClientOpen(false)}
                  className="h-11 rounded-xl font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  data-testid="detail-delete-confirm"
                  disabled={removeClient.isPending}
                  onClick={() => removeClient.mutate()}
                  className="h-11 rounded-xl font-bold"
                >
                  {removeClient.isPending ? "Excluindo…" : "Excluir"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={deletingPayment !== null}
            onOpenChange={(o) => !o && setDeletingPayment(null)}
          >
            <DialogContent className="sm:max-w-sm" data-testid="payment-delete-dialog">
              <DialogHeader>
                <DialogTitle>Excluir pagamento</DialogTitle>
                <DialogDescription>
                  {deletingPayment
                    ? `O pagamento de ${brl(deletingPayment.amount)} de ${fullDate(
                        deletingPayment.paid_at,
                      )} será removido.`
                    : ""}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  data-testid="payment-delete-cancel"
                  onClick={() => setDeletingPayment(null)}
                  className="h-11 rounded-xl font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  data-testid="payment-delete-confirm"
                  disabled={removePayment.isPending}
                  onClick={() => deletingPayment && removePayment.mutate(deletingPayment.id)}
                  className="h-11 rounded-xl font-bold"
                >
                  {removePayment.isPending ? "Excluindo…" : "Excluir"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
          Carregando dados do cliente…
        </div>
      )}
    </AppShell>
  );
}
