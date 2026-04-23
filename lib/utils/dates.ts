import {
  addMonths,
  endOfMonth,
  format,
  lastDayOfMonth,
  parse,
  startOfMonth,
  subDays,
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
 * Parseia um parâmetro de URL no formato "YYYY-MM" para uma Date (1º do mês
 * ao meio-dia UTC). O meio-dia evita que a serialização JSON transforme a
 * data em um dia diferente quando o cliente está em fuso UTC-3 (BRT) —
 * midnight UTC viraria 21:00 BRT do dia anterior.
 * Retorna o mês atual se o input for inválido ou ausente.
 */
export function parseRefMonth(input: string | null | undefined): Date {
  if (!input || !/^\d{4}-\d{2}$/.test(input)) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 12, 0, 0));
  }

  const [yearStr, monthStr] = input.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (
    !Number.isFinite(year)
    || !Number.isFinite(month)
    || month < 1
    || month > 12
  ) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 12, 0, 0));
  }

  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
}

/**
 * Parseia uma string "YYYY-MM-DD" como data local (sem timezone shift).
 * Usa meio-dia local para ficar no mesmo dia do calendário em qualquer TZ.
 */
export function parseISODateLocal(input: string): Date {
  const parsed = parse(input, "yyyy-MM-dd", new Date());
  parsed.setHours(12, 0, 0, 0);
  return parsed;
}

/** Formato "YYYY-MM" para usar como query string. */
export function formatRefMonth(date: Date): string {
  return format(date, "yyyy-MM");
}

/** Formato "YYYY-MM-DD" para usar como parâmetro de query/URL. */
export function formatISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
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

/**
 * Retorna { inicio, fim } em ISO para os últimos `days` dias (incluindo hoje).
 * Usado pelos presets "últimos 7/30 dias" do seletor de período.
 */
export function lastNDaysRange(days: number, reference: Date = new Date()): {
  inicio: string;
  fim: string;
} {
  const fim = reference;
  const inicio = subDays(fim, days - 1);
  return {
    inicio: format(inicio, "yyyy-MM-dd"),
    fim: format(fim, "yyyy-MM-dd"),
  };
}
