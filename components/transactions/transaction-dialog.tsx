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
import { TransactionForm } from "@/components/transactions/transaction-form";
import type { Categoria, Transacao } from "@/types";

interface TransactionDialogProps {
  categorias: Categoria[];
  transacao?: Transacao;
  trigger?: ReactNode;
  /** Controle externo (opcional). Útil para abrir a partir de uma ação de menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionDialog({
  categorias,
  transacao,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: TransactionDialogProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChangeProp ?? setOpenInternal;

  const isEdit = Boolean(transacao);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : openProp === undefined ? (
        <DialogTrigger asChild>
          <Button>
            <Plus />
            Nova transação
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar transação" : "Nova transação"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Altere os dados e salve para atualizar."
              : "Preencha os dados da receita ou despesa."}
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          categorias={categorias}
          transacao={transacao}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
