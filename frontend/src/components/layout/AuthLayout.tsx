import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Logo } from "@/components/Logo";

const POINTS = [
  "Veja num relance quem vence hoje e quem está em atraso",
  "Cobrança pronta para o WhatsApp em um toque",
  "Feito para resolver tudo pelo celular",
];

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.95fr_1.05fr]">
      {/* Trust panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f172a] p-12 lg:flex">
        <div className="pointer-events-none absolute -left-20 top-1/3 size-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <Logo tone="dark" to="/" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
            Sua carteira de clientes organizada, do primeiro cadastro à última cobrança.
          </h2>
          <ul className="mt-9 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sky-500/20">
                  <Check className="size-3 text-sky-400" strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed text-slate-300">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} ClientePro
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-slate-50">
        <div className="flex h-16 items-center justify-between px-5 lg:hidden">
          <Logo to="/" />
          <Link to="/" className="text-sm font-semibold text-slate-500" data-testid="auth-back-home">
            Voltar
          </Link>
        </div>
        <div className="flex flex-1 items-center px-5 pb-14 pt-4 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-7 text-sm text-slate-500">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
