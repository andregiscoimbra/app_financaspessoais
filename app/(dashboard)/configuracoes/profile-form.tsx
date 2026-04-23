"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { atualizarNomeAction } from "./actions";

interface ProfileFormProps {
  nomeAtual: string;
  email: string;
}

export function ProfileForm({ nomeAtual, email }: ProfileFormProps) {
  const [nome, setNome] = useState(nomeAtual);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await atualizarNomeAction(nome);
      if (result.ok) {
        toast.success("Nome atualizado.");
      } else {
        toast.error(result.error);
      }
    });
  }

  const dirty = nome.trim() !== nomeAtual.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Perfil</CardTitle>
        <CardDescription>
          O nome aparece na saudação do dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={email} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              Para mudar o e-mail, entre em contato com o suporte.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome de exibição</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isPending}
              placeholder="Como quer ser chamado(a)?"
              maxLength={80}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!dirty || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <Save />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
