import { Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { listCategorias } from "@/lib/queries/categories";
import { listRecorrencias } from "@/lib/queries/recurring-transactions";
import { createClient } from "@/lib/supabase/server";

import { RecurringDialog } from "./recurring-dialog";
import { RecurringList } from "./recurring-list";
import { RunNowButton } from "./run-now-button";

export const metadata = { title: "Recorrências · Finanças Pessoais" };
export const dynamic = "force-dynamic";

export default async function RecorrenciasPage() {
  const supabase = createClient();

  const [recorrencias, categorias] = await Promise.all([
    listRecorrencias(supabase),
    listCategorias(supabase),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recorrências</h1>
          <p className="text-sm text-muted-foreground">
            Transações que se repetem todo mês. O sistema gera automaticamente
            quando chega o dia marcado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RunNowButton />
          <RecurringDialog categorias={categorias} />
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-medium">Como funciona</p>
            <p className="text-xs text-muted-foreground">
              Toda recorrência ativa cria uma transação no dia escolhido de cada mês.
              Dia 31 cai no último dia quando não existe (ex: 28 em fevereiro).
              Use <strong>Pausar</strong> para suspender temporariamente sem perder a configuração.
              A geração automática roda uma vez por dia (06:00 UTC, se o cron estiver habilitado).
              Você também pode rodar manualmente no botão <strong>Executar hoje agora</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      <RecurringList recorrencias={recorrencias} categorias={categorias} />
    </div>
  );
}
