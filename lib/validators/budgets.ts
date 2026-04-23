import { z } from "zod";

const valorMensal = z.preprocess(
  (v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const normalized = v.replace(/\./g, "").replace(",", ".").trim();
      if (normalized === "") return 0;
      const n = Number(normalized);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  },
  z
    .number({ invalid_type_error: "Valor inválido." })
    .nonnegative("Meta não pode ser negativa.")
    .max(99_999_999.99, "Valor muito alto."),
);

/** Schema para o form de metas: array de (categoria_id, valor_mensal). */
export const budgetsFormSchema = z.object({
  budgets: z
    .array(
      z.object({
        categoria_id: z.string().uuid(),
        valor_mensal: valorMensal,
      }),
    )
    .max(200),
});

export type BudgetsFormInput = z.infer<typeof budgetsFormSchema>;
