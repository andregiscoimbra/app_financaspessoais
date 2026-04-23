import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Página raiz — redireciona para o destino correto conforme o estado de sessão.
 * O middleware já cuida da proteção de rotas; aqui só escolhemos o destino inicial.
 */
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
