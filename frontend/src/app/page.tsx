import type { Metadata } from "next";
import Link from "next/link";
import { MarcaNome } from "@/components/marca-provider";

export const metadata: Metadata = {
  title: "Comandas",
};

export default function HomePage() {
  return (
    <main className="min-h-dvh">
      <div className="mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="flex flex-col justify-between gap-14 px-5 py-10 sm:px-10 sm:py-14">
          <p className="font-heading text-2xl text-brand">
            <MarcaNome />
          </p>
          <div>
            <h1 className="max-w-xl text-[2.5rem] leading-[1.02] sm:text-6xl">
              A conta da mesa, sem papel solto.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              O salão anota o pedido. A gestão vê o dia, o estoque de bebida e o que já foi pago.
            </p>
            <Link
              href="/gestao"
              className="mt-8 inline-flex min-h-11 items-center text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors duration-200 hover:text-foreground"
            >
              Já entrou hoje? Abrir a gestão
            </Link>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Pensado para um restaurante pequeno: um turno, poucas mesas, a equipe que já está no salão.
          </p>
        </section>
        <section className="flex flex-col justify-center gap-3 bg-salao px-5 py-12 text-salao-ink sm:px-10 lg:px-12">
          <Link
            href="/garcom"
            className="group rounded-3xl border border-salao-line bg-salao-card px-6 py-7 transition-[transform,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand active:scale-[0.99]"
          >
            <p className="text-sm text-salao-muted">No salão</p>
            <h2 className="mt-2 text-4xl text-salao-ink">Garçom</h2>
            <p className="mt-3 max-w-xs text-base leading-relaxed text-salao-muted">
              Mesas, cardápio e fechamento da conta.
            </p>
            <p className="mt-8 text-sm text-brand">Abrir o salão</p>
          </Link>
          <Link
            href="/login"
            className="rounded-3xl px-6 py-5 transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-salao-raised active:scale-[0.99]"
          >
            <p className="text-sm text-salao-muted">No escritório</p>
            <h2 className="mt-1 text-3xl text-salao-ink">Gestão</h2>
            <p className="mt-2 text-sm leading-relaxed text-salao-muted">
              Entrar com o usuário da casa.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
