"use client";

import { Button } from "@/components/ui/button";

export function Estado({
  carregando,
  erro,
  vazio,
  tituloVazio,
  textoVazio,
  onTentar,
  children,
}: {
  carregando?: boolean;
  erro?: string | null;
  vazio?: boolean;
  tituloVazio?: string;
  textoVazio?: string;
  onTentar?: () => void;
  children: React.ReactNode;
}) {
  if (carregando) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }
  if (erro) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm">{erro}</p>
        {onTentar ? (
          <Button className="mt-3" variant="outline" onClick={onTentar}>
            Tentar de novo
          </Button>
        ) : null}
      </div>
    );
  }
  if (vazio) {
    return (
      <div className="rounded-lg border border-dashed p-6">
        <p className="font-medium">{tituloVazio}</p>
        {textoVazio ? (
          <p className="mt-1 text-sm text-muted-foreground">{textoVazio}</p>
        ) : null}
      </div>
    );
  }
  return children;
}
