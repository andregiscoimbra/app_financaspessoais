"use client";

import { Eye, EyeOff, MoreHorizontal, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Categoria } from "@/types";

import { alternarAtivaCategoriaAction } from "./actions";
import { CategoryDialog } from "./category-dialog";

interface CategoryRowActionsProps {
  categoria: Categoria;
}

export function CategoryRowActions({ categoria }: CategoryRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await alternarAtivaCategoriaAction(categoria.id, !categoria.ativa);
      if (result.ok) {
        toast.success(
          categoria.ativa ? "Categoria desativada." : "Categoria reativada.",
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Ações da categoria"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleToggle} disabled={isPending}>
            {categoria.ativa ? <EyeOff /> : <Eye />}
            {categoria.ativa ? "Desativar" : "Reativar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryDialog
        categoria={categoria}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
