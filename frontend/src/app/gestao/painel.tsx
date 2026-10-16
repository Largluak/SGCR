"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RequireAuth, useAuth } from "@/components/auth-provider";
import { MarcaLogo, MarcaNome } from "@/components/marca-provider";
import { iniciais } from "@/lib/format";
import { cn } from "@/lib/utils";

const links = [
  { href: "/gestao", label: "Visão geral" },
  { href: "/gestao/cardapio", label: "Cardápio" },
  { href: "/gestao/estoque", label: "Estoque" },
  { href: "/gestao/relatorios", label: "Relatórios" },
  { href: "/gestao/equipe", label: "Equipe" },
  { href: "/gestao/marca", label: "Aparência" },
];

export function Painel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, sair } = useAuth();

  function ativo(href: string) {
    return href === "/gestao" ? pathname === href : pathname.startsWith(href);
  }

  function encerrar() {
    sair();
    router.push("/login");
  }

  return (
    <RequireAuth papel="GERENTE">
      <div className="min-h-dvh overflow-x-clip md:flex">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/80 bg-card/80 md:flex">
          <div className="flex items-center gap-3 px-6 pt-8 pb-6">
            <MarcaLogo />
            <div className="min-w-0">
              <p className="truncate font-heading text-xl leading-none">
                <MarcaNome />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Gestão da casa</p>
            </div>
          </div>
          <nav className="mt-2 flex flex-col gap-0.5 px-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-h-11 items-center border-l-2 px-3 text-sm transition-colors duration-200",
                  ativo(link.href)
                    ? "border-brand bg-brand/10 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary font-mono text-xs">
                {usuario ? iniciais(usuario.nome) : ""}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{usuario?.nome}</p>
                <p className="text-xs text-muted-foreground">Gerente</p>
              </div>
            </div>
            <button
              type="button"
              className="mt-2 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={encerrar}
            >
              Sair
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="border-b border-border/70 px-4 py-3 md:px-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <MarcaLogo className="md:hidden" tamanho="size-8" />
                <p className="truncate text-lg md:text-base">
                  <MarcaNome />
                </p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center px-2 text-sm text-muted-foreground underline-offset-4 hover:underline md:hidden"
                onClick={encerrar}
              >
                Sair
              </button>
            </div>
          </header>
          <nav className="flex flex-wrap gap-2 border-b px-4 py-2 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full px-4 text-sm",
                  ativo(link.href) ? "bg-brand text-brand-foreground" : "bg-card text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-8 md:px-10 md:py-10">{children}</div>
        </div>
      </div>
    </RequireAuth>
  );
}
