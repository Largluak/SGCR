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
  { href: "/gestao/marca", label: "Aparência" },
];

export function Painel({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, sair } = useAuth();

  function ativo(href: string) {
    return href === "/gestao" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <RequireAuth papel="GERENTE">
      <div className="min-h-screen md:flex">
        <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
          <div className="flex items-center gap-3 px-5 py-6">
            <MarcaLogo />
            <div>
              <p className="font-mono text-xs text-accent">
                <MarcaNome />
              </p>
              <p className="mt-1 font-semibold">Painel de gestão</p>
            </div>
          </div>
          <p className="px-5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Operação
          </p>
          <nav className="mt-2 flex flex-col gap-1 px-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm",
                  ativo(link.href) ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-secondary/70",
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
              <div>
                <p className="text-sm font-medium">{usuario?.nome}</p>
                <p className="text-xs text-muted-foreground">Gerente</p>
              </div>
            </div>
            <button
              type="button"
              className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => {
                sair();
                router.push("/login");
              }}
            >
              Sair
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="border-b bg-card/80 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <MarcaLogo className="md:hidden" tamanho="size-8" />
              <p className="text-sm text-muted-foreground">
                <MarcaNome />
              </p>
            </div>
          </header>
          <nav className="flex gap-2 overflow-x-auto border-b px-4 py-3 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-sm",
                  ativo(link.href) ? "bg-primary text-primary-foreground" : "bg-secondary",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-6 md:px-8">{children}</div>
        </div>
      </div>
    </RequireAuth>
  );
}
