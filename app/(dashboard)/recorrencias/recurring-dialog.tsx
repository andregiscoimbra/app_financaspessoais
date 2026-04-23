"use client";

import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Categoria, TransacaoRecorrente } from "@/types";

import { RecurringForm } from "./recurring-form";

interface RecurringDialogProps {
  categorias: Categoria[];
  recorrencia?: TransacaoRecorrente;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RecurringDialog({
  categorias,
  recorrencia,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: RecurringDialogProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChangeProp ?? setOpenInternal;
  const isEdit = Boolean(recorrencia);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : openProp === undefined ? (
        <DialogTrigger asChild>
          <Button>
            <Plus />
            Nova recorrência
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar recorrência" : "Nova recorrência"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Altere os dados da recorrência. Transações já geradas no passado não mudam."
              : "Cadastre uma transação que se repete todo mês automaticamente."}
          </DialogDescription>
        </DialogHeader>

        <RecurringForm
          categorias={categorias}
          recorrencia={recorrencia}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
