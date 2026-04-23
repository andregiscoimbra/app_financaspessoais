import {
  addMonths,
  endOfMonth,
  format,
  lastDayOfMonth,
  parse,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/** ISO YYYY-MM-DD do primeiro dia do mês da data informada. */
export function firstDayOfMonth(date: Date = new Date()): string {
  return format(startOfMonth(date), "yyyy-MM-dd");
}

/** ISO YYYY-MM-DD do último dia do mês da data informada. */
export function lastDayOfMonthISO(date: Date = new Date()): string {
  return format(endOfMonth(date), "yyyy-MM-dd");
}

/** Retorna { inicio, fim } em ISO para o mês da data informada. */
export function monthRange(date: Date = new Date()): { inicio: string; fim: string } {
  return {
    inicio: firstDayOfMonth(date),
    fim: lastDayOfMonthISO(date),
  };
}

/** Retorna { inicio, fim } do mês anterior. */
export function previousMonthRange(date: Date = new Date()): { inicio: string; fim: string } {
  return monthRange(subMonths(date, 1));
}

/**
 * Resolve um "dia do mês" (1-31) para uma data válida dentro do mês de
 * referência, caindo no último dia disponível quando necessário
 * (ex: dia 31 em fevereiro → 28 ou 29).
 */
export function resolveDayOfMonth(dayOfMonth: number, reference: Date = new Date()): Date {
  const last = lastDayOfMonth(reference).getDate();
  const day = Math.min(dayOfMonth, last);
  return new Date(reference.getFullYear(), reference.getMonth(), day);
}

/**
 * Parseia um parâmetro de URL no formato "YYYY-MM" para uma Date (1º do mês).
 * Retorna o mês atual se o input for inválido ou ausente.
 */
export function parseRefMonth(input: string | null | undefined): Date {
  if (!input) return startOfMonth(new Date());

  if (!/^\d{4}-\d{2}$/.test(input)) return startOfMonth(new Date());

  const parsed = parse(`${input}-01`, "yyyy-MM-dd", new Date());
  if (Number.isNaN(parsed.getTime())) return startOfMonth(new Date());

  return startOfMonth(parsed);
}

/** Formato "YYYY-MM" para usar como query string. */
export function formatRefMonth(date: Date): string {
  return format(date, "yyyy-MM");
}

/** Navega para o mês anterior, preservando o primeiro dia. */
export function prevMonth(date: Date): Date {
  return startOfMonth(subMonths(date, 1));
}

/** Navega para o próximo mês, preservando o primeiro dia. */
export function nextMonth(date: Date): Date {
  return startOfMonth(addMonths(date, 1));
}

/**
 * Retorna os últimos `n` meses (incluindo o mês de referência) em ordem
 * cronológica crescente: [mais antigo → referência].
 */
export function lastNMonths(reference: Date, n: number): Date[] {
  const months: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    months.push(startOfMonth(subMonths(reference, i)));
  }
  return months;
}

/** "abr/26" (abreviado, usado em eixos de gráfico). */
export function formatMonthShort(date: Date): string {
  return format(date, "MMM/yy", { locale: ptBR }).toLowerCase();
}

