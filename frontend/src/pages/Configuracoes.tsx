import { LogOut } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useSession, useSessionActions } from "@/lib/session";

export default function Configuracoes() {
  const { data: user } = useSession();
  const { endSession } = useSessionActions();

  const rows = [
    { label: "Nome do negócio", value: user?.business_name ?? "—", testid: "config-business-name" },
    { label: "Responsável", value: user?.owner_name ?? "—", testid: "config-owner-name" },
    { label: "Segmento", value: user?.segment ?? "—", testid: "config-segment" },
    { label: "Telefone / WhatsApp", value: user?.phone ?? "—", testid: "config-phone" },
    { label: "E-mail de acesso", value: user?.email ?? "—", testid: "config-email" },
  ];

  return (
    <AppShell
      title="Configurações"
      subtitle="Dados da sua conta e do seu negócio."
    >
      <section
        className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"
        data-testid="config-account-panel"
      >
        <h2 className="text-base font-bold text-slate-900">Dados do negócio</h2>
        <dl className="mt-5 divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-wrap items-baseline justify-between gap-2 py-3.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {r.label}
              </dt>
              <dd className="text-sm font-semibold text-slate-900" data-testid={r.testid}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          A edição destes dados, preferências de cobrança (Pix/boleto) e notificações entram na
          próxima etapa.
        </p>
      </section>

      <section
        className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-5 md:p-7"
        data-testid="config-session-panel"
      >
        <h2 className="text-base font-bold text-rose-900">Sessão</h2>
        <p className="mt-1 text-sm text-rose-800/80">
          Encerrar a sessão remove o acesso deste dispositivo.
        </p>
        <Button
          variant="destructive"
          data-testid="config-logout-button"
          onClick={() => void endSession()}
          className="mt-5 h-11 rounded-xl font-bold"
        >
          <LogOut className="size-4" /> Sair da conta
        </Button>
      </section>
    </AppShell>
  );
}
