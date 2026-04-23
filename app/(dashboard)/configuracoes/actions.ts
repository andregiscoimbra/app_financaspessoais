"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

const nomeSchema = z
  .string()
  .trim()
  .min(2, "Nome muito curto.")
  .max(80, "Nome muito longo.");

export async function atualizarNomeAction(nome: string): Promise<ActionResult> {
  const parsed = nomeSchema.safeParse(nome);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Nome inválido." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Faça login." };

  const { error } = await supabase.auth.updateUser({
    data: { nome: parsed.data },
  });

  if (error) {
    console.error("Erro ao atualizar nome:", error);
    return { ok: false, error: "Não foi possível salvar." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
