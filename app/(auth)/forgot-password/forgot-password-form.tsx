"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validators/auth";

import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(values);
      if (result.ok) {
        setSentTo(values.email);
        toast.success("Se a conta existir, enviaremos um e-mail.");
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
          <p className="text-sm font-medium">E-mail enviado</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Se existe uma conta para <strong>{sentTo}</strong>, você receberá em
          instantes um link para redefinir a senha. Verifique a caixa de entrada
          e o spam.
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
            Enviando…
          </>
        ) : (
          "Enviar link de recuperação"
        )}
      </Button>
    </form>
  );
}
