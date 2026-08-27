# ClientePro — SPEC

SaaS de gestão de clientes para pequenos negócios (pt-BR).
Etapa 1: base/estrutura. Etapa 2: funcionalidades principais (CRUDs, status automáticos, WhatsApp).

## Stack
farm-ts: FastAPI + motor/MongoDB (backend, `/api`) · Vite + React 19 + TS strict + Tailwind v4 + shadcn (frontend).

## Auth
E-mail + senha (PBKDF2-SHA256). Sessão = token opaco em cookie httpOnly `cp_session` (30 dias,
**janela deslizante**: `optional_user` renova a expiração enquanto a sessão é usada), coleção
`sessions`. `GET /api/auth/session` devolve `UserPublic | null`.

**Estado de auth (`src/lib/session.ts`) é de 4 valores, não booleano** — `useAuthStatus()`:
- `loading` → splash
- `authenticated` → renderiza
- `unauthenticated` (body null ou 401/403 explícito) → **único caso** que redireciona para `/login`
- `error` (offline/5xx/cold start) → tela "Tentar novamente", **nunca** desloga

Isso corrige o bug de voltar para `/login` com sessão válida. A query de sessão usa
`retry: 2` (um blip de rede não é logout) e `refetchOnWindowFocus: false`.
`beginSession(user)` grava no cache de forma síncrona e **não** é aguardado antes do
`navigate()` — um refetch lento/com erro não pode prender o usuário no login.
`endSession()` remove os caches de dados e só então faz `setQueryData(SESSION_KEY, null)`
(nessa ordem: `queryClient.clear()` removeria os observers e a guarda não redirecionaria).
Logout exige **confirmação explícita** no diálogo `logout-confirm-dialog`.
Recuperação de senha é **MOCKED**: `POST /api/auth/forgot-password` devolve o código na resposta.

**Isolamento**: toda query de clients/payments/charges filtra por `user_id` da sessão. Nenhum
endpoint aceita `user_id` do cliente. Excluir um cliente cascateia pagamentos + cobranças dele.

## Modelo de dados (Mongo, ids uuid4 string)
- `users`: id, email, password_hash, business_name, owner_name, segment, phone, **pix_key**, onboarded
- `sessions`: token, user_id, expires_at · `reset_tokens`: email, token
- `clients`: id, user_id, name, phone, **whatsapp**, email, **service**, plan_value,
  next_due_date (ISO), status (ativo|inativo), notes, created_at
- `payments`: id, user_id, client_id, client_name, amount, method
  (pix|dinheiro|cartao|transferencia|outro), paid_at (ISO), **notes**, created_at
- `charges` (histórico de cobranças): id, user_id, client_id, kind (lembrete|vencido),
  message, channel, created_at

## Status automático (derivado, nunca armazenado)
`situation` + `days` são calculados no backend (`_situation`) a cada leitura, comparando
`next_due_date` com a data do servidor (UTC):
- `inativo` se status == inativo · `vencido` days<0 · `vencendo_hoje` days==0
- `vence_em_breve` 1..7 dias · `ativo` acima de 7 dias
Ou seja, o status muda sozinho conforme o dia — não há job nem campo persistido.

## Endpoints (todos sob /api)
auth: POST register, login, logout, onboarding, forgot-password, reset-password ·
GET me, session · **PUT /auth/settings** (negócio + pix_key)
clients: GET/POST /clients · GET/PUT/DELETE /clients/{id} · **GET /clients/{id}/detail**
(cliente + pagamentos + cobranças + total_paid) · **POST /clients/{id}/charges**
payments: GET/POST /payments · **PUT/DELETE /payments/{id}**
dashboard: GET /dashboard

Regras: `POST /payments` avança `next_due_date` em 1 mês quando `advance_due_date` = true
(padrão; a UI permite desmarcar para pagamentos avulsos).

## Rotas do frontend
`/` landing · `/login` · `/cadastro` · `/recuperar-senha` · `/onboarding`
`/app/dashboard` · `/app/clientes` (busca + 6 filtros + 5 ordenações) ·
**`/app/clientes/:id`** (dados, status, histórico de pagamentos e de cobranças, ações) ·
`/app/pagamentos` (CRUD + filtro por método) · `/app/configuracoes` (edição do negócio + PIX)
`/app/financeiro`, `/app/calendario`, `/app/lembretes`, `/app/relatorios` (placeholders)

## WhatsApp / cobranças
`src/lib/charge.ts` → `useCharge()`: escolhe a mensagem (lembrete se days>=0, cobrança de
atraso se days<0), anexa a chave PIX quando existir, abre `wa.me` com o texto pré-preenchido e
grava o registro em `charges`. Número usado: `whatsapp` do cliente, com fallback para `phone`.
Sem número, a mensagem é copiada para a área de transferência.

## Seed
`cd /app/backend && python seed.py` — idempotente. Conta demo com 9 clientes (2 vencidos,
2 vencendo hoje, 2 em breve, 1 inativo) e 5 pagamentos; e uma segunda conta com 1 cliente
próprio, usada para verificar o isolamento entre usuários.
