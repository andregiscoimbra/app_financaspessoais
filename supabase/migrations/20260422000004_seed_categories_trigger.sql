-- =============================================================================
-- 20260422000004_seed_categories_trigger.sql
-- Trigger on_auth_user_created: quando um novo usuário se cadastra em
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
