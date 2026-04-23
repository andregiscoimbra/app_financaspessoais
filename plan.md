# Plano de desenvolvimento — Dashboard de Finanças Pessoais

> Roadmap vivo das fases 0–8. Atualize os checkboxes à medida que as features forem implementadas. Referência completa em [PRD.md](./PRD.md) §10 e §5.

## Fase 0 — Setup ✅

Scaffolding do projeto: estrutura de pastas, configs, migrations e documentação base.

- [x] `package.json`, `tsconfig.json`, `next.config.mjs`, Tailwind, shadcn
- [x] Árvore de pastas completa (`app/`, `components/`, `lib/`, `types/`, `hooks/`, `supabase/`)
- [x] Migrations SQL: schema inicial, RLS policies, triggers de `updated_at`, seed automático de categorias por novo usuário
- [x] Clients do Supabase (`client.ts`, `server.ts`, `middleware.ts`)
- [x] Utilitários: `cn`, `format` (BRL, datas PT-BR), `dates` (mês/período)
- [x] Tipos de domínio em `types/index.ts`
- [x] `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `middleware.ts`
- [x] `.env.local.example`, `.gitignore`, `.eslintrc`, `.prettierrc`
- [x] CLAUDE.md, plan.md, README.md, PRD.md

## Fase 1 — Autenticação ✅

Login por e-mail/senha via Supabase Auth.

- [x] Tela `/login` com design elaborado (sem landing — split screen com painel de brand no desktop)
- [x] Tela `/signup` (com estado de "cadastro criado / verifique seu e-mail")
- [x] Tela `/forgot-password` (envio de e-mail via Supabase)
- [x] Atualizar `middleware.ts` para redirecionamento:
  - não logado em rota protegida → `/login`
  - logado em `/login|/signup|/forgot-password` → `/dashboard`
- [x] Logout no header (dropdown do avatar)
- [x] Layout `app/(dashboard)/layout.tsx` com sidebar (desktop) + bottom tab (mobile) + header
- [x] Toast de feedback (sonner) em erros de auth
- [x] Rota `/auth/callback` para confirmação de email e reset de senha
- [x] Placeholders para as 6 rotas autenticadas (dashboard/transações/categorias/metas/recorrências/configurações)

## Fase 2 — CRUD de Transações ✅

- [x] Página `/transacoes` com tabela paginada (server-side, 50/página)
- [x] Filtros: período, tipo, categoria (multi), meio de pagamento (multi), busca texto (com debounce)
- [x] Formulário de criar/editar (drawer full-screen no mobile, modal no desktop) com React Hook Form + Zod
- [x] Ação de excluir com confirmação (AlertDialog)
- [x] Ação de duplicar (cria cópia com a data de hoje)
- [x] Lista compacta "Últimas 5 transações" no dashboard
- [x] Visualização em tabela no desktop, cards empilhados no mobile
- [x] Totais por tipo (receita/despesa) visíveis acima da tabela
- [ ] **Atalhos/templates** de transação — deixado para fase posterior; a feature de duplicar já cobre boa parte do caso de uso

## Fase 3 — Categorias + Metas ✅

- [x] Página `/categorias`: listar agrupado por tipo, criar, renomear, ativar/desativar
- [x] Picker de cor (18 swatches) e de ícone (36 ícones Lucide curados)
- [x] Página `/metas`: formulário em massa com input por categoria (agrupado em Necessidades/Desejos)
- [x] Salvar em `budgets` respeitando `vigente_desde`/`vigente_ate` (encerra vigências antigas ao salvar novas)
- [x] Mostrar % do orçamento total que cada meta representa (calculado em tempo real no form)
- [x] Card de distribuição 50/30/20 com barras de progresso, marcador de referência e feedback "dentro/fora da faixa"
- [x] Total mensal sticky no topo do formulário

## Fase 4 — Dashboard ✅

- [x] Filtro de mês/ano no topo (default: mês atual, navegação via URL `?ref=YYYY-MM`)
- [x] Cards de resumo (Receita, Despesa, Saldo, Taxa de poupança) com delta vs. mês anterior e setas coloridas
- [x] Barra de progresso geral do orçamento (verde/amarelo/vermelho)
- [x] Gráfico donut: distribuição de despesas por categoria (Recharts, top 7 + "Outros")
- [x] Gráfico de barras horizontal: gasto vs. meta (top 10, colorido por % da meta)
- [x] Gráfico de linha: receita/despesa/saldo dos últimos 6 meses (Recharts LineChart)
- [x] Card 50/30/20 reutilizável (gasto real no dashboard, orçado em /metas)
- [x] Seção de insights IA (placeholder até Fase 6)
- [x] Query consolidada (3 round-trips paralelos ao Supabase)

## Fase 5 — Recorrências ✅

- [x] Página `/recorrencias`: CRUD completo (tipo, valor, descrição, estabelecimento, categoria, meio, dia do mês, vigência, ativa/pausada)
- [x] Função SQL `generate_recurring_transactions_today()` em `supabase/migrations/20260422000005_recurring_function.sql`:
  - busca recorrências ativas onde `dia_do_mes = EXTRACT(DAY FROM CURRENT_DATE)`
  - fallback automático para último dia do mês (dia 31 em fev → 28/29)
  - insere em `transactions` com `recorrencia_id` referenciado
  - idempotente (não duplica se rodar 2× no mesmo dia)
- [x] Agendamento pg_cron em `supabase/cron-setup.sql` (opcional, 06:00 UTC = 03:00 Brasília)
- [x] Botão **"Executar hoje agora"** na página `/recorrencias` (trigger manual + teste)
- [x] Indicador visual nas transações geradas por recorrência (ícone Repeat pequeno)

## Fase 6 — Insights IA + Alertas de orçamento ✅

- [x] API Route `/api/insights`:
  - busca agregados do mês atual e anterior
  - chama Claude Haiku (`claude-haiku-4-5-20251001`) com prompt estruturado
  - salva/lê cache em `ai_insights` (TTL 24h, upsert por user_id + ref_month)
  - falha graciosamente (503 se chave ausente, 502 se API falhar, 200+empty se sem dados)
- [x] Componente `<InsightsList />` no dashboard (client — fetch com skeleton, erro amigável)
- [x] Banner de alerta: categoria em 80% → aviso amarelo; 100% → vermelho
- [x] Dispensar alerta (localStorage `dismissed_budget_alerts_v1` com key por mês)

## Fase 7 — Export CSV + Dark mode + Polimento mobile ✅

- [x] Botão "Exportar CSV" em `/transacoes` (respeita filtros atuais, exceto `page`)
  - API Route `/api/export-csv` — UTF-8 com BOM, separador `;`, decimal `,`, até 10.000 linhas
  - Colunas: Data, Tipo, Categoria, Descrição, Estabelecimento, Meio de Pagamento, Valor
- [x] `ThemeProvider` (next-themes) no layout raiz + viewport themeColor para light/dark
- [x] `ThemeToggle` no header com 3 opções: Claro, Escuro, Sistema (padrão)
- [x] Layout responsivo já alinhado (Fases 1–6): sidebar → bottom tab, tabelas → cards, diálogos → drawer full-screen mobile
- [ ] Lighthouse ≥ 90 em Performance e Accessibility — a medir no deploy de produção

## Fase 8 — Deploy

- [ ] Projeto criado na Vercel + integração com Git
- [ ] Variáveis de ambiente configuradas
- [ ] Supabase em produção com migrations aplicadas
- [ ] `pg_cron` habilitado no Supabase para a Edge Function
- [ ] Domínio configurado (opcional)
- [ ] Smoke test em produção: signup → cadastrar transação → ver dashboard

## Testes E2E mínimos (Definition of Done)

- [ ] Signup + login
- [ ] Cadastro de transação
- [ ] Visualização do dashboard com 1+ transações
