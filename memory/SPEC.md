# ClientePro — SPEC

SaaS de gestão de clientes para pequenos negócios (pt-BR). Etapa 1: base estável.

## Stack
farm-ts: FastAPI + motor/MongoDB (backend, `/api`) · Vite + React 19 + TS strict + Tailwind v4 + shadcn (frontend).

## Auth
E-mail + senha (PBKDF2-SHA256). Sessão = token opaco em cookie httpOnly `cp_session` (30 dias),
coleção `sessions`. `GET /api/auth/session` devolve `UserPublic | null` (não lança) e é a fonte
do estado de auth no frontend (`src/lib/session.ts`). Logout sempre via `endSession()`.
Recuperação de senha é **MOCKED**: `POST /api/auth/forgot-password` devolve o código na resposta
(nenhum e-mail é enviado); `POST /api/auth/reset-password` troca a senha.

## Modelo de dados (Mongo, ids uuid4 string)
- `users`: id, email, password_hash, business_name, owner_name, segment, phone, onboarded
- `sessions`: token, user_id, expires_at
- `reset_tokens`: email, token
- `clients`: id, user_id, name, phone, email, plan_value, next_due_date (ISO yyyy-mm-dd), status (ativo|inativo), notes
- `payments`: id, user_id, client_id, client_name, amount, method, paid_at (ISO)

Todo dado é filtrado por `user_id` da sessão — nenhuma conta vê dados de outra.

## Endpoints (todos sob /api)
auth: POST register, login, logout, onboarding, forgot-password, reset-password · GET me, session
app: GET/POST /clients · GET/PUT/DELETE /clients/{id} · GET/POST /payments · GET /dashboard

Regras: registrar pagamento avança `next_due_date` do cliente em 1 mês.
Dashboard calcula (data do servidor, UTC): ativos, vencendo hoje (days==0), em breve (1..7),
vencidos (days<0), faturamento do mês (soma de payments do mês corrente), pendentes
(soma de plan_value dos vencidos + vencendo hoje), além das listas de próximos vencimentos
e atrasados.

## Rotas do frontend
`/` landing · `/login` · `/cadastro` · `/recuperar-senha` · `/onboarding` (4 passos)
`/app/dashboard` · `/app/clientes` (CRUD real) · `/app/pagamentos` (lista + registro)
`/app/financeiro`, `/app/calendario`, `/app/lembretes`, `/app/relatorios` (placeholders "em construção")
`/app/configuracoes` (dados da conta + logout)

Páginas privadas protegidas por `AppShell` (redireciona para `/login` sem sessão, e para
`/onboarding` se `onboarded === false`).

## Seed
`cd /app/backend && python seed.py` — idempotente, cria a conta demo com 9 clientes
(alguns em atraso, vencendo hoje e em breve) e 5 pagamentos do mês.
