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

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();
  const { beginSession } = useSessionActions();

  const mutation = useMutation({
    mutationFn: () => apiPost<UserPublic>("/auth/register", { email, password }),
    onSuccess: (user) => {
      beginSession(user);
      toast.success("Conta criada! Vamos configurar seu negócio.");
      navigate("/onboarding", { replace: true });
    },
    onError: (e) => toast.error(errText(e, "Não foi possível criar a conta")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    mutation.mutate();
  };

  return (
    <AuthLayout
      title="Criar sua conta"
      subtitle="Dois minutos para organizar toda a sua carteira de clientes."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link
            to="/login"
            data-testid="register-to-login-link"
            className="font-bold text-indigo-700 hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form data-testid="register-form" className="space-y-5" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            data-testid="register-email-input"
            placeholder="voce@seunegocio.com"
            className="h-12 bg-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            data-testid="register-password-input"
            placeholder="Mínimo de 6 caracteres"
            className="h-12 bg-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            data-testid="register-confirm-input"
            placeholder="Repita a senha"
            className="h-12 bg-white"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          data-testid="register-submit-button"
          disabled={mutation.isPending}
          className="h-12 w-full rounded-xl bg-indigo-700 text-base font-bold text-white transition-transform duration-150 hover:scale-[1.01] hover:bg-indigo-800 active:scale-[0.99]"
        >
          {mutation.isPending ? "Criando conta…" : "Começar agora"}
        </Button>
        <p className="text-xs leading-relaxed text-slate-500">
          Ao criar sua conta você concorda em usar o ClientePro para gerenciar seus próprios
          clientes. Seus dados ficam isolados na sua conta.
        </p>
      </form>
    </AuthLayout>
  );
}
