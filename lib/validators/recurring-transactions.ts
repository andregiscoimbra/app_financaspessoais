import { z } from "zod";

import { MEIOS_PAGAMENTO, TIPOS_TRANSACAO } from "@/lib/validators/transactions";

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

export const recorrenciaSchema = z
  .object({
    tipo: z.enum(TIPOS_TRANSACAO, { required_error: "Selecione o tipo." }),
    valor,
    descricao: z.string().trim().min(1, "Descrição é obrigatória.").max(120),
    estabelecimento: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    categoria_id: z.string().uuid("Categoria inválida."),
    meio_pagamento: z
      .enum(MEIOS_PAGAMENTO)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    dia_do_mes: z.coerce
      .number({ invalid_type_error: "Dia inválido." })
      .int("Dia deve ser um número inteiro.")
      .min(1, "Dia deve ser entre 1 e 31.")
      .max(31, "Dia deve ser entre 1 e 31."),
    vigente_desde: data,
    vigente_ate: data.optional().or(z.literal("").transform(() => undefined)),
    ativa: z.coerce.boolean().optional().default(true),
  })
  .refine(
    (d) => !d.vigente_ate || d.vigente_ate >= d.vigente_desde,
    {
      message: "Fim da vigência não pode ser antes do início.",
      path: ["vigente_ate"],
    },
  );

export type RecorrenciaInput = z.infer<typeof recorrenciaSchema>;
