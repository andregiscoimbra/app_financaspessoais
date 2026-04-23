"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupSchema, type SignupInput } from "@/lib/validators/auth";

import { signupAction } from "../actions";

export function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  function onSubmit(values: SignupInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signupAction(values);
      if (result.ok) {
        setSentTo(values.email);
        toast.success("Cadastro criado. Verifique seu e-mail para confirmar.");
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  }

  if (sentTo) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-6 text-card-foreground">
        <div className="flex items-center gap-3 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">Cadastro criado</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação para <strong>{sentTo}</strong>. Abra o
          e-mail e clique no link para ativar sua conta.
        </p>
        <p className="text-xs text-muted-foreground">
          Não recebeu? Verifique a caixa de spam. O link expira em 1 hora.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          disabled={isPending}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          disabled={isPending}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {serverError}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Criando conta…
          </>
        ) : (
          "Criar conta"
        )}
      </Button>
    </form>
  );
}
