/**
 * "Período" do dashboard: pode ser um mês inteiro (modo padrão) ou um
 * intervalo de datas personalizado. A resolução sempre produz um
 * `inicio`/`fim` concreto pra usar nas queries.
 *
 * Os presets "últimos 7 / 30 dias" caem em modo "range" mesmo que
 * coincidam com o mês atual — isso permite navegar por mês sem perder
 * a seleção de período custom.
 */

import { parseRefMonth, formatRefMonth, parseISODateLocal, lastNDaysRange, monthRange } from "./dates";

export type PeriodMode = "month" | "range";

export interface ResolvedPeriod {
  mode: PeriodMode;
  /** YYYY-MM-DD — primeiro dia do período (inclusive). */
  inicio: string;
  /** YYYY-MM-DD — último dia do período (inclusive). */
  fim: string;
  /**
   * Chave "YYYY-MM" do mês de referência — sempre existe.
   * - No modo "month": é o próprio mês selecionado.
   * - No modo "range": é o mês que contém o `fim` (usado para metas,
   *   evolução mensal de 6 meses e cache de insights IA).
   */
  refMonthKey: string;
  /** Date object (meio-dia UTC) correspondente ao `refMonthKey`. */
  refMonthDate: Date;
}

interface SearchParamsInput {
  ref?: string;
  inicio?: string;
  fim?: string;
}

/**
 * Valida uma string "YYYY-MM-DD". Não faz checagem exata de calendário,
 * mas evita valores absurdos.
 */
function isValidISODate(input: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const d = parseISODateLocal(input);
  return !Number.isNaN(d.getTime());
}

/**
 * Resolve o período a partir dos query params da URL.
 *
 * Precedência:
 * 1. `?inicio=YYYY-MM-DD&fim=YYYY-MM-DD` (ambos válidos) → range
 * 2. `?ref=YYYY-MM` → mês específico
 * 3. sem params → mês atual
 */
export function resolvePeriod(params: SearchParamsInput): ResolvedPeriod {
  const inicio = params.inicio?.trim();
  const fim = params.fim?.trim();

  // Modo range
  if (inicio && fim && isValidISODate(inicio) && isValidISODate(fim) && inicio <= fim) {
    // refMonth = mês que contém `fim`
    const refMonthKey = fim.slice(0, 7); // "YYYY-MM"
    const refMonthDate = parseRefMonth(refMonthKey);
    return { mode: "range", inicio, fim, refMonthKey, refMonthDate };
  }

  // Modo mês
  const refMonthDate = parseRefMonth(params.ref);
  const refMonthKey = formatRefMonth(refMonthDate);
  const { inicio: mInicio, fim: mFim } = monthRange(refMonthDate);
  return {
    mode: "month",
    inicio: mInicio,
    fim: mFim,
    refMonthKey,
    refMonthDate,
  };
}

/** Valor dos presets oferecidos no seletor. */
export type PeriodPreset = "mes-atual" | "mes-anterior" | "ultimos-7" | "ultimos-30";

/**
 * Converte um preset em query params. Usa a data atual do CLIENTE para
 * computar os presets baseados em dias (evita timezone shift).
 */
export function presetToQuery(preset: PeriodPreset): Record<string, string> {
  const now = new Date();

  switch (preset) {
    case "mes-atual":
      return { ref: formatRefMonth(now) };
    case "mes-anterior": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { ref: formatRefMonth(d) };
    }
    case "ultimos-7": {
      const r = lastNDaysRange(7, now);
      return { inicio: r.inicio, fim: r.fim };
    }
    case "ultimos-30": {
      const r = lastNDaysRange(30, now);
      return { inicio: r.inicio, fim: r.fim };
    }
  }
}
