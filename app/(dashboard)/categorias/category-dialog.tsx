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
import type { Categoria, TipoTransacao } from "@/types";

import { CategoryForm } from "./category-form";

interface CategoryDialogProps {
  categoria?: Categoria;
  tipoInicial?: TipoTransacao;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CategoryDialog({
  categoria,
  tipoInicial,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: CategoryDialogProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChangeProp ?? setOpenInternal;
  const isEdit = Boolean(categoria);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : openProp === undefined ? (
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus />
            Nova categoria
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Altere o nome, cor ou ícone."
              : "Dê um nome, escolha tipo, cor e ícone."}
          </DialogDescription>
        </DialogHeader>

        <CategoryForm
          categoria={categoria}
          tipoInicial={tipoInicial}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
