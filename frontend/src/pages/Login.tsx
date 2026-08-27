import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPost } from "@/lib/api";
import { useSessionActions } from "@/lib/session";
import type { UserPublic } from "@/lib/types";

const errText = (e: unknown, fallback: string) => {
  if (e instanceof ApiError) {
    const body = e.body as { detail?: unknown } | null;
    if (typeof body?.detail === "string") return body.detail;
  }
  return fallback;
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { beginSession } = useSessionActions();

  const mutation = useMutation({
    mutationFn: () => apiPost<UserPublic>("/auth/login", { email, password }),
    onSuccess: async (user) => {
      await beginSession(user);
      toast.success("Bem-vindo de volta!");
      navigate(user.onboarded ? "/app/dashboard" : "/onboarding", { replace: true });
    },
    onError: (e) => toast.error(errText(e, "Não foi possível entrar")),
  });

  return (
    <AuthLayout
      title="Entrar na sua conta"
      subtitle="Acesse o painel e veja quem precisa ser cobrado hoje."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            to="/cadastro"
            data-testid="login-to-register-link"
            className="font-bold text-indigo-700 hover:underline"
          >
            Criar conta grátis
          </Link>
        </>
      }
    >
      <form
        data-testid="login-form"
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            data-testid="login-email-input"
            placeholder="voce@seunegocio.com"
            className="h-12 bg-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              to="/recuperar-senha"
              data-testid="login-forgot-link"
              className="text-xs font-semibold text-indigo-700 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            data-testid="login-password-input"
            placeholder="••••••••"
            className="h-12 bg-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          data-testid="login-submit-button"
          disabled={mutation.isPending}
          className="h-12 w-full rounded-xl bg-indigo-700 text-base font-bold text-white transition-transform duration-150 hover:scale-[1.01] hover:bg-indigo-800 active:scale-[0.99]"
        >
          {mutation.isPending ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <button
        type="button"
        data-testid="login-fill-demo-button"
        onClick={() => {
          setEmail("demo@clientepro.com");
          setPassword("demo1234");
        }}
        className="mt-5 w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-left transition-colors duration-150 hover:border-indigo-400 hover:bg-indigo-50/50"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Conta de demonstração
        </span>
        <span className="mt-0.5 block font-mono text-sm text-slate-700">
          demo@clientepro.com / demo1234
        </span>
      </button>
    </AuthLayout>
  );
}
