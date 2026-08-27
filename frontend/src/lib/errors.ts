import { ApiError } from "@/lib/api";

interface ValidationItem {
  loc?: unknown[];
  msg?: string;
}

/**
 * Turns any thrown request error into a message worth showing the user.
 * FastAPI sends `detail` as a string (HTTPException) or as an array of validation
 * items (422) — a generic "não foi possível salvar" hides both and makes real bugs
 * impossible to diagnose from the UI.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Sua sessão expirou. Entre novamente para continuar.";
    if (err.status === 403) return "Você não tem permissão para esta ação.";

    const body = err.body as { detail?: unknown } | null;
    const detail = body?.detail;

    if (typeof detail === "string" && detail.trim()) return detail;

    if (Array.isArray(detail)) {
      const parts = (detail as ValidationItem[])
        .map((item) => {
          const field = Array.isArray(item.loc)
            ? String(item.loc[item.loc.length - 1] ?? "")
            : "";
          const label = FIELD_LABELS[field] ?? field;
          return label ? `${label}: ${item.msg ?? "inválido"}` : (item.msg ?? "");
        })
        .filter(Boolean);
      if (parts.length) return parts.join(" · ");
    }

    if (err.status >= 500) return "O servidor falhou ao processar. Tente novamente.";
  }

  // No ApiError at all means the request never completed (offline / DNS / CORS).
  if (err instanceof TypeError) return "Sem conexão com o servidor. Verifique sua internet.";

  return fallback;
}

/** Returns true when the failure means "you are no longer logged in". */
export function isAuthError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  phone: "Telefone",
  whatsapp: "WhatsApp",
  email: "E-mail",
  service: "Serviço",
  plan_value: "Valor",
  next_due_date: "Vencimento",
  status: "Status",
  notes: "Observações",
  business_name: "Nome do negócio",
  owner_name: "Responsável",
  segment: "Segmento",
  amount: "Valor",
  paid_at: "Data",
  method: "Método",
  password: "Senha",
};

/** Parses a money input tolerantly: "150,50" / "R$ 150,50" / "" → never NaN. */
export function parseMoney(raw: string): number {
  if (!raw?.trim()) return 0;
  let cleaned = raw.replace(/[^\d,.-]/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(",", ".");
  }
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
