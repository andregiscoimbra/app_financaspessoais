-- =============================================================================
-- 20260422000003_triggers.sql
-- Trigger genérico que atualiza o campo updated_at automaticamente em qualquer
-- UPDATE nas tabelas que têm esse campo.
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Aplica o trigger em todas as tabelas com updated_at.
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create trigger recurring_transactions_set_updated_at
  before update on public.recurring_transactions
  for each row execute function public.set_updated_at();
