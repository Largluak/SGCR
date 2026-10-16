import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Monitor, Smartphone } from "lucide-react";
import { MarcaSelo } from "@/components/marca-provider";

export const metadata: Metadata = {
  title: "Comandas",
};

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-3xl">
        <div className="mb-12 text-center">
          <MarcaSelo />
          <h1 className="text-balance text-3xl font-semibold sm:text-4xl md:text-5xl">
            Sistema de Comandas
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Dois modos de uso, um único sistema: o app do garçom para o salão e
            o painel de gestão para o escritório.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/garcom"
            className="group flex min-h-11 flex-col justify-between rounded-md border border-salao-raised bg-salao-card p-6 sm:p-8"
          >
            <div>
              <div className="mb-6 flex size-12 items-center justify-center rounded-md bg-salao-raised text-salao-ink">
                <Smartphone className="size-6" />
              </div>
              <h2 className="text-xl font-semibold text-salao-ink">App do Garçom</h2>
              <p className="mt-2 text-sm leading-relaxed text-salao-muted">
                Mesas, comandas, cardápio e fechamento de conta. Otimizado para
                tablet e celular.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-sm font-medium text-brand">
              Abrir salão
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
          <Link
            href="/login"
            className="group flex min-h-11 flex-col justify-between rounded-md border bg-card p-6 sm:p-8 hover:border-brand"
          >
            <div>
              <div className="mb-6 flex size-12 items-center justify-center rounded-md bg-secondary">
                <Monitor className="size-6" />
              </div>
              <h2 className="text-xl font-semibold">Painel de Gestão</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Login, visão do dia, cardápio, estoque e relatórios. Otimizado
                para desktop.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono text-sm font-medium text-brand">
              Entrar
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="/gestao" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline">
            Ir direto para o dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
