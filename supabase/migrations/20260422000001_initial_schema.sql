-- =============================================================================
-- 20260422000001_initial_schema.sql
-- Cria as 5 tabelas principais do Dashboard de Finanças Pessoais.
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
