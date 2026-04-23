"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { budgetsFormSchema, type BudgetsFormInput } from "@/lib/validators/budgets";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");
  return { supabase, user };
}

/**
 * Salva múltiplos orçamentos de uma vez.
 *
 * Estratégia simples: para cada categoria enviada, "zeramos" as vigentes
 * (vigente_ate NULL) antigas setando `vigente_ate` = ontem, e inserimos
 * uma nova linha com `vigente_desde` = hoje e `vigente_ate` = NULL.
 *
 * Se valor_mensal = 0 e não existe meta, não cria nada (evita registros
 * sem efeito prático).
 */
export async function salvarMetasAction(
  input: BudgetsFormInput,
): Promise<ActionResult> {
  const parsed = budgetsFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { supabase, user } = await requireUser();

    const hoje = new Date();
    const hojeISO = hoje.toISOString().slice(0, 10);
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const ontemISO = ontem.toISOString().slice(0, 10);

    // Pega os orçamentos vigentes atuais do usuário
    const { data: atuais, error: selectError } = await supabase
      .from("budgets")
      .select("id, categoria_id, valor_mensal")
      .is("vigente_ate", null);

    if (selectError) {
      console.error(selectError);
      return { ok: false, error: "Erro ao carregar metas atuais." };
    }

    type BudgetRow = { id: string; categoria_id: string; valor_mensal: number };
    const atuaisMap = new Map<string, BudgetRow>();
    for (const row of (atuais ?? []) as BudgetRow[]) {
      atuaisMap.set(row.categoria_id, row);
    }

    const paraInserir: Array<{
      user_id: string;
      categoria_id: string;
      valor_mensal: number;
      vigente_desde: string;
      vigente_ate: null;
    }> = [];
    const idsParaEncerrar: string[] = [];

    for (const b of parsed.data.budgets) {
      const atual = atuaisMap.get(b.categoria_id);

      // Se valor é igual ao atual (com tolerância de 0.01), pula
      if (atual && Math.abs(Number(atual.valor_mensal) - b.valor_mensal) < 0.005) {
        continue;
      }

      if (atual) {
        idsParaEncerrar.push(atual.id);
      }

      // Só insere se valor > 0 (meta zerada = sem meta)
      if (b.valor_mensal > 0) {
        paraInserir.push({
          user_id: user.id,
          categoria_id: b.categoria_id,
          valor_mensal: b.valor_mensal,
          vigente_desde: hojeISO,
          vigente_ate: null,
        });
      }
    }

    // Encerra vigências antigas
    if (idsParaEncerrar.length > 0) {
      const { error: updateError } = await supabase
        .from("budgets")
        .update({ vigente_ate: ontemISO })
        .in("id", idsParaEncerrar);

      if (updateError) {
        console.error(updateError);
        return { ok: false, error: "Erro ao encerrar metas antigas." };
      }
    }

    // Insere novas vigentes
    if (paraInserir.length > 0) {
      const { error: insertError } = await supabase
        .from("budgets")
        .insert(paraInserir);

      if (insertError) {
        console.error(insertError);
        return { ok: false, error: "Erro ao salvar novas metas." };
      }
    }

    revalidatePath("/metas");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}
