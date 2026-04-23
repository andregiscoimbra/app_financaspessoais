"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { sincronizarRecorrenciasAction } from "./actions";

/**
 * Botão que sincroniza TODAS as recorrências ativas: cria retroativamente
 * qualquer transação em atraso (desde `vigente_desde` até hoje).
 *
 * Substitui o antigo "Executar hoje agora" (que só rodava o dia atual) —
 * agora cobre também meses anteriores, importante pra quem cadastrou uma
 * recorrência com data retroativa.
 */
export function RunNowButton() {
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      const result = await sincronizarRecorrenciasAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const n = result.data?.inserted ?? 0;
      if (n === 0) {
        toast.info("Tudo em dia. Nenhuma transação nova foi gerada.");
      } else {
        toast.success(
          `${n} ${n === 1 ? "transação criada" : "transações criadas"} a partir das recorrências.`,
        );
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleRun} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Sincronizar agora
    </Button>
  );
}
