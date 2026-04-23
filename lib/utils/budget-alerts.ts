/**
 * Util puro (server-safe) para montar a lista de alertas de orçamento.
 *
 * Fica fora do arquivo `components/dashboard/budget-alerts.tsx` porque aquele
 * é `"use client"` — e server components não podem importar utilidades de
 * módulos marcados como client.
 */

export interface BudgetAlertItem {
  categoria_id: string;
  nome: string;
  gasto: number;
  meta: number;
  /** Percentual (gasto/meta). */
  percent: number;
  severity: "warning" | "critical";
}

export function buildBudgetAlerts(input: {
  gastoPorCategoria: Record<string, number>;
  metaPorCategoria: Record<string, number>;
  nomeDaCategoria: Record<string, string>;
}): BudgetAlertItem[] {
  const alerts: BudgetAlertItem[] = [];

  for (const [categoria_id, meta] of Object.entries(input.metaPorCategoria)) {
    if (meta <= 0) continue;
    const gasto = input.gastoPorCategoria[categoria_id] ?? 0;
    const percent = gasto / meta;
    if (percent < 0.8) continue;

    alerts.push({
      categoria_id,
      nome: input.nomeDaCategoria[categoria_id] ?? "Categoria",
      gasto,
      meta,
      percent,
      severity: percent > 1 ? "critical" : "warning",
    });
  }

  // Críticos primeiro, depois por % desc
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    return b.percent - a.percent;
  });
}
