import Link from "next/link";

import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Criar conta · Dashboard de Finanças",
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Comece em menos de 1 minuto — suas categorias iniciais são criadas automaticamente.
        </p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
