import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  MessageCircle,
  Plus,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ClientModal from "@/components/clientes/ClientModal";
import PaymentDialog from "@/components/pagamentos/PaymentDialog";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { useCharge } from "@/lib/charge";
import { brl, dueLabel, fullDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { DashboardSummary, DueItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  index,
  testid,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone: "neutral" | "amber" | "rose" | "emerald" | "indigo";
  index: number;
  testid: string;
}) {
  const tones = {
    neutral: "border-slate-200 bg-white",
    amber: "border-amber-200 bg-amber-50",
    rose: "border-rose-200 bg-rose-50",
    emerald: "border-emerald-200 bg-emerald-50",
    indigo: "border-indigo-200 bg-indigo-50",
  };
  const iconTones = {
    neutral: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    emerald: "bg-emerald-100 text-emerald-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  const valueTones = {
    neutral: "text-slate-900",
    amber: "text-amber-900",
    rose: "text-rose-900",
    emerald: "text-emerald-900",
    indigo: "text-indigo-900",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      data-testid={testid}
      className={cn(
        "rounded-2xl border p-5 transition-[border-color,box-shadow] duration-200 hover:shadow-md",
        tones[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", iconTones[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p
        className={cn("mt-3 font-mono text-3xl font-extrabold tracking-tight", valueTones[tone])}
        data-testid={`${testid}-value`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </motion.div>
  );
}

function DueRow({ item, onCharge }: { item: DueItem; onCharge: (item: DueItem) => void }) {
  const overdue = item.days < 0;
  const today = item.days === 0;
  return (
    <div
      data-testid={`due-row-${item.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors duration-150 hover:border-indigo-300"
    >
      <div className="min-w-0">
        <Link
          to={`/app/clientes/${item.id}`}
          data-testid={`due-row-open-${item.id}`}
          className="truncate text-sm font-bold text-slate-900 hover:text-indigo-700"
        >
          {item.name}
        </Link>
        <p className="mt-0.5 text-xs text-slate-500">
          {fullDate(item.next_due_date)} · {brl(item.plan_value)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-bold",
            overdue
              ? "bg-rose-100 text-rose-700"
              : today
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-600",
          )}
        >
          {dueLabel(item.days)}
        </span>
        <button
          type="button"
          aria-label={`Enviar cobrança para ${item.name}`}
          data-testid={`due-row-charge-${item.id}`}
          onClick={() => onCharge(item)}
          className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors duration-150 hover:bg-emerald-100"
        >
          <MessageCircle className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  testid,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <section
      data-testid={testid}
      className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6"
    >
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const { data: user } = useSession();
  const { data, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardSummary>("/dashboard"),
  });
  const [clientOpen, setClientOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const charge = useCharge();

  const businessName = user?.business_name ?? "Meu negócio";
  const summary = isError ? undefined : data;

  const kpis = [
    {
      label: "Clientes ativos",
      value: String(summary?.clientes_ativos ?? 0),
      hint: "Na sua carteira agora",
      icon: Users,
      tone: "neutral" as const,
      testid: "kpi-clientes-ativos",
    },
    {
      label: "Vencendo hoje",
      value: String(summary?.vencendo_hoje ?? 0),
      hint: "Cobre antes do fim do dia",
      icon: Clock3,
      tone: "amber" as const,
      testid: "kpi-vencendo-hoje",
    },
    {
      label: "Vencendo em breve",
      value: String(summary?.vencendo_em_breve ?? 0),
      hint: "Nos próximos 7 dias",
      icon: CalendarClock,
      tone: "indigo" as const,
      testid: "kpi-vencendo-breve",
    },
    {
      label: "Vencidos",
      value: String(summary?.vencidos ?? 0),
      hint: "Precisam de atenção",
      icon: AlertTriangle,
      tone: "rose" as const,
      testid: "kpi-vencidos",
    },
    {
      label: "Faturamento do mês",
      value: brl(summary?.faturamento_mes ?? 0),
      hint: "Pagamentos registrados",
      icon: TrendingUp,
      tone: "emerald" as const,
      testid: "kpi-faturamento",
    },
    {
      label: "Pagamentos pendentes",
      value: brl(summary?.pagamentos_pendentes ?? 0),
      hint: "Vencidos + vencendo hoje",
      icon: CircleDollarSign,
      tone: "neutral" as const,
      testid: "kpi-pendentes",
    },
  ];

  return (
    <AppShell
      title={`Olá, ${user?.owner_name?.split(" ")[0] ?? "tudo bem"}!`}
      subtitle={`Visão geral de ${businessName}${summary ? ` · ${fullDate(summary.today)}` : ""}`}
      actions={
        <Button
          data-testid="dashboard-new-client-button"
          onClick={() => setClientOpen(true)}
          className="h-11 rounded-xl bg-indigo-700 font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-800 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Novo cliente
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="kpi-grid">
        {kpis.map((k, i) => (
          <KpiCard key={k.testid} index={i} {...k} />
        ))}
      </div>

      {isError ? (
        <p
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          data-testid="dashboard-offline-notice"
        >
          Não foi possível carregar os dados agora. Os números aparecem assim que a conexão voltar.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel
            title="Próximos vencimentos"
            description="Quem vence hoje e nos próximos dias"
            testid="panel-proximos-vencimentos"
          >
            {summary && summary.proximos_vencimentos.length > 0 ? (
              <div className="space-y-2.5">
                {summary.proximos_vencimentos.map((item) => (
                  <DueRow key={item.id} item={item} onCharge={charge} />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500" data-testid="proximos-empty">
                Nenhum vencimento próximo. Cadastre clientes para começar.
              </p>
            )}
          </Panel>

          <Panel
            title="Clientes em atraso"
            description="Envie a cobrança pronta pelo WhatsApp"
            testid="panel-clientes-atrasados"
          >
            {summary && summary.clientes_atrasados.length > 0 ? (
              <div className="space-y-2.5">
                {summary.clientes_atrasados.map((item) => (
                  <DueRow key={item.id} item={item} onCharge={charge} />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500" data-testid="atrasados-empty">
                Nenhum cliente em atraso. Excelente trabalho!
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Ações rápidas" description="O que você faz todo dia" testid="panel-acoes-rapidas">
            <div className="space-y-2.5">
              <button
                type="button"
                data-testid="quick-action-add-client"
                onClick={() => setClientOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left transition-colors duration-150 hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                  <UserPlus className="size-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">Adicionar cliente</span>
                  <span className="block text-xs text-slate-500">Cadastro em 30 segundos</span>
                </span>
              </button>

              <button
                type="button"
                data-testid="quick-action-register-payment"
                onClick={() => setPaymentOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Receipt className="size-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">Registrar pagamento</span>
                  <span className="block text-xs text-slate-500">Baixa e avanço do vencimento</span>
                </span>
              </button>

              <button
                type="button"
                data-testid="quick-action-send-charge"
                onClick={() => {
                  const target =
                    summary?.clientes_atrasados[0] ?? summary?.proximos_vencimentos[0] ?? null;
                  if (!target) return;
                  void charge(target);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-left transition-colors duration-150 hover:border-sky-300 hover:bg-sky-50/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
                  <MessageCircle className="size-[18px]" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">Enviar cobrança</span>
                  <span className="block text-xs text-slate-500">
                    Mensagem pronta para o mais urgente
                  </span>
                </span>
              </button>
            </div>
          </Panel>

          <Panel title="Resumo financeiro" testid="panel-resumo-financeiro">
            <dl className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Recebido no mês
                </dt>
                <dd className="font-mono text-sm font-extrabold text-emerald-700">
                  {brl(summary?.faturamento_mes ?? 0)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  A receber (atrasado)
                </dt>
                <dd className="font-mono text-sm font-extrabold text-rose-700">
                  {brl(summary?.pagamentos_pendentes ?? 0)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Clientes ativos
                </dt>
                <dd className="font-mono text-sm font-extrabold text-slate-900">
                  {summary?.clientes_ativos ?? 0}
                </dd>
              </div>
            </dl>
            <Link
              to="/app/clientes"
              data-testid="dashboard-to-clients-link"
              className="mt-5 inline-flex text-sm font-bold text-indigo-700 hover:underline"
            >
              Ver todos os clientes →
            </Link>
          </Panel>
        </div>
      </div>

      <ClientModal open={clientOpen} onOpenChange={setClientOpen} />
      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </AppShell>
  );
}
