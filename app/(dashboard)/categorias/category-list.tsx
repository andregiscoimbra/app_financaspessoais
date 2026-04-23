import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCategoryIcon } from "@/lib/utils/category-icons";
import { cn } from "@/lib/utils/cn";
import type { Categoria } from "@/types";

import { CategoryRowActions } from "./category-row-actions";

interface CategoryListProps {
  categorias: Categoria[];
  titulo: string;
  descricao?: string;
  vazioMensagem?: string;
}

export function CategoryList({
  categorias,
  titulo,
  descricao,
  vazioMensagem,
}: CategoryListProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
      </div>

      {categorias.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {vazioMensagem ?? "Nenhuma categoria."}
        </Card>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {categorias.map((c) => {
            const Icon = getCategoryIcon(c.icone);
            const cor = c.cor ?? "#6b7280";

            return (
              <li
                key={c.id}
                className={cn(
                  "flex items-center gap-3 p-3 transition-opacity",
                  !c.ativa && "opacity-50",
                )}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${cor}20`, color: cor }}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{c.nome}</p>
                    {!c.ativa && (
                      <Badge variant="outline" className="font-normal">
                        Inativa
                      </Badge>
                    )}
                  </div>
                </div>

                <CategoryRowActions categoria={c} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
