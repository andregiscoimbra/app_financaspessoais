-- =============================================================================
-- 20260422000005_recurring_function.sql
-- Cria a função que gera transações das recorrências vigentes para o dia atual.
-- A função é:
--   - SECURITY DEFINER → roda com as permissões do dono (bypassa RLS internamente)
--   - idempotente → não cria transações duplicadas se rodar 2x no mesmo dia
--   - respeita vigência (vigente_desde/vigente_ate) e ativa = true
--   - trata dias além do último do mês (ex: dia 31 em fev → usa 28/29)
--
-- A agendagem automática (pg_cron) fica em supabase/cron-setup.sql — rodar
-- APÓS habilitar a extensão pg_cron no painel do Supabase.
-- =============================================================================

create or replace function public.generate_recurring_transactions_today()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count int := 0;
  today_date date := current_date;
  today_day int := extract(day from today_date)::int;
  last_day int := extract(
    day from (date_trunc('month', today_date) + interval '1 month - 1 day')
  )::int;
  is_last_day boolean := today_day = last_day;
begin
  insert into public.transactions (
    user_id,
    tipo,
    valor,
    data,
    descricao,
    estabelecimento,
    categoria_id,
    meio_pagamento,
    recorrencia_id
  )
  select
    r.user_id,
    r.tipo,
    r.valor,
    today_date,
    r.descricao,
    r.estabelecimento,
    r.categoria_id,
    r.meio_pagamento,
    r.id
  from public.recurring_transactions r
  where r.ativa = true
    and r.vigente_desde <= today_date
    and (r.vigente_ate is null or r.vigente_ate >= today_date)
    and (
      -- Dia normal coincide
      r.dia_do_mes = today_day
      -- Ou: é último dia do mês e a recorrência pedia um dia que não existe
      or (is_last_day and r.dia_do_mes > last_day)
    )
    -- Idempotência: não duplicar se já tem transação pra essa recorrência HOJE
    and not exists (
      select 1
      from public.transactions t
      where t.recorrencia_id = r.id
        and t.data = today_date
    );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

-- Permite que usuários autenticados chamem a função via Supabase RPC.
-- (A função em si é SECURITY DEFINER, então roda com permissões do owner.)
grant execute on function public.generate_recurring_transactions_today()
  to authenticated;
