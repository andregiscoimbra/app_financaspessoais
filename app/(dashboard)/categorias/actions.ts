"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { categoriaSchema, type CategoriaInput } from "@/lib/validators/categories";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");
  return { supabase, user };
}

export async function criarCategoriaAction(
  input: CategoriaInput,
): Promise<ActionResult> {
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { supabase, user } = await requireUser();

    const { error } = await supabase.from("categories").insert({
      user_id: user.id,
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
      cor: parsed.data.cor ?? null,
      icone: parsed.data.icone ?? null,
      grupo_meta: parsed.data.tipo === "despesa" ? (parsed.data.grupo_meta ?? null) : null,
      ativa: true,
    });

    if (error) {
      console.error("Erro ao criar categoria:", error);
      return { ok: false, error: "Não foi possível salvar." };
    }

    revalidatePath("/categorias");
    revalidatePath("/metas");
    revalidatePath("/transacoes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

export async function atualizarCategoriaAction(
  id: string,
  input: CategoriaInput,
): Promise<ActionResult> {
  const parsed = categoriaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("categories")
      .update({
        nome: parsed.data.nome,
        tipo: parsed.data.tipo,
        cor: parsed.data.cor ?? null,
        icone: parsed.data.icone ?? null,
        grupo_meta:
          parsed.data.tipo === "despesa" ? (parsed.data.grupo_meta ?? null) : null,
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar categoria:", error);
      return { ok: false, error: "Não foi possível salvar." };
    }

    revalidatePath("/categorias");
    revalidatePath("/metas");
    revalidatePath("/transacoes");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}

export async function alternarAtivaCategoriaAction(
  id: string,
  ativa: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("categories")
      .update({ ativa })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alterar categoria:", error);
      return { ok: false, error: "Não foi possível alterar." };
    }

    revalidatePath("/categorias");
    revalidatePath("/metas");
    revalidatePath("/transacoes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }
}
