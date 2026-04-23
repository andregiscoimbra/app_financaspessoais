import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subDays, differenceInCalendarDays } from "date-fns";

import { lastNMonths, monthRange, parseISODateLocal, prevMonth } from "@/lib/utils/dates";
import type { Categoria, TipoTransacao } from "@/types";

type AnySupabaseClient = SupabaseClient<any, any, any>;

interface TransacaoParaAgregacao {
  tipo: TipoTransacao;
  valor: number | string;
  data: string; // YYYY-MM-DD
  categoria_id: string;
}

export interface DashboardData {
  /** Totais do período selecionado. */
  totaisMes: { receitas: number; despesas: number };
  /**
   * Totais do período de comparação (mês anterior em modo "month", ou
   * janela imediatamente anterior de mesma duração em modo "range").
   */
  totaisMesAnterior: { receitas: number; despesas: number };
  /** Gasto por categoria_id no período selecionado. */
  gastoPorCategoria: Record<string, number>;
  /**
   * Evolução mensal dos últimos 6 meses terminando no `refMonth`.
   * Usa o mês de referência, não o range customizado.
   */
  evolucaoMensal: Array<{
    mes: Date;
    receitas: number;
    despesas: number;
  }>;
}

async function fetchTransacoesDoPeriodo(
  supabase: AnySupabaseClient,
  inicio: string,
  fim: string,
): Promise<TransacaoParaAgregacao[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("tipo, valor, data, categoria_id")
    .gte("data", inicio)
    .lte("data", fim);

  if (error) {
    console.error("Erro ao buscar transações do período:", error);
    return [];
  }
  return (data ?? []) as TransacaoParaAgregacao[];
}

/**
 * Dados do dashboard para um período arbitrário + mês de referência.
 *
 * @param rangeInicio YYYY-MM-DD — início do período analisado (inclusive)
 * @param rangeFim    YYYY-MM-DD — fim do período analisado (inclusive)
 * @param refMonth    Date — usado para o gráfico "evolução dos 6 meses"
 */
export async function getDashboardData(
  supabase: AnySupabaseClient,
  rangeInicio: string,
  rangeFim: string,
  refMonth: Date,
): Promise<DashboardData> {
  // Período de comparação: janela imediatamente anterior de mesma duração.
  const inicioDate = parseISODateLocal(rangeInicio);
  const fimDate = parseISODateLocal(rangeFim);
  const diasNoRange = differenceInCalendarDays(fimDate, inicioDate) + 1;
  const compFim = format(subDays(inicioDate, 1), "yyyy-MM-dd");
  const compInicio = format(subDays(inicioDate, diasNoRange), "yyyy-MM-dd");

  // 6 meses pro gráfico de evolução — sempre ancorado no refMonth
  const seisMeses = lastNMonths(refMonth, 6);
  const inicio6m = format(seisMeses[0], "yyyy-MM-01");
  const fim6m = monthRange(refMonth).fim;

  // 3 queries em paralelo
  const [txRange, txComp, tx6Meses] = await Promise.all([
    fetchTransacoesDoPeriodo(supabase, rangeInicio, rangeFim),
    fetchTransacoesDoPeriodo(supabase, compInicio, compFim),
    fetchTransacoesDoPeriodo(supabase, inicio6m, fim6m),
  ]);

  // Agregação do período principal
  const totaisMes = { receitas: 0, despesas: 0 };
  const gastoPorCategoria: Record<string, number> = {};
  for (const t of txRange) {
    const v = Number(t.valor);
    if (t.tipo === "receita") totaisMes.receitas += v;
    else {
      totaisMes.despesas += v;
      gastoPorCategoria[t.categoria_id] = (gastoPorCategoria[t.categoria_id] ?? 0) + v;
    }
  }

  // Agregação do período de comparação
  const totaisMesAnterior = { receitas: 0, despesas: 0 };
  for (const t of txComp) {
    const v = Number(t.valor);
    if (t.tipo === "receita") totaisMesAnterior.receitas += v;
    else totaisMesAnterior.despesas += v;
  }

  // Agregação por mês (6 meses)
  const porMesMap = new Map<string, { receitas: number; despesas: number }>();
  for (const mes of seisMeses) {
    porMesMap.set(format(mes, "yyyy-MM"), { receitas: 0, despesas: 0 });
  }
  for (const t of tx6Meses) {
    const key = t.data.slice(0, 7); // "YYYY-MM"
    const slot = porMesMap.get(key);
    if (!slot) continue;
    const v = Number(t.valor);
    if (t.tipo === "receita") slot.receitas += v;
    else slot.despesas += v;
  }

  const evolucaoMensal = seisMeses.map((mes) => {
    const key = format(mes, "yyyy-MM");
    const { receitas, despesas } = porMesMap.get(key) ?? { receitas: 0, despesas: 0 };
    return { mes, receitas, despesas };
  });

  return {
    totaisMes,
    totaisMesAnterior,
    gastoPorCategoria,
    evolucaoMensal,
  };
}

/** Util: converte o mapa gastoPorCategoria em array ordenado (maior → menor). */
export function gastoPorCategoriaComNome(
  gastoPorCategoria: Record<string, number>,
  categorias: Categoria[],
): Array<{
  categoria_id: string;
  nome: string;
  cor: string | null;
  valor: number;
}> {
  const mapa = new Map(categorias.map((c) => [c.id, c]));

  return Object.entries(gastoPorCategoria)
    .map(([categoria_id, valor]) => {
      const c = mapa.get(categoria_id);
      return {
        categoria_id,
        nome: c?.nome ?? "Sem categoria",
        cor: c?.cor ?? null,
        valor,
      };
    })
    .sort((a, b) => b.valor - a.valor);
}
