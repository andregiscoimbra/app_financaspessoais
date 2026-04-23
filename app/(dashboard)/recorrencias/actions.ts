"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  recorrenciaSchema,
  type RecorrenciaInput,
} from "@/lib/validators/recurring-transactions";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");
  return { supabase, user };
}

export async function criarRecorrenciaAction(
  input: RecorrenciaInput,
): Promise<ActionResult> {
  const parsed = recorrenciaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { supabase, user } = await requireUser();

    const { error } = await supabase.from("recurring_transactions").insert({
      user_id: user.id,
      tipo: parsed.data.tipo,
      valor: parsed.data.valor,
      descricao: parsed.data.descricao,
      estabelecimento: parsed.data.estabelecimento ?? null,
      categoria_id: parsed.data.categoria_id,
      meio_pagamento: parsed.data.meio_pagamento ?? null,
      dia_do_mes: parsed.data.dia_do_mes,
      vigente_desde: parsed.data.vigente_desde,
      vigente_ate: parsed.data.vigente_ate ?? null,
      ativa: parsed.data.ativa,
    });

    if (error) {
      console.error("Erro ao criar recorrência:", error);
      return { ok: false, error: "Não foi possível salvar. Tente novamente." };
    }

    revalidatePath("/recorrencias");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

export async function atualizarRecorrenciaAction(
  id: string,
  input: RecorrenciaInput,
): Promise<ActionResult> {
  const parsed = recorrenciaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("recurring_transactions")
      .update({
        tipo: parsed.data.tipo,
        valor: parsed.data.valor,
        descricao: parsed.data.descricao,
        estabelecimento: parsed.data.estabelecimento ?? null,
        categoria_id: parsed.data.categoria_id,
        meio_pagamento: parsed.data.meio_pagamento ?? null,
        dia_do_mes: parsed.data.dia_do_mes,
        vigente_desde: parsed.data.vigente_desde,
        vigente_ate: parsed.data.vigente_ate ?? null,
        ativa: parsed.data.ativa,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar recorrência:", error);
      return { ok: false, error: "Não foi possível atualizar." };
    }

    revalidatePath("/recorrencias");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

export async function alternarAtivaRecorrenciaAction(
  id: string,
  ativa: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("recurring_transactions")
      .update({ ativa })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alternar recorrência:", error);
      return { ok: false, error: "Não foi possível alterar." };
    }

    revalidatePath("/recorrencias");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

export async function excluirRecorrenciaAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir recorrência:", error);
      return { ok: false, error: "Não foi possível excluir." };
    }

    revalidatePath("/recorrencias");
    revalidatePath("/transacoes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

/**
 * Dispara manualmente a função SQL que gera transações das recorrências do dia.
 * Útil para testar antes de o cron rodar ou para "rodar agora" caso uma data
 * seja adicionada ao passado.
 *
 * A função é SECURITY DEFINER e só afeta as recorrências do próprio usuário
 * (protegida pelo RLS nas tabelas que consulta).
 */
export async function executarRecorrenciasHojeAction(): Promise<
  ActionResult<{ inserted: number }>
> {
  try {
    const { supabase } = await requireUser();

    const { data, error } = await supabase.rpc("generate_recurring_transactions_today");

    if (error) {
      console.error("Erro ao executar recorrências:", error);
      return {
        ok: false,
        error:
          "Não foi possível executar. Verifique se a função SQL foi criada no Supabase.",
      };
    }

    revalidatePath("/recorrencias");
    revalidatePath("/transacoes");
    revalidatePath("/dashboard");

    const inserted = typeof data === "number" ? data : 0;
    return { ok: true, data: { inserted } };
  } catch {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}
