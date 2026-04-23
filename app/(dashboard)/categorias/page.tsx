import { listCategorias } from "@/lib/queries/categories";
import { createClient } from "@/lib/supabase/server";

import { CategoryDialog } from "./category-dialog";
import { CategoryList } from "./category-list";

export const metadata = { title: "Categorias · Finanças Pessoais" };
export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const supabase = createClient();
  const categorias = await listCategorias(supabase, { incluirInativas: true });

  const despesas = categorias.filter((c) => c.tipo === "despesa");
  const receitas = categorias.filter((c) => c.tipo === "receita");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize suas receitas e despesas. Categorias desativadas somem dos
            formulários mas mantêm o histórico.
          </p>
        </div>
        <CategoryDialog />
      </div>

      <CategoryList
        categorias={despesas}
        titulo="Despesas"
        descricao={`${despesas.filter((c) => c.ativa).length} ativas de ${despesas.length} categorias.`}
        vazioMensagem="Nenhuma categoria de despesa. Crie uma para começar."
      />

      <CategoryList
        categorias={receitas}
        titulo="Receitas"
        descricao={`${receitas.filter((c) => c.ativa).length} ativas de ${receitas.length} categorias.`}
        vazioMensagem="Nenhuma categoria de receita. Crie uma para começar."
      />
    </div>
  );
}
