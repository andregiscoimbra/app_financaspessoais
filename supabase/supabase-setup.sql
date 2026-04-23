-- #############################################################################
-- # SUPABASE SETUP — Dashboard de Finanças Pessoais
-- #
-- # Arquivo único com as 4 migrations concatenadas, na ordem correta:
-- #   1. initial_schema        → cria as 5 tabelas
-- #   2. rls_policies          → liga Row Level Security em todas
-- #   3. triggers              → atualiza updated_at automaticamente
-- #   4. seed_categories       → trigger que cria as categorias iniciais
-- #
-- # Como usar:
-- #   1. Abra o painel do projeto Supabase (app.supabase.com)
-- #   2. Menu lateral → SQL Editor → New query
-- #   3. Copie TUDO deste arquivo e cole no editor
-- #   4. Clique em Run (ou Cmd/Ctrl + Enter)
-- #
-- # É seguro rodar mais de uma vez (usa "create ... if not exists" onde
-- # possível). Se alguma policy/trigger já existir, o SQL vai falhar nela
-- # especificamente — basta remover o bloco correspondente e rodar de novo.
-- #############################################################################


-- =============================================================================
-- PARTE 1 — initial_schema: cria as 5 tabelas principais.
-- Referência: PRD §6 (Modelo de dados).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- categories: categorias de receita e despesa.
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  icone text,
  cor text,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_user_tipo_idx
  on public.categories (user_id, tipo)
  where ativa = true;

-- -----------------------------------------------------------------------------
-- recurring_transactions: transações que se repetem todo mês (ex: condomínio).
-- Criada antes de transactions porque transactions.recorrencia_id referencia ela.
-- -----------------------------------------------------------------------------
create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('receita', 'despesa')),
  valor numeric(12, 2) not null check (valor > 0),
  descricao text not null,
  estabelecimento text,
  categoria_id uuid not null,
  meio_pagamento text check (meio_pagamento in ('debito', 'credito', 'pix', 'dinheiro', 'outro')),
  dia_do_mes int not null check (dia_do_mes between 1 and 31),
  vigente_desde date not null,
  vigente_ate date,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_transactions_categoria_fk
    foreign key (categoria_id) references public.categories (id) on delete restrict
);

create index if not exists recurring_transactions_user_ativa_idx
  on public.recurring_transactions (user_id, ativa)
  where ativa = true;

-- -----------------------------------------------------------------------------
-- transactions: lançamentos de receitas e despesas.
-- -----------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('receita', 'despesa')),
  valor numeric(12, 2) not null check (valor > 0),
  data date not null,
  estabelecimento text,
  descricao text not null,
  categoria_id uuid not null,
  meio_pagamento text check (meio_pagamento in ('debito', 'credito', 'pix', 'dinheiro', 'outro')),
  recorrencia_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_categoria_fk
    foreign key (categoria_id) references public.categories (id) on delete restrict,
  constraint transactions_recorrencia_fk
    foreign key (recorrencia_id) references public.recurring_transactions (id) on delete set null
);

create index if not exists transactions_user_data_idx
  on public.transactions (user_id, data desc);

create index if not exists transactions_user_categoria_idx
  on public.transactions (user_id, categoria_id);

-- -----------------------------------------------------------------------------
-- budgets: metas mensais de gasto por categoria.
-- Uma categoria pode ter várias linhas (histórico). A meta vigente é a que
-- tem vigente_ate IS NULL ou vigente_ate >= hoje.
-- -----------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categoria_id uuid not null,
  valor_mensal numeric(12, 2) not null check (valor_mensal >= 0),
  vigente_desde date not null,
  vigente_ate date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_categoria_fk
    foreign key (categoria_id) references public.categories (id) on delete cascade,
  constraint budgets_vigencia_check check (vigente_ate is null or vigente_ate >= vigente_desde)
);

create index if not exists budgets_user_categoria_idx
  on public.budgets (user_id, categoria_id);

-- -----------------------------------------------------------------------------
-- ai_insights: cache de insights gerados pela IA (Claude Haiku) por mês.
-- TTL de 1 dia é aplicado na camada de aplicação; esta tabela só guarda.
-- -----------------------------------------------------------------------------
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ref_month date not null,
  insights jsonb not null,
  generated_at timestamptz not null default now(),
  unique (user_id, ref_month)
);
-- =============================================================================
-- PARTE 2 — rls_policies: Row Level Security em todas as tabelas.
-- Policy padrão: "o usuário só enxerga seus próprios registros".
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
-- =============================================================================
-- PARTE 3 — triggers: atualiza o campo updated_at automaticamente em qualquer
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
-- =============================================================================
-- PARTE 4 — seed_categories_trigger: quando um novo usuário se cadastra em
-- auth.users, popula automaticamente suas 17 categorias de despesa + 6 de
-- receita iniciais (espelhando a planilha Excel atual do André).
-- Referência: PRD §5.3.
-- =============================================================================

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Categorias de despesa (17)
  insert into public.categories (user_id, nome, tipo, icone, cor) values
    (new.id, 'Alimentação',          'despesa', 'utensils',        '#ef4444'),
    (new.id, 'Produtos de limpeza',  'despesa', 'spray-can',       '#f97316'),
    (new.id, 'Higiene pessoal',      'despesa', 'droplet',         '#14b8a6'),
    (new.id, 'Academia',             'despesa', 'dumbbell',        '#22c55e'),
    (new.id, 'Beleza',                'despesa', 'sparkles',        '#ec4899'),
    (new.id, 'Casa',                 'despesa', 'home',            '#3b82f6'),
    (new.id, 'Celular',              'despesa', 'smartphone',      '#06b6d4'),
    (new.id, 'Combustível',          'despesa', 'fuel',            '#eab308'),
    (new.id, 'Educação',             'despesa', 'graduation-cap',  '#8b5cf6'),
    (new.id, 'Eletrônicos',          'despesa', 'laptop',          '#6366f1'),
    (new.id, 'Lazer',                'despesa', 'gamepad-2',       '#a855f7'),
    (new.id, 'Presente',             'despesa', 'gift',            '#d946ef'),
    (new.id, 'Roupas',               'despesa', 'shirt',           '#f43f5e'),
    (new.id, 'Saúde',                'despesa', 'heart-pulse',     '#10b981'),
    (new.id, 'Social/Igreja',        'despesa', 'users',           '#84cc16'),
    (new.id, 'Transporte trabalho',  'despesa', 'briefcase',       '#0ea5e9'),
    (new.id, 'Transporte geral',     'despesa', 'car',             '#64748b');

  -- Categorias de receita (6)
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

-- Executa a função quando um novo usuário é criado em auth.users.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();
