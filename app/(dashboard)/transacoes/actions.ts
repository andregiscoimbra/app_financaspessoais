"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { transacaoSchema, type TransacaoInput } from "@/lib/validators/transactions";

type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Garante que o usuário está autenticado antes de qualquer escrita. */
async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");
  return { supabase, user };
}

export async function criarTransacaoAction(
  input: TransacaoInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transacaoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { supabase, user } = await requireUser();

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        tipo: parsed.data.tipo,
        valor: parsed.data.valor,
        data: parsed.data.data,
        descricao: parsed.data.descricao,
        estabelecimento: parsed.data.estabelecimento ?? null,
        categoria_id: parsed.data.categoria_id,
        meio_pagamento: parsed.data.meio_pagamento ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao criar transação:", error);
      return { ok: false, error: "Não foi possível salvar. Tente novamente." };
    }

    revalidatePath("/transacoes");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

export async function atualizarTransacaoAction(
  id: string,
  input: TransacaoInput,
): Promise<ActionResult> {
  const parsed = transacaoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("transactions")
      .update({
        tipo: parsed.data.tipo,
        valor: parsed.data.valor,
        data: parsed.data.data,
        descricao: parsed.data.descricao,
        estabelecimento: parsed.data.estabelecimento ?? null,
        categoria_id: parsed.data.categoria_id,
        meio_pagamento: parsed.data.meio_pagamento ?? null,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar transação:", error);
      return { ok: false, error: "Não foi possível atualizar. Tente novamente." };
    }

    revalidatePath("/transacoes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

export async function excluirTransacaoAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      console.error("Erro ao excluir transação:", error);
      return { ok: false, error: "Não foi possível excluir. Tente novamente." };
    }

    revalidatePath("/transacoes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

/** Duplica uma transação com a data de hoje (mantém os outros campos). */
export async function duplicarTransacaoAction(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await requireUser();

    const { data: original, error: selectError } = await supabase
      .from("transactions")
      .select("tipo, valor, descricao, estabelecimento, categoria_id, meio_pagamento")
      .eq("id", id)
      .single();

    if (selectError || !original) {
      return { ok: false, error: "Transação não encontrada." };
    }

    const hoje = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        ...original,
        data: hoje,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao duplicar transação:", error);
      return { ok: false, error: "Não foi possível duplicar. Tente novamente." };
    }

    revalidatePath("/transacoes");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}
