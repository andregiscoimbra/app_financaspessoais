-- =============================================================================
-- 20260422000002_rls_policies.sql
-- Liga Row Level Security (RLS) em todas as tabelas e aplica a policy padrão
-- "o usuário só enxerga seus próprios registros".
-- Referência: PRD §6 (RLS obrigatório).
-- =============================================================================

-- Ativa RLS em todas as tabelas com dados do usuário.
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.ai_insights enable row level security;

-- -----------------------------------------------------------------------------
-- Policies: um usuário só pode SELECT/INSERT/UPDATE/DELETE registros onde
-- user_id = auth.uid(). Padrão idêntico em todas as tabelas.
-- -----------------------------------------------------------------------------

-- categories
create policy "categories_owner_all"
  on public.categories
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- transactions
create policy "transactions_owner_all"
  on public.transactions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- budgets
create policy "budgets_owner_all"
  on public.budgets
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- recurring_transactions
create policy "recurring_transactions_owner_all"
  on public.recurring_transactions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ai_insights
create policy "ai_insights_owner_all"
  on public.ai_insights
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
