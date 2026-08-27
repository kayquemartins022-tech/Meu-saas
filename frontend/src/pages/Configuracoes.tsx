import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Save } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
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
import { apiPut } from "@/lib/api";
import { SESSION_KEY, useSession, useSessionActions } from "@/lib/session";
import { SEGMENTOS } from "@/lib/types";
import type { SettingsInput, UserPublic } from "@/lib/types";

export default function Configuracoes() {
  const { data: user } = useSession();
  const { endSession } = useSessionActions();
  const qc = useQueryClient();

  const [form, setForm] = useState<SettingsInput>({
    business_name: "",
    owner_name: "",
    segment: "",
    phone: "",
    pix_key: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      business_name: user.business_name ?? "",
      owner_name: user.owner_name ?? "",
      segment: user.segment ?? "",
      phone: user.phone ?? "",
      pix_key: user.pix_key ?? "",
    });
  }, [user]);

  const save = useMutation({
    mutationFn: () => apiPut<UserPublic>("/auth/settings", form),
    onSuccess: async (updated) => {
      qc.setQueryData(SESSION_KEY, updated);
      await qc.invalidateQueries({ queryKey: SESSION_KEY });
      toast.success("Dados atualizados");
    },
    onError: () => toast.error("Não foi possível salvar os dados"),
  });

  return (
    <AppShell title="Configurações" subtitle="Dados da sua conta, do negócio e da cobrança.">
      <form
        data-testid="config-form"
        className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.business_name.trim() || !form.owner_name.trim() || !form.segment.trim()) {
            toast.error("Negócio, responsável e segmento são obrigatórios");
            return;
          }
          save.mutate();
        }}
      >
        <h2 className="text-base font-bold text-slate-900">Dados do negócio</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Estes dados aparecem no seu painel e nas mensagens de cobrança.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="s-business">Nome do negócio</Label>
            <Input
              id="s-business"
              data-testid="config-business-input"
              className="h-11"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-owner">Nome do responsável</Label>
            <Input
              id="s-owner"
              data-testid="config-owner-input"
              className="h-11"
              value={form.owner_name}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-segment">Segmento</Label>
            <Select
              value={form.segment}
              onValueChange={(v: string) => setForm({ ...form, segment: v })}
            >
              <SelectTrigger id="s-segment" data-testid="config-segment-select" className="h-11 w-full">
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTOS.map((s) => (
                  <SelectItem key={s} value={s} data-testid={`config-segment-${s}`}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-phone">Telefone / WhatsApp</Label>
            <Input
              id="s-phone"
              inputMode="tel"
              data-testid="config-phone-input"
              className="h-11"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <h2 className="mt-9 text-base font-bold text-slate-900">Cobrança</h2>
        <div className="mt-4 space-y-2 md:max-w-md">
          <Label htmlFor="s-pix">Chave PIX</Label>
          <Input
            id="s-pix"
            data-testid="config-pix-input"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            className="h-11 font-mono"
            value={form.pix_key}
            onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
          />
          <p className="text-xs text-slate-500">
            Quando preenchida, a chave é incluída automaticamente nas mensagens de cobrança.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            data-testid="config-save-button"
            disabled={save.isPending}
            className="h-11 rounded-xl bg-indigo-700 font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-indigo-800 active:scale-[0.98]"
          >
            <Save className="size-4" /> {save.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
          <span className="text-xs text-slate-500" data-testid="config-email">
            E-mail de acesso: {user?.email ?? "—"}
          </span>
        </div>
      </form>

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
