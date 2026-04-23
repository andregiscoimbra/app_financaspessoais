import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";

import { lastNMonths, monthRange, prevMonth } from "@/lib/utils/dates";
import type { Categoria, TipoTransacao } from "@/types";

type AnySupabaseClient = SupabaseClient<any, any, any>;

interface TransacaoParaAgregacao {
  tipo: TipoTransacao;
  valor: number | string;
  data: string; // YYYY-MM-DD
  categoria_id: string;
}

export interface DashboardData {
  /** Totais do mês de referência. */
  totaisMes: { receitas: number; despesas: number };
  /** Totais do mês anterior (para calcular delta). */
  totaisMesAnterior: { receitas: number; despesas: number };
  /** Gasto por categoria_id no mês de referência. */
  gastoPorCategoria: Record<string, number>;
  /** Evolução mensal dos últimos 6 meses (ordem cronológica crescente). */
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

export async function getDashboardData(
  supabase: AnySupabaseClient,
  refMonth: Date,
): Promise<DashboardData> {
  // Janelas de tempo
  const mesAtual = monthRange(refMonth);
  const mesAnterior = monthRange(prevMonth(refMonth));
  const seisMeses = lastNMonths(refMonth, 6);
  const inicio6m = format(seisMeses[0], "yyyy-MM-01");
  const fim6m = mesAtual.fim;

  // Tudo em paralelo (3 queries)
  const [txMes, txMesAnterior, tx6Meses] = await Promise.all([
    fetchTransacoesDoPeriodo(supabase, mesAtual.inicio, mesAtual.fim),
    fetchTransacoesDoPeriodo(supabase, mesAnterior.inicio, mesAnterior.fim),
    fetchTransacoesDoPeriodo(supabase, inicio6m, fim6m),
  ]);

  // Agregação do mês atual
  const totaisMes = { receitas: 0, despesas: 0 };
  const gastoPorCategoria: Record<string, number> = {};
  for (const t of txMes) {
    const v = Number(t.valor);
    if (t.tipo === "receita") totaisMes.receitas += v;
    else {
      totaisMes.despesas += v;
      gastoPorCategoria[t.categoria_id] = (gastoPorCategoria[t.categoria_id] ?? 0) + v;
    }
  }

  // Agregação do mês anterior
  const totaisMesAnterior = { receitas: 0, despesas: 0 };
  for (const t of txMesAnterior) {
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
