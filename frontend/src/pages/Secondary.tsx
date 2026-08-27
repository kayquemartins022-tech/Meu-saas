import { BarChart3, Bell, CalendarDays, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

function ComingSoon({
  title,
  subtitle,
  icon: Icon,
  bullets,
  testid,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  bullets: string[];
  testid: string;
}) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <section
        data-testid={testid}
        className="rounded-2xl border border-slate-200 bg-white p-7 md:p-10"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
          <Icon className="size-6" />
        </span>
        <h2 className="mt-6 text-xl font-extrabold tracking-tight text-slate-900">
          Em construção nesta etapa
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          A base do ClientePro está pronta e estável. Esta área entra na próxima etapa, com:
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {bullets.map((b) => (
            <li
              key={b}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              {b}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

export function Financeiro() {
  return (
    <ComingSoon
      title="Financeiro"
      subtitle="Visão consolidada de faturamento e recebimentos."
      icon={Wallet}
      testid="financeiro-placeholder"
      bullets={[
        "Gráfico de faturamento mensal",
        "Projeção de recebimentos",
        "Taxa de inadimplência",
        "Comparativo entre meses",
      ]}
    />
  );
}

export function Calendario() {
  return (
    <ComingSoon
      title="Calendário"
      subtitle="Seus vencimentos organizados por data."
      icon={CalendarDays}
      testid="calendario-placeholder"
      bullets={[
        "Visão mensal dos vencimentos",
        "Lista por dia selecionado",
        "Marcação de pagos e atrasados",
        "Atalho de cobrança no dia",
      ]}
    />
  );
}

export function Lembretes() {
  return (
    <ComingSoon
      title="Lembretes"
      subtitle="Avisos automáticos antes e depois do vencimento."
      icon={Bell}
      testid="lembretes-placeholder"
      bullets={[
        "Modelos de mensagem editáveis",
        "Disparo 3 dias antes do vencimento",
        "Aviso automático de atraso",
        "Histórico de lembretes enviados",
      ]}
    />
  );
}

export function Relatorios() {
  return (
    <ComingSoon
      title="Relatórios"
      subtitle="Números do negócio prontos para decidir."
      icon={BarChart3}
      testid="relatorios-placeholder"
      bullets={[
        "Retenção de clientes",
        "Ranking de inadimplência",
        "Faturamento por segmento",
        "Exportação em CSV",
      ]}
    />
  );
}
