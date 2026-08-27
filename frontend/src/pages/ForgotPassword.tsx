import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import AuthLayout from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPost } from "@/lib/api";
import type { MessageOut, ResetTokenOut } from "@/lib/types";

const errText = (e: unknown, fallback: string) => {
  if (e instanceof ApiError) {
    const body = e.body as { detail?: unknown } | null;
    if (typeof body?.detail === "string") return body.detail;
  }
  return fallback;
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const request = useMutation({
    mutationFn: () => apiPost<ResetTokenOut>("/auth/forgot-password", { email }),
    onSuccess: (data) => {
      setIssuedToken(data.token);
      setToken(data.token);
      toast.success(data.message);
    },
    onError: (e) => toast.error(errText(e, "Não foi possível gerar o código")),
  });

  const reset = useMutation({
    mutationFn: () => apiPost<MessageOut>("/auth/reset-password", { email, token, password }),
    onSuccess: (data) => {
      toast.success(data.message);
      navigate("/login", { replace: true });
    },
    onError: (e) => toast.error(errText(e, "Não foi possível redefinir a senha")),
  });

  return (
    <AuthLayout
      title="Recuperar acesso"
      subtitle="Informe o e-mail da conta para gerar um código de recuperação e definir uma nova senha."
      footer={
        <>
          Lembrou a senha?{" "}
          <Link
            to="/login"
            data-testid="forgot-to-login-link"
            className="font-bold text-indigo-700 hover:underline"
          >
            Voltar para o login
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <form
          data-testid="forgot-request-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            request.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail da conta</Label>
            <Input
              id="email"
              type="email"
              required
              inputMode="email"
              data-testid="forgot-email-input"
              placeholder="voce@seunegocio.com"
              className="h-12 bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            data-testid="forgot-request-button"
            disabled={request.isPending}
            className="h-12 w-full rounded-xl border-slate-300 bg-white font-bold text-slate-800 transition-colors duration-150 hover:bg-slate-100"
          >
            {request.isPending ? "Gerando…" : "Gerar código de recuperação"}
          </Button>
        </form>

        {issuedToken ? (
          <div
            className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5"
            data-testid="forgot-token-panel"
          >
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <KeyRound className="size-4" /> Seu código
            </p>
            <p className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-indigo-900">
              {issuedToken}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-indigo-800/80">
              Nesta versão o código é exibido aqui em vez de ser enviado por e-mail.
            </p>

            <form
              data-testid="forgot-reset-form"
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (password.length < 6) {
                  toast.error("A senha precisa ter pelo menos 6 caracteres");
                  return;
                }
                reset.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="token">Código</Label>
                <Input
                  id="token"
                  required
                  data-testid="forgot-token-input"
                  className="h-12 bg-white font-mono"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  data-testid="forgot-new-password-input"
                  placeholder="Mínimo de 6 caracteres"
                  className="h-12 bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                data-testid="forgot-reset-button"
                disabled={reset.isPending}
                className="h-12 w-full rounded-xl bg-indigo-700 font-bold text-white hover:bg-indigo-800"
              >
                {reset.isPending ? "Salvando…" : "Redefinir senha"}
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}
