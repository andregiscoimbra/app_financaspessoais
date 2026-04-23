# Dashboard de Finanças Pessoais

Web app pessoal de gestão financeira — Next.js 14 + Supabase + shadcn/ui.

Substitui uma planilha Excel com lançamento de receitas/despesas, metas por categoria, gráficos, alertas de orçamento e insights automáticos gerados por IA.

Documentação:

- **[PRD.md](./PRD.md)** — especificação completa do produto.
- **[plan.md](./plan.md)** — roadmap das fases de desenvolvimento.
- **[CLAUDE.md](./CLAUDE.md)** — guia técnico para o Claude Code.

## Pré-requisitos

- **Node.js** ≥ 18.17
- Conta no **Supabase** ([supabase.com](https://supabase.com))
- Conta na **Anthropic** com chave de API ([console.anthropic.com](https://console.anthropic.com))

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local e preencha:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   ANTHROPIC_API_KEY

# 3. Aplicar migrations no Supabase
# Opção A — via Supabase CLI (recomendado):
npx supabase link --project-ref <seu-project-ref>
npx supabase db push

# Opção B — cole o conteúdo de supabase/migrations/*.sql no SQL Editor
# do painel do Supabase, em ordem numérica.

# 4. Rodar o servidor de desenvolvimento
npm run dev
```

Abra http://localhost:3000.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (hot reload) |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem emitir arquivos |
| `npm run format` | Prettier (formata todo o projeto) |

## Estrutura

```
app/              # rotas do App Router (Next.js 14)
components/       # componentes React (ui, charts, transactions, dashboard)
lib/
  supabase/       # clients (browser, server, middleware)
  utils/          # formatters (BRL, datas), cn
  validators/     # Zod schemas
types/            # tipos de domínio e do banco
hooks/            # custom hooks React
supabase/
  migrations/     # SQL versionado
  functions/      # Edge Functions (cron de recorrências)
```

Veja [CLAUDE.md](./CLAUDE.md) para convenções de código e mais detalhes.

## Deploy na Vercel

### 1. Importar o repositório

1. Acesse https://vercel.com/new
2. Conecte sua conta GitHub (se ainda não conectou)
3. Selecione o repositório `app_financaspessoais`
4. Clique em **Import**

A Vercel detecta Next.js automaticamente — não precisa configurar Framework, Build Command ou Output Directory.

### 2. Configurar variáveis de ambiente

Na tela de configuração do projeto (antes de clicar em Deploy), expanda **Environment Variables** e adicione as 4 variáveis:

| Nome | Ambiente | De onde vem |
|------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Supabase → Settings → API Keys → Publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | Supabase → Settings → API Keys → Secret (Reveal) |
| `ANTHROPIC_API_KEY` | Production, Preview, Development | console.anthropic.com → Settings → API Keys |

⚠️ **Importante:** a `SUPABASE_SERVICE_ROLE_KEY` e a `ANTHROPIC_API_KEY` são **secretas** — não prefixe com `NEXT_PUBLIC_`, senão elas vão parar no bundle do navegador.

### 3. Deploy

Clique em **Deploy**. A primeira build leva 1–3 minutos. Depois que terminar, você vai receber uma URL tipo `app-financaspessoais-xxxxx.vercel.app`.

### 4. Configurar Redirect URLs do Supabase Auth (importante!)

Para que o login/signup funcione em produção, o Supabase precisa aceitar a URL da Vercel:

1. No painel do Supabase: **Authentication → URL Configuration**
2. **Site URL:** coloque a URL de produção (ex: `https://seu-app.vercel.app`)
3. **Redirect URLs:** adicione:
   - `https://seu-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (pra manter dev funcionando)

### 5. Domínio customizado (opcional)

Na Vercel: **Settings → Domains** → adicione seu domínio. A Vercel te mostra os registros DNS para configurar no seu provedor. Depois atualize o Site URL e as Redirect URLs no Supabase.

### Pós-deploy: preview e production

- Cada push na branch `main` dispara um **deploy de produção**.
- Cada push em outras branches dispara um **preview deploy** (URL temporária).
- Você pode ver histórico de builds e logs em **Deployments** no painel Vercel.

## Segurança

- **RLS (Row Level Security)** está ativo em todas as tabelas — cada usuário só acessa seus próprios dados.
- Variáveis **`NEXT_PUBLIC_*`** são expostas ao navegador por design. As duas usadas aqui (URL + publishable/anon key) são seguras de expor — o RLS protege os dados.
- Variáveis sem prefixo **`NEXT_PUBLIC_`** ficam apenas no servidor:
  - `SUPABASE_SERVICE_ROLE_KEY` — ignora RLS, só use em Server Actions / API Routes (atualmente não é usada; reservada para futuras features como admin tools).
  - `ANTHROPIC_API_KEY` — só usada em `app/api/insights/route.ts`.
- **Nunca** commite `.env.local`. Se suspeitar que uma chave vazou, revogue imediatamente:
  - Supabase: **Settings → API Keys → Roll**
  - Anthropic: **console.anthropic.com/settings/keys → Revoke**

## Licença

Projeto pessoal. Sem licença pública definida.
