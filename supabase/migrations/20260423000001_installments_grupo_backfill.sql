-- =============================================================================
-- 20260423000001_installments_grupo_backfill.sql
-- Migração #6: ajustes incrementais em produção.
--
-- 1) transactions: adiciona colunas `parcela_atual` e `parcela_total`
--    para suportar compras parceladas (crédito em N vezes).
-- 2) categories: adiciona coluna `grupo_meta` para classificação 50/30/20
--    configurável pelo usuário (antes era hardcoded pelo nome).
-- 3) Backfill: preenche `grupo_meta` das categorias já existentes com base
--    nas listas que estavam hardcoded em types/index.ts.
-- 4) Função SQL `backfill_recurring_transaction(uuid)` que gera todas as
--    transações em atraso de uma recorrência (de vigente_desde até hoje).
-- 5) Atualiza o seed de novos usuários para já setar `grupo_meta`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) transactions.parcela_atual / parcela_total
-- -----------------------------------------------------------------------------
alter table public.transactions
  add column if not exists parcela_atual int,
  add column if not exists parcela_total int;

alter table public.transactions
  drop constraint if exists transactions_parcelas_check;

alter table public.transactions
  add constraint transactions_parcelas_check check (
    (parcela_atual is null and parcela_total is null)
    or (
      parcela_atual is not null
      and parcela_total is not null
      and parcela_total between 2 and 60
      and parcela_atual between 1 and parcela_total
    )
  );

-- -----------------------------------------------------------------------------
-- 2) categories.grupo_meta
-- -----------------------------------------------------------------------------
alter table public.categories
  add column if not exists grupo_meta text;

alter table public.categories
  drop constraint if exists categories_grupo_meta_check;

alter table public.categories
  add constraint categories_grupo_meta_check check (
    grupo_meta is null or grupo_meta in ('necessidades', 'desejos')
  );

-- -----------------------------------------------------------------------------
-- 3) Backfill do grupo_meta nas categorias existentes (segue a regra antiga).
--    Só aplica em categorias de despesa; receita permanece null.
-- -----------------------------------------------------------------------------
update public.categories
set grupo_meta = 'necessidades'
where tipo = 'despesa'
  and grupo_meta is null
  and nome in (
    'Casa', 'Alimentação', 'Celular', 'Combustível',
    'Higiene pessoal', 'Produtos de limpeza', 'Saúde',
    'Transporte trabalho', 'Educação'
  );

update public.categories
set grupo_meta = 'desejos'
where tipo = 'despesa'
  and grupo_meta is null;

-- -----------------------------------------------------------------------------
-- 4) Seed de categorias default: agora já inclui grupo_meta.
-- -----------------------------------------------------------------------------
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Despesas — necessidades
  insert into public.categories (user_id, nome, tipo, icone, cor, grupo_meta) values
    (new.id, 'Alimentação',          'despesa', 'utensils',        '#ef4444', 'necessidades'),
    (new.id, 'Produtos de limpeza',  'despesa', 'spray-can',       '#f97316', 'necessidades'),
    (new.id, 'Higiene pessoal',      'despesa', 'droplet',         '#14b8a6', 'necessidades'),
    (new.id, 'Casa',                 'despesa', 'home',            '#3b82f6', 'necessidades'),
    (new.id, 'Celular',              'despesa', 'smartphone',      '#06b6d4', 'necessidades'),
    (new.id, 'Combustível',          'despesa', 'fuel',            '#eab308', 'necessidades'),
    (new.id, 'Educação',             'despesa', 'graduation-cap',  '#8b5cf6', 'necessidades'),
    (new.id, 'Saúde',                'despesa', 'heart-pulse',     '#10b981', 'necessidades'),
    (new.id, 'Transporte trabalho',  'despesa', 'briefcase',       '#0ea5e9', 'necessidades');

  -- Despesas — desejos
  insert into public.categories (user_id, nome, tipo, icone, cor, grupo_meta) values
    (new.id, 'Academia',             'despesa', 'dumbbell',        '#22c55e', 'desejos'),
    (new.id, 'Beleza',               'despesa', 'sparkles',        '#ec4899', 'desejos'),
    (new.id, 'Eletrônicos',          'despesa', 'laptop',          '#6366f1', 'desejos'),
    (new.id, 'Lazer',                'despesa', 'gamepad-2',       '#a855f7', 'desejos'),
    (new.id, 'Presente',             'despesa', 'gift',            '#d946ef', 'desejos'),
    (new.id, 'Roupas',               'despesa', 'shirt',           '#f43f5e', 'desejos'),
    (new.id, 'Social/Igreja',        'despesa', 'users',           '#84cc16', 'desejos'),
    (new.id, 'Transporte geral',     'despesa', 'car',             '#64748b', 'desejos');

  -- Receitas (grupo_meta fica null — não se aplica)
  insert into public.categories (user_id, nome, tipo, icone, cor) values
    (new.id, 'Salário',              'receita', 'wallet',          '#16a34a'),
    (new.id, 'Freelance',            'receita', 'briefcase',       '#0891b2'),
    (new.id, 'Dividendos',           'receita', 'trending-up',     '#7c3aed'),
    (new.id, 'Reembolso',            'receita', 'undo-2',          '#0d9488'),
    (new.id, 'Presente recebido',    'receita', 'gift',            '#db2777'),
    (new.id, 'Outros',               'receita', 'circle',          '#6b7280');

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5) Função `backfill_recurring_transaction(uuid)`:
--    Gera transações em atraso para uma recorrência específica, do mês de
--    `vigente_desde` até o mês atual (limitado por `vigente_ate`).
--
--    É idempotente: não duplica transações já criadas (compara por
--    recorrencia_id + data). Também trata dias inexistentes no mês
--    (ex: dia 31 em fev → último dia do mês).
-- -----------------------------------------------------------------------------
create or replace function public.backfill_recurring_transaction(p_recorrencia_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  cursor_month date;
  target_day int;
  last_day_of_cursor int;
  target_date date;
  end_limit date;
  inserted_count int := 0;
begin
  select * into r
  from public.recurring_transactions
  where id = p_recorrencia_id
    and user_id = auth.uid();

  if not found then
    return 0;
  end if;

  -- Limite superior: menor entre hoje e vigente_ate (se definido).
  end_limit := current_date;
  if r.vigente_ate is not null and r.vigente_ate < end_limit then
    end_limit := r.vigente_ate;
  end if;

  -- Itera mês a mês de vigente_desde até end_limit
  cursor_month := date_trunc('month', r.vigente_desde)::date;

  while cursor_month <= end_limit loop
    last_day_of_cursor := extract(
      day from (cursor_month + interval '1 month - 1 day')
    )::int;

    -- dia_do_mes cai em dia que não existe (ex: 31 em fev) → usa último dia
    target_day := least(r.dia_do_mes, last_day_of_cursor);
    target_date := cursor_month + (target_day - 1);

    -- Só gera se a data efetiva cai dentro da janela [vigente_desde, end_limit]
    if target_date >= r.vigente_desde and target_date <= end_limit then
      insert into public.transactions (
        user_id, tipo, valor, data, descricao, estabelecimento,
        categoria_id, meio_pagamento, recorrencia_id
      )
      select
        r.user_id, r.tipo, r.valor, target_date, r.descricao, r.estabelecimento,
        r.categoria_id, r.meio_pagamento, r.id
      where not exists (
        select 1 from public.transactions t
        where t.recorrencia_id = r.id and t.data = target_date
      );

      if found then
        inserted_count := inserted_count + 1;
      end if;
    end if;

    cursor_month := (cursor_month + interval '1 month')::date;
  end loop;

  return inserted_count;
end;
$$;

grant execute on function public.backfill_recurring_transaction(uuid) to authenticated;
