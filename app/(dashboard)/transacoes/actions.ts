"use server";

import { addMonths, format, parse } from "date-fns";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  transacaoComParcelasSchema,
  transacaoSchema,
  type TransacaoComParcelasInput,
  type TransacaoInput,
} from "@/lib/validators/transactions";

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
  input: TransacaoComParcelasInput,
): Promise<ActionResult<{ count: number }>> {
  const parsed = transacaoComParcelasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const values = parsed.data;

  try {
    const { supabase, user } = await requireUser();

    // Caminho simples: à vista (sem parcelamento).
    if (!values.parcelar || !values.parcelas) {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        tipo: values.tipo,
        valor: values.valor,
        data: values.data,
        descricao: values.descricao,
        estabelecimento: values.estabelecimento ?? null,
        categoria_id: values.categoria_id,
        meio_pagamento: values.meio_pagamento ?? null,
      });

      if (error) {
        console.error("Erro ao criar transação:", error);
        return { ok: false, error: "Não foi possível salvar. Tente novamente." };
      }

      revalidatePath("/transacoes");
      revalidatePath("/dashboard");
      return { ok: true, data: { count: 1 } };
    }

    // Caminho parcelado: cria N linhas, uma por mês, com valor dividido.
    const n = values.parcelas;
    // Divide mantendo 2 casas decimais e joga o arredondamento na última parcela
    // (evita erro de centavos acumulado).
    const valorBase = Math.floor((values.valor * 100) / n) / 100;
    const ultimaParcela = Number((values.valor - valorBase * (n - 1)).toFixed(2));

    const dataBase = parse(values.data, "yyyy-MM-dd", new Date());

    const rows = Array.from({ length: n }).map((_, i) => {
      const isUltima = i === n - 1;
      return {
        user_id: user.id,
        tipo: values.tipo,
        valor: isUltima ? ultimaParcela : valorBase,
        data: format(addMonths(dataBase, i), "yyyy-MM-dd"),
        descricao: `${values.descricao} (${i + 1}/${n})`,
        estabelecimento: values.estabelecimento ?? null,
        categoria_id: values.categoria_id,
        meio_pagamento: values.meio_pagamento ?? null,
        parcela_atual: i + 1,
        parcela_total: n,
      };
    });

    const { error } = await supabase.from("transactions").insert(rows);
    if (error) {
      console.error("Erro ao criar parcelamento:", error);
      return { ok: false, error: "Não foi possível salvar as parcelas." };
    }

    revalidatePath("/transacoes");
    revalidatePath("/dashboard");
    return { ok: true, data: { count: n } };
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
