import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { brl, digits, fullDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Charge } from "@/lib/types";

export interface ChargeTarget {
  id: string;
  name: string;
  plan_value: number;
  next_due_date: string;
  days: number;
  phone?: string;
  whatsapp?: string;
}

/** Upcoming-due reminder. */
export const reminderMessage = (t: ChargeTarget, pixKey?: string | null) =>
  `Olá, ${t.name}! Passando para lembrar que seu pagamento de ${brl(
    t.plan_value,
  )} vence em ${fullDate(t.next_due_date)}. Qualquer dúvida estou à disposição.${
    pixKey ? `\n\nChave PIX: ${pixKey}` : ""
  }`;

/** Overdue charge. */
export const overdueMessage = (t: ChargeTarget, pixKey?: string | null) => {
  const late = Math.abs(t.days);
  return `Olá, ${t.name}! Identificamos que o pagamento de ${brl(
    t.plan_value,
  )} venceu em ${fullDate(t.next_due_date)} e está ${late} ${
    late === 1 ? "dia" : "dias"
  } em atraso. Consegue regularizar hoje? Qualquer dúvida estou à disposição.${
    pixKey ? `\n\nChave PIX: ${pixKey}` : ""
  }`;
};

export const chargeNumber = (t: ChargeTarget) => digits(t.whatsapp || t.phone || "");

/**
 * Opens WhatsApp with the pre-filled message and records the charge in the client's
 * history. The kind is derived from the due date: overdue clients get the firmer copy.
 */
export function useCharge() {
  const qc = useQueryClient();
  const { data: user } = useSession();

  return async (target: ChargeTarget) => {
    const overdue = target.days < 0;
    const message = overdue
      ? overdueMessage(target, user?.pix_key)
      : reminderMessage(target, user?.pix_key);
    const number = chargeNumber(target);

    // Open the tab synchronously-ish, before the awaited log, so popup blockers stay quiet.
    if (number) {
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener",
      );
    } else {
      await navigator.clipboard?.writeText(message).catch(() => undefined);
      toast.info("Cliente sem WhatsApp cadastrado — mensagem copiada.");
    }

    try {
      await apiPost<Charge>(`/clients/${target.id}/charges`, {
        kind: overdue ? "vencido" : "lembrete",
        message,
        channel: number ? "whatsapp" : "copiado",
      });
      await qc.invalidateQueries({ queryKey: ["client", target.id] });
      if (number) toast.success(`Cobrança de ${target.name} registrada no histórico.`);
    } catch {
      toast.error("Não foi possível registrar a cobrança no histórico.");
    }
  };
}
