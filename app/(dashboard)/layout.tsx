import { redirect } from "next/navigation";

import { BottomTab } from "@/components/dashboard/bottom-tab";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout do app autenticado. Faz uma checagem rígida de sessão por página:
 * se não houver usuário, redireciona pra /login.
 *
 * O middleware já faz a checagem primária, mas duplicar aqui garante que
 * Server Components filhos sempre tenham um usuário válido (belt-and-suspenders).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header email={user.email ?? ""} />

        {/* pb-20 no mobile evita que o bottom-tab cubra o conteúdo final */}
        <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8">{children}</main>
      </div>

      <BottomTab />
    </div>
  );
}
