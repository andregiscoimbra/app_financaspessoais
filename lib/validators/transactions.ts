import { z } from "zod";

export const MEIOS_PAGAMENTO = [
  "debito",
  "credito",
  "pix",
  "dinheiro",
  "outro",
] as const;

export const TIPOS_TRANSACAO = ["receita", "despesa"] as const;

const uuid = z.string().uuid("Categoria inválida.");

/**
 * Valor aceita string (do input) ou número. Vírgula brasileira é convertida
 * para ponto antes do parse.
 */
const valor = z.preprocess(
  (v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const normalized = v.replace(/\./g, "").replace(",", ".").trim();
      if (normalized === "") return undefined;
      const n = Number(normalized);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  },
  z
    .number({ required_error: "Valor é obrigatório.", invalid_type_error: "Valor inválido." })
    .positive("Valor deve ser maior que zero.")
    .max(99_999_999.99, "Valor muito alto."),
);

const data = z
  .string()
  .min(1, "Data é obrigatória.")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const transacaoSchema = z.object({
  tipo: z.enum(TIPOS_TRANSACAO, { required_error: "Selecione o tipo." }),
  valor,
  data,
  descricao: z.string().trim().min(1, "Descrição é obrigatória.").max(120),
  estabelecimento: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  categoria_id: uuid,
  meio_pagamento: z
    .enum(MEIOS_PAGAMENTO)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type TransacaoInput = z.infer<typeof transacaoSchema>;

/**
 * Schema para filtros da listagem (lidos dos searchParams da URL).
 * Todos os campos são opcionais; valores inválidos são silenciosamente
 * descartados (não queremos 500 por causa de uma URL manipulada).
 */
export const filtrosTransacaoSchema = z.object({
  inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  tipo: z.enum(TIPOS_TRANSACAO).optional().catch(undefined),
  categorias: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : []))
    .catch([]),
  meios: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : []))
    .catch([]),
  busca: z.string().trim().optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(1),
});

export type FiltrosTransacao = z.infer<typeof filtrosTransacaoSchema>;

export const PAGE_SIZE = 50;
