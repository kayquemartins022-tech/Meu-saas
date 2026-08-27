import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlarmClock,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BENEFITS = [
  {
    icon: AlarmClock,
    title: "Nunca mais esqueça um vencimento",
    text: "Todo cliente aparece com a data exata e quantos dias faltam — ou quantos dias já está em atraso.",
  },
  {
    icon: TrendingUp,
    title: "Receba mais, cobrando menos",
    text: "Uma cobrança educada no dia certo evita a conversa difícil no fim do mês.",
  },
  {
    icon: ShieldCheck,
    title: "Seus dados só seus",
    text: "Cada conta é isolada. Ninguém além de você acessa a sua carteira de clientes.",
  },
];

const FEATURES = [
  { icon: Users, title: "Cadastro de clientes", text: "Nome, WhatsApp, valor do plano, vencimento e status em um só lugar." },
  { icon: LayoutDashboard, title: "Painel de controle", text: "Ativos, vencendo hoje, em breve, vencidos e faturamento do mês." },
  { icon: MessageCircle, title: "Cobrança no WhatsApp", text: "Mensagem pronta com nome, valor e data — um toque e está enviada." },
  { icon: CreditCard, title: "Registro de pagamentos", text: "Baixa em um clique e o próximo vencimento avança automaticamente." },
  { icon: BarChart3, title: "Visão financeira", text: "Faturamento, pendências e inadimplência sem planilha nenhuma." },
  { icon: BadgeCheck, title: "Feito para celular", text: "Interface pensada para você resolver tudo do Android ou iPhone." },
];

const STEPS = [
  { n: "01", title: "Crie sua conta", text: "E-mail e senha. Sem cartão, sem burocracia." },
  { n: "02", title: "Conte do seu negócio", text: "Quatro campos rápidos e o painel já fica com a sua cara." },
  { n: "03", title: "Cadastre seus clientes", text: "Valor do plano e dia de vencimento — o resto o ClientePro calcula." },
  { n: "04", title: "Cobre no dia certo", text: "Acompanhe o painel e dispare a cobrança sem esforço." },
];

const PLANS = [
  {
    name: "Mensal",
    price: "R$ 49",
    period: "/mês",
    highlight: false,
    features: ["Clientes ilimitados", "Painel completo", "Cobrança via WhatsApp", "Suporte por e-mail"],
  },
  {
    name: "Anual",
    price: "R$ 39",
    period: "/mês",
    highlight: true,
    features: [
      "Tudo do plano Mensal",
      "2 meses grátis no ano",
      "Relatórios financeiros",
      "Suporte prioritário",
    ],
  },
];

const FAQ = [
  {
    q: "Preciso instalar algum aplicativo?",
    a: "Não. O ClientePro roda no navegador do seu celular ou computador. Basta entrar com seu e-mail e senha.",
  },
  {
    q: "Consigo usar pelo celular?",
    a: "Sim — a interface foi desenhada primeiro para Android e iPhone, com navegação inferior e áreas de toque confortáveis.",
  },
  {
    q: "Outra pessoa pode ver meus clientes?",
    a: "Não. Cada conta acessa exclusivamente os próprios dados; a sessão é protegida por cookie seguro.",
  },
  {
    q: "Como funciona a cobrança pelo WhatsApp?",
    a: "O ClientePro monta a mensagem com o nome do cliente, o valor e a data de vencimento. Você revisa e envia.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa e sem letras miúdas. Você continua com acesso até o fim do período pago.",
  },
];

function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("px-4 py-16 md:px-6 md:py-24", className)}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">{children}</p>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Logo to="/" />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#beneficios" className="transition-colors duration-150 hover:text-indigo-700">
              Benefícios
            </a>
            <a href="#funcionalidades" className="transition-colors duration-150 hover:text-indigo-700">
              Funcionalidades
            </a>
            <a href="#planos" className="transition-colors duration-150 hover:text-indigo-700">
              Planos
            </a>
            <a href="#faq" className="transition-colors duration-150 hover:text-indigo-700">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              data-testid="header-login-link"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-semibold")}
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              data-testid="header-register-link"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-full bg-indigo-700 px-4 font-semibold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-800 active:scale-[0.98]",
              )}
            >
              Começar agora
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0f172a] px-4 pb-20 pt-16 md:px-6 md:pb-28 md:pt-24">
        <div className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 size-[360px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Badge className="mb-6 rounded-full border-0 bg-indigo-500/25 px-3 py-1 text-xs font-bold text-indigo-200">
              Gestão de clientes para pequenos negócios
            </Badge>
            <h1
              className="text-[34px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[56px]"
              data-testid="hero-title"
            >
              Pare de perder clientes por esquecer vencimentos.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
              O ClientePro organiza sua carteira, mostra quem vence hoje, quem está em atraso e
              quanto você tem para receber — e monta a cobrança pronta para o WhatsApp. Tudo do seu
              celular, em segundos.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/cadastro"
                data-testid="hero-cta-register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-13 min-h-12 rounded-full bg-indigo-600 px-7 text-base font-bold text-white shadow-lg shadow-indigo-950/40 transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-500 active:scale-[0.98]",
                )}
              >
                Começar agora <ArrowRight className="ml-1 size-5" />
              </Link>
              <Link
                to="/login"
                data-testid="hero-cta-login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-13 min-h-12 rounded-full border-slate-700 bg-transparent px-7 text-base font-bold text-slate-100 transition-colors duration-150 hover:bg-slate-800 hover:text-white",
                )}
              >
                Entrar
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              Conta demo disponível:{" "}
              <span className="font-mono text-slate-200">demo@clientepro.com</span> / senha{" "}
              <span className="font-mono text-slate-200">demo1234</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Painel de hoje
                </p>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                  ao vivo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Clientes ativos", value: "128", tone: "text-white" },
                  { label: "Vencendo hoje", value: "6", tone: "text-amber-300" },
                  { label: "Em atraso", value: "3", tone: "text-rose-300" },
                  { label: "Faturamento", value: "R$ 14.2k", tone: "text-emerald-300" },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {kpi.label}
                    </p>
                    <p className={cn("mt-1 font-mono text-2xl font-extrabold", kpi.tone)}>
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ["Academia Corpo Forte", "12 dias em atraso", "text-rose-300"],
                  ["Padaria Pão Nosso", "Vence hoje", "text-amber-300"],
                  ["Pet Shop Amigo Fiel", "Em 3 dias", "text-slate-400"],
                ].map(([name, status, tone]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-200">{name}</span>
                    <span className={cn("text-xs font-bold", tone)}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <Section id="beneficios">
        <Eyebrow>Por que o ClientePro</Eyebrow>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          Menos esquecimento, mais dinheiro no caixa.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }, i) => (
            <div
              key={title}
              data-testid={`benefit-card-${i}`}
              className={cn(
                "rounded-2xl border border-slate-200 bg-white p-6 transition-[border-color,box-shadow] duration-200 hover:border-indigo-300 hover:shadow-md",
                i === 1 && "md:mt-8",
              )}
            >
              <span className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FUNCIONALIDADES */}
      <Section id="funcionalidades" className="bg-white">
        <Eyebrow>Funcionalidades</Eyebrow>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          O essencial para cobrar em dia — sem excesso.
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }, i) => (
            <div key={title} data-testid={`feature-card-${i}`} className="bg-white p-7">
              <Icon className="size-5 text-indigo-700" />
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* COMO FUNCIONA */}
      <Section id="como-funciona">
        <Eyebrow>Como funciona</Eyebrow>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          Do cadastro à primeira cobrança em minutos.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, title, text }) => (
            <div key={n} data-testid={`step-card-${n}`} className="relative pl-14">
              <span className="absolute left-0 top-0 grid size-11 place-items-center rounded-xl bg-[#0f172a] font-mono text-sm font-bold text-sky-400">
                {n}
              </span>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PLANOS */}
      <Section id="planos" className="bg-white">
        <Eyebrow>Planos</Eyebrow>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          Preço simples, sem surpresa na fatura.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:max-w-4xl">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              data-testid={`plan-card-${plan.name.toLowerCase()}`}
              className={cn(
                "rounded-2xl border p-8",
                plan.highlight
                  ? "border-indigo-700 bg-[#0f172a] text-white shadow-xl shadow-indigo-950/20"
                  : "border-slate-200 bg-white",
              )}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={cn(
                    "text-lg font-bold",
                    plan.highlight ? "text-white" : "text-slate-900",
                  )}
                >
                  Plano {plan.name}
                </h3>
                {plan.highlight ? (
                  <span className="rounded-full bg-indigo-500/25 px-3 py-1 text-[11px] font-bold text-indigo-200">
                    mais escolhido
                  </span>
                ) : null}
              </div>
              <p className="mt-6 flex items-end gap-1">
                <span
                  className={cn(
                    "font-mono text-4xl font-extrabold tracking-tight",
                    plan.highlight ? "text-white" : "text-slate-900",
                  )}
                >
                  {plan.price}
                </span>
                <span className={plan.highlight ? "text-slate-400" : "text-slate-500"}>
                  {plan.period}
                </span>
              </p>
              <ul className="mt-7 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        plan.highlight ? "text-sky-400" : "text-emerald-600",
                      )}
                    />
                    <span className={plan.highlight ? "text-slate-300" : "text-slate-600"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/cadastro"
                data-testid={`plan-cta-${plan.name.toLowerCase()}`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-8 w-full min-h-12 rounded-full font-bold transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]",
                  plan.highlight
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-slate-900 text-white hover:bg-slate-800",
                )}
              >
                Começar agora
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <Eyebrow>Dúvidas frequentes</Eyebrow>
        <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          Tudo o que você precisa saber.
        </h2>
        <div className="mt-10 max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {FAQ.map((item, i) => (
            <div key={item.q}>
              <button
                type="button"
                data-testid={`faq-toggle-${i}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-150 hover:bg-slate-50"
              >
                <span className="text-sm font-bold text-slate-900 md:text-base">{item.q}</span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-slate-400 transition-transform duration-200",
                    openFaq === i && "rotate-180 text-indigo-700",
                  )}
                />
              </button>
              {openFaq === i ? (
                <p
                  data-testid={`faq-answer-${i}`}
                  className="px-6 pb-5 text-sm leading-relaxed text-slate-600"
                >
                  {item.a}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section className="pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] px-6 py-14 md:px-14 md:py-20">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Comece hoje e receba em dia no próximo mês.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Leva menos de dois minutos para criar sua conta e cadastrar o primeiro cliente.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/cadastro"
                data-testid="final-cta-register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-12 rounded-full bg-indigo-600 px-7 text-base font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-500 active:scale-[0.98]",
                )}
              >
                Criar minha conta <ArrowRight className="ml-1 size-5" />
              </Link>
              <Link
                to="/login"
                data-testid="final-cta-login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-12 rounded-full border-slate-700 bg-transparent px-7 text-base font-bold text-slate-100 hover:bg-slate-800 hover:text-white",
                )}
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <footer className="border-t border-slate-200 bg-white px-4 py-10 md:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ClientePro · Gestão de clientes para pequenos negócios
          </p>
        </div>
      </footer>
    </div>
  );
}
