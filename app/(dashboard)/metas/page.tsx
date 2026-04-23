import Link from "next/link";

import { FiftyThirtyTwentyCard } from "@/components/dashboard/fifty-thirty-twenty-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { listBudgetsVigentes } from "@/lib/queries/budgets";
import { listCategorias } from "@/lib/queries/categories";
import { createClient } from "@/lib/supabase/server";

import { BudgetsForm } from "./budgets-form";

export const metadata = { title: "Metas · Finanças Pessoais" };
export const dynamic = "force-dynamic";

export default async function MetasPage() {
  const supabase = createClient();

  const [todasCategorias, budgets] = await Promise.all([
    listCategorias(supabase),
    listBudgetsVigentes(supabase),
  ]);

  const despesas = todasCategorias
    .filter((c) => c.tipo === "despesa" && c.ativa)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  // Map categoria_id → valor atual
  const metasAtuais: Record<string, number> = {};
  for (const b of budgets) {
    metasAtuais[b.categoria_id] = Number(b.valor_mensal);
  }

  // Pra o card 50/30/20 (sem receita — mostra só necessidades/desejos do orçado)
  const despesasComMeta = despesas
    .map((c) => ({ nome: c.nome, valor: metasAtuais[c.id] ?? 0 }))
    .filter((c) => c.valor > 0);

  if (despesas.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Metas</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CardTitle className="text-base">Nenhuma categoria de despesa ativa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Crie ou reative categorias de despesa para definir metas mensais.
            </p>
            <Button asChild variant="outline">
              <Link href="/categorias">Ir para Categorias</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Metas mensais</h1>
        <p className="text-sm text-muted-foreground">
          Defina o valor mensal que você quer reservar para cada categoria.
          Use a referência 50/30/20 como guia.
        </p>
      </div>

      <FiftyThirtyTwentyCard
        despesas={despesasComMeta}
        descricao="Referência saudável: 50% necessidades, 30% desejos. O cálculo considera apenas o total das suas metas de despesa."
      />

      <BudgetsForm despesas={despesas} metasAtuais={metasAtuais} />
    </div>
  );
}
