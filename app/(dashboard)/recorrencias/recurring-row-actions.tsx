"use client";

import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Categoria, TransacaoRecorrente } from "@/types";

import {
  alternarAtivaRecorrenciaAction,
  excluirRecorrenciaAction,
} from "./actions";
import { RecurringDialog } from "./recurring-dialog";

interface RecurringRowActionsProps {
  recorrencia: TransacaoRecorrente;
  categorias: Categoria[];
}

export function RecurringRowActions({
  recorrencia,
  categorias,
}: RecurringRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await alternarAtivaRecorrenciaAction(
        recorrencia.id,
        !recorrencia.ativa,
      );
      if (result.ok) {
        toast.success(
          recorrencia.ativa ? "Recorrência pausada." : "Recorrência retomada.",
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await excluirRecorrenciaAction(recorrencia.id);
      if (result.ok) {
        toast.success("Recorrência excluída.");
        setDeleteOpen(false);
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
            aria-label="Ações da recorrência"
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
            {recorrencia.ativa ? <EyeOff /> : <Eye />}
            {recorrencia.ativa ? "Pausar" : "Retomar"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RecurringDialog
        categorias={categorias}
        recorrencia={recorrencia}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              As transações já geradas no passado <strong>continuam lá</strong> —
              apenas o modelo de repetição é removido. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
