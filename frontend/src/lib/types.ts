// Hand-written mirrors of backend/models/schemas.py — keep both sides in sync.

export interface UserPublic {
  id: string;
  email: string;
  business_name: string | null;
  owner_name: string | null;
  segment: string | null;
  phone: string | null;
  pix_key: string | null;
  onboarded: boolean;
}

export interface MessageOut {
  message: string;
}

export interface ResetTokenOut {
  token: string;
  message: string;
}

export interface SettingsInput {
  business_name: string;
  owner_name: string;
  segment: string;
  phone: string;
  pix_key: string;
}

export interface ClientInput {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  service: string;
  plan_value: number;
  next_due_date: string;
  status: string; // ativo | inativo
  notes: string;
}

export interface Client extends ClientInput {
  id: string;
  user_id: string;
  created_at: string;
  situation: Situation;
  days: number;
}

export type Situation = "ativo" | "vencendo_hoje" | "vence_em_breve" | "vencido" | "inativo";

export interface Payment {
  id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  amount: number;
  method: string;
  paid_at: string;
  notes: string;
  created_at: string;
}

export interface PaymentUpdate {
  amount: number;
  method: string;
  paid_at: string;
  notes: string;
}

export interface Charge {
  id: string;
  user_id: string;
  client_id: string;
  kind: string; // lembrete | vencido
  message: string;
  channel: string;
  created_at: string;
}

export interface ClientDetail {
  client: Client;
  payments: Payment[];
  charges: Charge[];
  total_paid: number;
  payments_count: number;
}

export interface DueItem {
  id: string;
  name: string;
  phone: string;
  plan_value: number;
  next_due_date: string;
  days: number;
  situation: Situation;
}

export interface DashboardSummary {
  today: string;
  clientes_ativos: number;
  vencendo_hoje: number;
  vencendo_em_breve: number;
  vencidos: number;
  faturamento_mes: number;
  pagamentos_pendentes: number;
  proximos_vencimentos: DueItem[];
  clientes_atrasados: DueItem[];
}

export const SEGMENTOS = [
  "Academia / Fitness",
  "Estética e Beleza",
  "Consultoria",
  "Agência Digital",
  "Saúde",
  "Educação",
  "Comércio",
  "Serviços",
  "Outro",
];

export const PAYMENT_METHODS: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

export const SITUATION_LABELS: Record<Situation, string> = {
  ativo: "Ativo",
  vencendo_hoje: "Vencendo hoje",
  vence_em_breve: "Vence em breve",
  vencido: "Vencido",
  inativo: "Inativo",
};

// Badge styling per derived situation — shared by the list, detail page and dashboard.
export const SITUATION_STYLES: Record<Situation, string> = {
  ativo: "bg-emerald-100 text-emerald-700",
  vencendo_hoje: "bg-amber-100 text-amber-800",
  vence_em_breve: "bg-indigo-100 text-indigo-700",
  vencido: "bg-rose-100 text-rose-700",
  inativo: "bg-slate-100 text-slate-500",
};
