"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function Pagination({ page, pageSize, total }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function buildHref(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link
            href={buildHref(page - 1)}
            aria-disabled={page <= 1}
            aria-label="Página anterior"
            tabIndex={page <= 1 ? -1 : undefined}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
          <Link
            href={buildHref(page + 1)}
            aria-disabled={page >= totalPages}
            aria-label="Próxima página"
            tabIndex={page >= totalPages ? -1 : undefined}
            className={
              page >= totalPages ? "pointer-events-none opacity-50" : undefined
            }
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
