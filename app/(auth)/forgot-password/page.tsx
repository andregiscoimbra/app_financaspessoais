import Link from "next/link";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Recuperar senha · Dashboard de Finanças",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground">
          Digite seu e-mail e enviaremos um link para redefinir a senha.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
