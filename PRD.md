# PRD — Dashboard de Finanças Pessoais

**Versão:** 1.0
**Autor:** André Coimbra
**Data:** 21/04/2026
**Agente de desenvolvimento:** Claude Code

## 1. Visão geral (TL;DR)

Construir um web app pessoal de gestão financeira (Next.js 14 + Supabase + shadcn/ui) que substitua a planilha Excel que o André usa hoje, entregando:

1. Critérios claros de alocação de gastos por categoria (valor em R$ + % de referência) para resolver a falta de direcionamento financeiro.
2. Interface visual rica com gráficos (Recharts) para extrair insights que a planilha não entrega.
3. Visão consolidada de receitas, despesas, saldo e metas em um único lugar, com alertas automáticos e insights gerados por IA.

O usuário é singular (o próprio André). A app é multi-user no nível de arquitetura (Supabase Auth + RLS), mas não há funcionalidades colaborativas.

## 2. Problema

Hoje o André usa uma planilha Excel (Finanças.xlsx) com duas abas:

- Aba 1 — "Lançamento de Gastos": tabela linear (Data, Estabelecimento, Descrição, Gênero, Valor).
- Aba 2 — "Controle de Custos": matriz com linhas = categorias e colunas = meses, com uma coluna de "Metas 2026" (orçamento mensal fixo por categoria).

Problemas concretos dessa solução:

1. Não estabelece critérios de alocação. A meta por categoria é um número solto — não há referência se 1.350 de "Casa" num orçamento de 3.745 (~36%) é saudável ou não.
2. Análise visual pobre. Não há gráficos, comparativos mês a mês, nem percepção de tendências. É só uma grade de números.
3. Informação fragmentada. Receitas não são rastreadas; gastos fixos (IPTU, Condomínio, Celular) são lançados manualmente todo mês; não há visão consolidada de "saldo".
4. Fricção de lançamento. Digitar transação por transação no Excel é tedioso, o que leva a atrasos e esquecimentos.

## 3. Objetivos e métricas de sucesso

| # | Objetivo | Métrica (como mediremos) |
|---|----------|---------------------------|
| 1 | Centralizar registro de receitas e despesas | 100% das transações do mês cadastradas no app (vs. planilha) |
| 2 | Entregar clareza de alocação por categoria | Dashboard mostra % atual vs. meta por categoria, com benchmarks de referência |
| 3 | Reduzir tempo de lançamento | Lançar uma transação em ≤ 10 segundos (dropdown de atalhos + formulário leve) |
| 4 | Gerar insights acionáveis | Pelo menos 1 insight automático por mês que leve a uma decisão (cortar gasto, realocar meta) |
| 5 | Ser acessível no celular | 100% das telas funcionais em mobile (até 375px de largura) |

**Non-goals** (explicitamente fora do escopo desta v1):

- Integração com Open Finance / sincronização bancária automática.
- Gestão de investimentos (ações, renda fixa, cripto).
- Controle de fatura de cartão de crédito com fechamento/vencimento.
- Compartilhamento multi-usuário (conta conjunta, família).
- App nativo iOS/Android (só web responsivo).
- Importação de dados históricos da planilha (começa do zero).

## 4. Persona e usuários

**Usuário único:** André Coimbra, pessoa física, adulto, com conhecimento técnico.

**Cenários de uso típicos:**

1. Lançamento diário/semanal: abre o app no celular logo após um gasto, escolhe um "atalho" (Uber trabalho, Condomínio) ou preenche o formulário e confirma.
2. Fechamento mensal: acessa o dashboard no fim do mês pra revisar gastos vs. metas, ver o % de cada categoria e comparar com o mês anterior.
3. Planejamento: define/ajusta metas mensais por categoria, consulta benchmarks (50/30/20) e exporta CSV pra análises externas.

**Modelo de permissões:**

- Autenticação via Supabase Auth (e-mail + senha).
- Row Level Security no Supabase: cada usuário só acessa seus próprios registros (`user_id = auth.uid()`).
- Arquitetura preparada pra múltiplos usuários, mas sem UI colaborativa.

## 5. Funcionalidades — especificação detalhada

### 5.1 Autenticação

Login por e-mail/senha via Supabase Auth. Cadastro, login, recuperação de senha e logout. Tela de login com design elaborado (sem landing page separada).

**Critérios de aceite:**
- Rotas autenticadas (`/app/*`) redirecionam pra `/login` se não houver sessão.
- Rotas públicas (`/login`, `/signup`, `/forgot-password`) redirecionam pra `/app/dashboard` se já houver sessão.
- RLS ativa em todas as tabelas com dados do usuário.

### 5.2 CRUD de Transações

Criar, editar, excluir e listar receitas e despesas.

**Campos da transação:**

| Campo | Tipo | Obrigatório | Notas |
|-------|------|-------------|-------|
| id | uuid | sim | gerado pelo Supabase |
| user_id | uuid | sim | `auth.uid()` |
| tipo | enum | sim | `receita \| despesa` |
| valor | numeric(12,2) | sim | sempre positivo |
| data | date | sim | default: hoje |
| estabelecimento | text | não | ex: "Uber", "Amazon" |
| descricao | text | sim | ex: "Uber trabalho" |
| categoria_id | uuid | sim | FK pra categories |
| meio_pagamento | enum | não | `debito \| credito \| pix \| dinheiro \| outro` |
| recorrencia_id | uuid | não | FK pra recurring_transactions |
| created_at, updated_at | timestamptz | sim | automáticos |

**Critérios de aceite:**
- Formulário com validação (Zod + React Hook Form).
- Modal/drawer pra cadastrar transação sem sair da tela atual.
- Confirmação antes de excluir.
- Lista paginada de transações com sort por data (desc por padrão).

### 5.3 Categorias

Categorias pré-definidas (espelhando a planilha), com possibilidade de edição pelo usuário.

**Seed inicial (17 despesas):**
Alimentação, Produtos de limpeza, Higiene pessoal, Academia, Beleza, Casa, Celular, Combustível, Educação, Eletrônicos, Lazer, Presente, Roupas, Saúde, Social/Igreja, Transporte trabalho, Transporte geral.

**Seed inicial (6 receitas):**
Salário, Freelance, Dividendos, Reembolso, Presente recebido, Outros.

### 5.4 Metas de orçamento (core feature)

Define uma meta mensal por categoria em R$ fixo, e o dashboard mostra o % que essa meta representa do total orçado, além de comparar com benchmarks de referência (regra 50/30/20 agregada).

Uma categoria pode ter vários registros de meta ao longo do tempo (histórico). A meta "vigente" é a que tem `vigente_ate IS NULL` ou `vigente_ate >= hoje`.

**Benchmarks 50/30/20 (referência):**
- **Necessidades (50%):** Casa, Alimentação, Celular, Combustível, Higiene pessoal, Produtos de limpeza, Saúde, Transporte trabalho, Educação.
- **Desejos (30%):** Beleza, Lazer, Roupas, Eletrônicos, Academia, Presente, Transporte geral.
- **Poupança/Investimento (20%):** não modelada como categoria de despesa; aparece como uma meta agregada de "sobra mensal" (receitas − despesas).

### 5.5 Dashboard

Tela principal com visão consolidada do mês selecionado. Componentes (de cima pra baixo):

1. Filtro de período no topo (seletor de mês/ano, default: mês atual).
2. Cards de resumo (4 colunas desktop, 2 tablet, 1 mobile):
   - Receita Total do mês (R$, delta vs. mês anterior)
   - Despesa Total do mês (R$, delta vs. mês anterior)
   - Saldo do mês (Receita − Despesa)
   - Taxa de poupança (Saldo / Receita, em %)
3. Barra de progresso geral do orçamento (total gasto vs. soma das metas).
4. Gráfico de pizza/donut: distribuição de despesas por categoria do mês.
5. Gráfico de barras horizontal: gasto vs. meta por categoria.
6. Gráfico de linha: evolução mensal dos últimos 6 meses.
7. Distribuição 50/30/20: card comparando % atual vs. referência.
8. Insights automáticos por IA.
9. Últimas 5 transações.

### 5.6 Busca, filtros e listagem

Tela dedicada `/app/transacoes` com filtros (período, tipo, categoria, meio de pagamento, busca texto) e tabela paginada.

### 5.7 Transações recorrentes

Cadastro de transações que se repetem mensalmente (ex: IPTU, Condomínio, plano de celular). Uma Supabase Edge Function roda diariamente (cron) e cria registros em `transactions` pras recorrências vigentes cujo `dia_do_mes` é hoje. Fallback: se `dia_do_mes > número de dias do mês`, usa o último dia do mês.

### 5.8 Insights automáticos por IA

No final de cada dashboard, uma seção "Insights do mês" mostra 2–4 observações em linguagem natural geradas pela API da Anthropic (Claude Haiku, pra custo baixo). Cache no Supabase (`ai_insights`) pra não gerar a cada page load — TTL de 1 dia.

### 5.9 Alertas de orçamento

Banner não-intrusivo no topo do dashboard quando alguma categoria ultrapassa 80% ou 100% da meta do mês vigente. Alertas podem ser dispensados (salva em `localStorage`).

### 5.10 Comparação mês vs. mês

Delta vs. mês anterior nos cards e gráfico de linha dos últimos 6 meses. Formato: percentual com seta (↑ vermelho pra aumento de despesa, verde pra aumento de receita).

### 5.11 Export CSV

Botão "Exportar CSV" na tela de transações exporta os registros filtrados atuais em UTF-8 com separador `;`. Colunas: `Data; Tipo; Categoria; Descricao; Estabelecimento; Meio de Pagamento; Valor`.

### 5.12 Dark mode

Toggle no header. Preferência salva em `localStorage` e respeita `prefers-color-scheme`. Implementação via `next-themes` + tokens do shadcn/ui.

### 5.13 Responsividade mobile

Todas as telas funcionam em dispositivos até 375px de largura. Sidebar colapsável → bottom tab bar. Tabelas viram cards empilhados. Formulários viram drawers full-screen.

## 6. Modelo de dados

Ver `supabase/migrations/20260422000001_initial_schema.sql` para o schema completo e `supabase/migrations/20260422000002_rls_policies.sql` para as policies de RLS.

## 7. Stack técnica

| Camada | Tecnologia | Observações |
|--------|------------|-------------|
| Framework | Next.js 14 (App Router) | RSC + Server Actions |
| Linguagem | TypeScript 5 | strict mode |
| UI | shadcn/ui + Tailwind CSS | Tokens customizados |
| Gráficos | Recharts 2.x | |
| Forms | React Hook Form + Zod | |
| Auth + DB | Supabase | `@supabase/ssr` |
| AI Insights | Anthropic SDK | Claude Haiku |
| Deploy | Vercel | |
| Cron (recorrências) | Supabase Edge Functions + `pg_cron` | |

**Variáveis de ambiente (`.env.local`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

## 10. Roadmap de desenvolvimento

| Fase | Entrega |
|------|---------|
| 0. Setup | Next.js + Tailwind + shadcn + Supabase + schema + RLS + seed |
| 1. Auth | Login, signup, forgot password, middleware de proteção |
| 2. CRUD Transações | Criar, editar, excluir, listar com paginação + filtros |
| 3. Categorias + Metas | Telas de gestão de categorias e metas |
| 4. Dashboard | Cards, gráficos Recharts, filtro de mês, comparação |
| 5. Recorrências | CRUD + Edge Function de cron |
| 6. Insights IA + Alertas | Integração Anthropic + banners de alerta |
| 7. Export CSV + Dark mode + Polimento mobile | Features finais + QA |
| 8. Deploy final | Vercel + variáveis de ambiente |

## 11. Definition of Done

- [ ] Todas as features das seções 5.1–5.13 implementadas.
- [ ] RLS ativo em todas as tabelas (testado com 2 usuários).
- [ ] Responsivo até 375px de largura.
- [ ] Dark mode funcionando em todas as telas.
- [ ] Lighthouse ≥ 90 em Performance e Accessibility no desktop.
- [ ] Deploy na Vercel com build limpo.
- [ ] README com setup + variáveis de ambiente.
- [ ] Pelo menos 3 testes E2E básicos.

## 13. Decisões tomadas (referência do Claude Code)

Estas decisões vieram de um refinamento com o autor — não revisitar sem consultar:

1. **Receitas:** CRUD manual simples (não há renda fixa mensal automática).
2. **Metas:** valor fixo em R$ + % do orçamento + benchmark 50/30/20.
3. **Dados históricos:** começar do zero — não importar da planilha.
4. **Recorrências:** suportadas (cron via Edge Function).
5. **Meios de pagamento:** campo opcional com dropdown, sem gestão de saldos por conta.
6. **Landing page:** não existe; login é a porta de entrada com visual elaborado.
7. **Features extras confirmadas:** dark mode, insights por IA (Claude Haiku), alertas de orçamento, comparação mês vs. mês — todas no MVP.

---

*Fim do PRD.*
