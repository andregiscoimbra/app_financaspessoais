import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback usado pelo Supabase Auth após:
 * - confirmação de e-mail (signup)
 * - recuperação de senha
 * - login com magic link
 *
 * O Supabase envia o usuário de volta com `?code=<otp>&next=<path>`.
 * Trocamos o code por uma sessão e redirecionamos para `next` (ou /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Em caso de erro ou code ausente, volta ao login com um erro visível.
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Não foi possível confirmar o acesso.")}`,
  );
}
