# CLAUDE.md — Guia operacional do projeto

> Este arquivo é lido automaticamente pelo Claude Code em toda sessão nesta pasta.
> Mantenha-o enxuto, atualizado e sem duplicar o PRD.

## Visão geral

Web app pessoal de gestão financeira. Substitui uma planilha Excel com lançamento de receitas/despesas, metas por categoria, gráficos, alertas e insights por IA. Detalhes completos em [PRD.md](./PRD.md).

## Stack

- **Framework:** Next.js 14 (App Router, Server Components por padrão)
- **Linguagem:** TypeScript 5 (strict)
- **UI:** Tailwind CSS + shadcn/ui + Radix
- **Ícones:** lucide-react
- **Gráficos:** Recharts
- **Forms:** React Hook Form + Zod
- **DB + Auth:** Supabase (`@supabase/ssr`)
- **IA:** Anthropic SDK (Claude Haiku para insights)
- **Datas:** date-fns com locale pt-BR
- **Tema:** next-themes
- **Deploy:** Vercel

## Comandos

```bash
npm install        # instala dependências
npm run dev        # servidor de desenvolvimento em http://localhost:3000
npm run build      # build de produção
npm run start      # roda o build de produção
npm run lint       # ESLint
npm run typecheck  # TypeScript sem emitir
npm run format     # Prettier
```

## Convenções

### Idioma e formato
- **Comunicação com o usuário:** sempre em **português brasileiro**.
- **Moeda:** sempre BRL. Use `formatBRL()` de [lib/utils/format.ts](lib/utils/format.ts).
- **Datas:** formato brasileiro `dd/MM/yyyy`. Use `formatDateBR()` ou `formatMonthYear()`.
- **Identificadores do domínio** (tabelas, colunas, componentes de domínio) em português: `transacoes`, `categorias`, `metas`, `recorrencias`. Palavras-chave da stack (hooks, tipos genéricos) seguem o idioma original.

### Arquitetura Next.js
- **Server Components por padrão.** Use `"use client"` apenas para componentes que precisam de estado, efeitos, ou APIs do navegador (forms, gráficos, toggles).
- **Server Actions** para mutações simples; API Routes só quando necessário (ex: `/api/insights`, `/api/export-csv`).
- **Fetching:** sempre no Server Component quando possível — mais rápido e mais seguro.

### Estilo de código
- Arquivos em `kebab-case`; componentes React em `PascalCase`.
- Nomes de variáveis/funções em inglês OU português, desde que consistentes dentro do módulo. Prefira português para código do domínio (`calcularSaldoMensal`) e inglês para utilidades genéricas (`formatBRL`).
- Use `import { cn } from "@/lib/utils/cn"` para combinar classes Tailwind.
- Use o alias `@/` para imports absolutos (configurado em `tsconfig.json`).

### Supabase
- **Client-side:** `createClient` de [lib/supabase/client.ts](lib/supabase/client.ts).
- **Server-side:** `createClient` de [lib/supabase/server.ts](lib/supabase/server.ts).
- **Middleware:** [lib/supabase/middleware.ts](lib/supabase/middleware.ts) renova a sessão a cada requisição.
- **RLS é obrigatório em toda tabela nova.** Toda migration que cria tabela com `user_id` precisa também: `alter table ... enable row level security` e uma policy.
- **Nunca use `SUPABASE_SERVICE_ROLE_KEY` fora de API Routes ou Server Actions.** Essa chave ignora RLS.

### Forms e validação
- Sempre validar com Zod schemas em [lib/validators/](lib/validators/).
- Mostrar erros inline, nunca `alert()`.
- Feedback de loading em toda ação (skeleton, spinner ou botão `disabled`).

## Estrutura de pastas

```
app/              # rotas (App Router)
  (auth)/         # grupo de rotas públicas (login, signup, forgot-password)
  (dashboard)/    # grupo de rotas autenticadas
  api/            # API Routes (insights, export-csv)
components/
  ui/             # primitivos shadcn
  charts/         # wrappers Recharts
  transactions/   # formulários e listas de transação
  dashboard/      # cards, gráficos, seção de insights
lib/
  supabase/       # clients + middleware
  utils/          # cn, format, dates
  validators/     # Zod schemas
types/            # tipos compartilhados + database.ts gerado
hooks/            # custom hooks React
middleware.ts     # Next.js middleware raiz
supabase/
  migrations/     # SQL numerado (ordem importa)
  functions/      # Edge Functions (cron de recorrências)
```

## Roadmap

O estado atual das fases fica em [plan.md](./plan.md). Sempre atualize-o ao concluir uma fase.

## Segurança — checklist por PR

- [ ] Toda nova tabela tem `enable row level security` + policy.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` não aparece em código client.
- [ ] Toda entrada do usuário passa por Zod antes de chegar no Supabase.
- [ ] Nada sensível (chaves, tokens, e-mails) é logado com `console.log`.
- [ ] Links externos usam `rel="noopener noreferrer"`.

## Notas sobre o usuário (André)

- **Profissional não-técnico.** Ao executar tarefas, explicar o que está sendo feito em linguagem acessível, sem jargões — como se fosse pra alguém de 15 anos.
- **Comunicação em português** sempre.
- Detalhes completos das preferências ficam no sistema de memória do Claude Code.
