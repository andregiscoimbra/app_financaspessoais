import { format as formatDate, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const PERCENT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** Formata um número como moeda brasileira (R$ 1.234,56). */
export function formatBRL(value: number): string {
  return BRL.format(value);
}

/** Formata uma fração (0.25) como percentual ("25%"). */
export function formatPercent(fraction: number): string {
  return PERCENT.format(fraction);
}

/** Formata uma data (Date ou ISO string) como "22/04/2026". */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDate(d, "dd/MM/yyyy", { locale: ptBR });
}

/** Formata uma data como "abril de 2026". */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDate(d, "MMMM 'de' yyyy", { locale: ptBR });
}

/** Delta percentual entre dois valores; retorna null se previous = 0. */
export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
