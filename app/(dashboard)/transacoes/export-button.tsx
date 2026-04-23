"use client";

import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  /** Se 0, desabilita o botão. */
  total: number;
}

export function ExportButton({ total }: ExportButtonProps) {
  const searchParams = useSearchParams();

  // Reaproveita os mesmos filtros da URL, exceto `page` (export puxa tudo).
  const params = new URLSearchParams(searchParams.toString());
  params.delete("page");
  const qs = params.toString();
  const href = `/api/export-csv${qs ? `?${qs}` : ""}`;

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      disabled={total === 0}
      aria-disabled={total === 0}
    >
      <a
        href={href}
        download
        aria-label="Exportar transações filtradas em CSV"
        className={total === 0 ? "pointer-events-none opacity-50" : undefined}
      >
        <Download className="h-4 w-4" />
        Exportar CSV
      </a>
    </Button>
  );
}
