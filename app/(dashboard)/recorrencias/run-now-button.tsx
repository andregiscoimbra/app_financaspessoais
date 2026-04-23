"use client";

import { Loader2, Play } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { executarRecorrenciasHojeAction } from "./actions";

export function RunNowButton() {
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      const result = await executarRecorrenciasHojeAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const n = result.data?.inserted ?? 0;
      if (n === 0) {
        toast.info("Nenhuma recorrência vence hoje (ou já foi gerada).");
      } else {
        toast.success(
          `${n} ${n === 1 ? "transação criada" : "transações criadas"} a partir das recorrências.`,
        );
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleRun} disabled={isPending}>
      {isPending ? <Loader2 className="animate-spin" /> : <Play />}
      Executar hoje agora
    </Button>
  );
}
