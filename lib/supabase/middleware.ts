import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

/**
 * Rotas públicas — acessíveis sem sessão. Se o usuário estiver logado e
 * tentar acessar uma delas, é redirecionado pro dashboard.
 */
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"];

/**
 * Rotas que sempre são acessíveis (callback de auth, arquivos estáticos),
 * independentemente de sessão.
 */
const OPEN_ROUTES = ["/auth/callback"];

/**
 * Atualiza a sessão do Supabase a cada requisição e aplica a lógica de
 * redirect entre rotas públicas e protegidas.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rotas abertas (callback de auth) — deixa passar sem checagem.
  if (OPEN_ROUTES.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Não logado tentando acessar rota protegida → manda pro /login.
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logado tentando acessar rota pública (login/signup/forgot) → manda pro /dashboard.
  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
