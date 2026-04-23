import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import { buildBudgetAlerts } from "@/lib/utils/budget-alerts";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { BudgetVsSpentChart } from "@/components/dashboard/charts/budget-vs-spent-chart";
import { CategoryPieChart } from "@/components/dashboard/charts/category-pie-chart";
import { MonthlyTrendChart } from "@/components/dashboard/charts/monthly-trend-chart";
import { FiftyThirtyTwentyCard } from "@/components/dashboard/fifty-thirty-twenty-card";
import { InsightsList } from "@/components/dashboard/insights-list";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { listBudgetsVigentes } from "@/lib/queries/budgets";
import { listCategorias } from "@/lib/queries/categories";
import {
  gastoPorCategoriaComNome,
  getDashboardData,
} from "@/lib/queries/dashboard";
import { listTransacoesRecentes } from "@/lib/queries/transactions";
import { createClient } from "@/lib/supabase/server";
import { resolvePeriod } from "@/lib/utils/period";

export const metadata = { title: "Dashboard · Finanças Pessoais" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { ref?: string; inicio?: string; fim?: string };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const periodo = resolvePeriod(searchParams);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primeiroNome =
    (user?.user_metadata?.nome as string | undefined)?.trim().split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "você";

  const [dados, categorias, budgets, recentes] = await Promise.all([
    getDashboardData(supabase, periodo.inicio, periodo.fim, periodo.refMonthDate),
    listCategorias(supabase, { incluirInativas: true }),
    listBudgetsVigentes(supabase),
    listTransacoesRecentes(supabase, 5),
  ]);

  const metaPorCategoria: Record<string, number> = {};
  for (const b of budgets) metaPorCategoria[b.categoria_id] = Number(b.valor_mensal);

  const metaTotal = Object.values(metaPorCategoria).reduce((a, b) => a + b, 0);

  const nomeDaCategoria: Record<string, string> = {};
  for (const c of categorias) nomeDaCategoria[c.id] = c.nome;

  // Alertas de orçamento (80%+ ou 100%+)
  const budgetAlerts = buildBudgetAlerts({
    gastoPorCategoria: dados.gastoPorCategoria,
    metaPorCategoria,
    nomeDaCategoria,
  });

  // Dados para o gráfico pizza — gasto por categoria com nome/cor
  const gastoPorCategoriaArr = gastoPorCategoriaComNome(
    dados.gastoPorCategoria,
    categorias,
  );

  // Dados para o gráfico "gasto vs meta" — junta gasto e meta por categoria
  const categoriasDespesa = categorias.filter((c) => c.tipo === "despesa");
  const dadosGastoVsMeta = categoriasDespesa.map((c) => ({
    categoria_id: c.id,
    nome: c.nome,
    cor: c.cor,
    gasto: dados.gastoPorCategoria[c.id] ?? 0,
    meta: metaPorCategoria[c.id] ?? 0,
  }));

  // Dados para o card 50/30/20 — usa o grupo_meta configurado pelo usuário
  const grupoMetaPorCategoria: Record<string, "necessidades" | "desejos" | null> = {};
  for (const c of categorias) grupoMetaPorCategoria[c.id] = c.grupo_meta;

  const despesasPorNome = gastoPorCategoriaArr.map((g) => ({
    nome: g.nome,
    valor: g.valor,
    grupo: grupoMetaPorCategoria[g.categoria_id] ?? null,
  }));

  const modoMes = periodo.mode === "month";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {primeiroNome} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {modoMes
              ? "Visão geral do mês selecionado."
              : "Visão geral do período selecionado."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector
            mode={periodo.mode}
            refMonthKey={periodo.refMonthKey}
            inicio={periodo.inicio}
            fim={periodo.fim}
          />
          <TransactionDialog categorias={categorias} />
        </div>
      </div>

      {/* Alertas de orçamento (só aparece se houver categorias em 80%+) */}
      <BudgetAlerts refMonth={periodo.refMonthKey} alerts={budgetAlerts} />

      {/* Cards de resumo */}
      <SummaryCards
        totaisMes={dados.totaisMes}
        totaisMesAnterior={dados.totaisMesAnterior}
        comparisonLabel={modoMes ? "vs. mês anterior" : "vs. período anterior"}
      />

      {/* Barra de orçamento geral */}
      <BudgetProgress gastoTotal={dados.totaisMes.despesas} metaTotal={metaTotal} />

      {/* Grid de gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPieChart dados={gastoPorCategoriaArr} />
        <BudgetVsSpentChart dados={dadosGastoVsMeta} />
      </div>

      <MonthlyTrendChart dados={dados.evolucaoMensal} />

      {/* 50/30/20 + Insights IA */}
      <div className="grid gap-4 lg:grid-cols-2">
        <FiftyThirtyTwentyCard
          despesas={despesasPorNome}
          receitas={dados.totaisMes.receitas}
          descricao={
            modoMes
              ? "Sua distribuição real de gastos no mês, comparada com a regra 50/30/20. A poupança é o que sobrou da receita."
              : "Distribuição de gastos no período selecionado, comparada com a regra 50/30/20."
          }
        />
        <InsightsList refMonth={periodo.refMonthKey} />
      </div>

      <RecentTransactionsCard transacoes={recentes} />
    </div>
  );
}
