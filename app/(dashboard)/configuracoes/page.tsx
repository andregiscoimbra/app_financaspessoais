import { createClient } from "@/lib/supabase/server";

import { ProfileForm } from "./profile-form";

export const metadata = { title: "Configurações · Finanças Pessoais" };
export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nomeAtual = (user?.user_metadata?.nome as string | undefined) ?? "";
  const email = user?.email ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Ajuste seu nome de exibição e veja os dados da sua conta.
        </p>
      </div>

      <ProfileForm nomeAtual={nomeAtual} email={email} />
    </div>
  );
}
