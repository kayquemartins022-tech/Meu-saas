// Hand-written mirrors of backend/models/schemas.py — keep both sides in sync.

export interface UserPublic {
  id: string;
  email: string;
  business_name: string | null;
  owner_name: string | null;
  segment: string | null;
  phone: string | null;
  onboarded: boolean;
}

export interface MessageOut {
  message: string;
}

export interface ResetTokenOut {
  token: string;
  message: string;
}

export interface ClientInput {
  name: string;
  phone: string;
  email: string;
  plan_value: number;
  next_due_date: string;
  status: string;
  notes: string;
}

export interface Client extends ClientInput {
  id: string;
  user_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  amount: number;
  method: string;
  paid_at: string;
  created_at: string;
}

export interface DueItem {
  id: string;
  name: string;
  phone: string;
  plan_value: number;
  next_due_date: string;
  days: number;
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
