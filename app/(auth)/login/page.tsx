import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar · Dashboard de Finanças",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Entre com seu e-mail e senha para acessar o dashboard.
        </p>
      </div>

      {searchParams.error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {searchParams.error}
        </div>
      )}

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta ainda?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
