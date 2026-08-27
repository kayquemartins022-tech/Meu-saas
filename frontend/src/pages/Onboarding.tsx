import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Building2, Phone, Tag, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPost } from "@/lib/api";
import { useSession, useSessionActions } from "@/lib/session";
import { SEGMENTOS } from "@/lib/types";
import type { UserPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "business_name", label: "Nome do negócio", hint: "Como seus clientes conhecem você?", icon: Building2, placeholder: "Ex.: Studio Alpha Serviços" },
  { key: "owner_name", label: "Nome do responsável", hint: "Quem fala com os clientes?", icon: User, placeholder: "Ex.: Ana Beatriz Lima" },
  { key: "segment", label: "Segmento", hint: "Isso ajuda a adaptar seu painel.", icon: Tag, placeholder: "Selecione o segmento" },
  { key: "phone", label: "Telefone / WhatsApp", hint: "Usado nas mensagens de cobrança.", icon: Phone, placeholder: "Ex.: 11 99999-0000" },
] as const;

export default function Onboarding() {
  const { data: user, isLoading, isError } = useSession();
  const { beginSession } = useSessionActions();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    business_name: "",
    owner_name: "",
    segment: "",
    phone: "",
  });

  const mutation = useMutation({
    mutationFn: () => apiPost<UserPublic>("/auth/onboarding", form),
    onSuccess: async (updated) => {
      await beginSession(updated);
      toast.success("Tudo pronto! Bem-vindo ao ClientePro.");
      navigate("/app/dashboard", { replace: true });
    },
    onError: () => toast.error("Não foi possível salvar os dados"),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50">
        <Logo />
      </div>
    );
  }
  if (isError || !user) return <Navigate to="/login" replace />;
  if (user.onboarded) return <Navigate to="/app/dashboard" replace />;

  const current = STEPS[step];
  const value = form[current.key];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const advance = () => {
    if (!value.trim()) {
      toast.error("Preencha este campo para continuar");
      return;
    }
    if (isLast) mutation.mutate();
    else setStep(step + 1);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <div className="flex h-16 items-center px-5 md:px-10">
        <Logo />
      </div>
      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 md:items-center md:pt-0">
        <div className="w-full max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            Passo {step + 1} de {STEPS.length}
          </p>
          <div className="mt-4 flex gap-2" data-testid="onboarding-progress">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  i <= step ? "bg-indigo-700" : "bg-slate-200",
                )}
              />
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
            <span className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Icon className="size-6" />
            </span>
            <h1
              className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900"
              data-testid="onboarding-step-title"
            >
              {current.label}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">{current.hint}</p>

            <form
              className="mt-7 space-y-6"
              data-testid="onboarding-form"
              onSubmit={(e) => {
                e.preventDefault();
                advance();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="field">{current.label}</Label>
                {current.key === "segment" ? (
                  <Select
                    value={form.segment}
                    onValueChange={(v: string) => setForm({ ...form, segment: v })}
                  >
                    <SelectTrigger
                      id="field"
                      data-testid="onboarding-segment-select"
                      className="h-12 w-full bg-white"
                    >
                      <SelectValue placeholder={current.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTOS.map((s) => (
                        <SelectItem key={s} value={s} data-testid={`onboarding-segment-${s}`}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="field"
                    data-testid={`onboarding-input-${current.key}`}
                    className="h-12 bg-white"
                    placeholder={current.placeholder}
                    inputMode={current.key === "phone" ? "tel" : "text"}
                    value={value}
                    onChange={(e) => setForm({ ...form, [current.key]: e.target.value })}
                  />
                )}
              </div>

              <div className="flex gap-3">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="onboarding-back-button"
                    onClick={() => setStep(step - 1)}
                    className="h-12 rounded-xl border-slate-300 bg-white px-5 font-bold text-slate-700"
                  >
                    <ArrowLeft className="size-4" /> Voltar
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  data-testid="onboarding-next-button"
                  disabled={mutation.isPending}
                  className="h-12 flex-1 rounded-xl bg-indigo-700 text-base font-bold text-white transition-transform duration-150 hover:scale-[1.01] hover:bg-indigo-800 active:scale-[0.99]"
                >
                  {isLast
                    ? mutation.isPending
                      ? "Salvando…"
                      : "Ir para o painel"
                    : "Continuar"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
