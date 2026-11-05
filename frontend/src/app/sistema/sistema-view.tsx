"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequireAuth, useAuth } from "@/components/auth-provider";
import { Estado } from "@/components/estado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { iniciais } from "@/lib/format";

function conta(quantidade: number, singular: string, plural: string) {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

type Gerente = { id: string; nome: string; email: string };

type PainelSistema = {
  restaurantes: { id: string; nome: string; corSecundaria: string }[];
  operacao: { mesas: number; comandasAbertas: number; garcons: number };
  gerentes: Gerente[];
};

export function SistemaView() {
  return (
    <RequireAuth papel="DESENVOLVEDOR">
      <SistemaConteudo />
    </RequireAuth>
  );
}

function SistemaConteudo() {
  const router = useRouter();
  const { usuario, sair } = useAuth();
  const [painel, setPainel] = useState<PainelSistema | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setPainel(await api<PainelSistema>("/sistema"));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar o sistema.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function adicionar(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setAviso(null);
    try {
      await api("/sistema/gerentes", {
        method: "POST",
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha }),
      });
      setNome("");
      setEmail("");
      setSenha("");
      await carregar();
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível cadastrar o gerente.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(gerente: Gerente) {
    setAviso(null);
    try {
      await api(`/sistema/gerentes/${gerente.id}`, { method: "DELETE" });
      await carregar();
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível remover o gerente.");
    }
  }

  function encerrar() {
    sair();
    router.push("/login");
  }

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="border-b border-border/70 px-4 py-3 md:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="truncate text-lg">SGCR</p>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center px-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={encerrar}
          >
            Sair
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-10 md:py-10">
        <p className="text-sm text-muted-foreground">Conta de desenvolvedor</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Sistema</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {usuario?.nome} vê os restaurantes que estão no ar e cadastra quem gerencia a casa.
          O garçom continua sendo criado pelo gerente, em Equipe.
        </p>

        <Estado
          carregando={carregando}
          erro={erro}
          onTentar={carregar}
          vazio={!carregando && !erro && (painel?.restaurantes.length ?? 0) === 0}
          tituloVazio="Nenhum restaurante no sistema"
          textoVazio="Quando uma casa for cadastrada, ela aparece aqui."
        >
          <section className="mt-8">
            <h2 className="font-medium">Restaurantes</h2>
            <ul className="mt-3 space-y-3">
              {painel?.restaurantes.map((casa) => (
                <li key={casa.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="size-9 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: casa.corSecundaria }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate font-heading text-2xl leading-none">{casa.nome}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {conta(painel.operacao.mesas, "mesa", "mesas")} ·{" "}
                        {conta(painel.operacao.comandasAbertas, "comanda aberta", "comandas abertas")} ·{" "}
                        {conta(painel.operacao.garcons, "garçom", "garçons")}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/gestao"
              className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
            >
              Abrir a gestão da casa
            </Link>
          </section>

          <form onSubmit={adicionar} className="mt-8 space-y-4 rounded-xl border bg-card p-4">
            <h2 className="font-medium">Novo gerente</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome-gerente">Nome</Label>
                <Input
                  id="nome-gerente"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-gerente">E-mail</Label>
                <Input
                  id="email-gerente"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="senha-gerente">Senha</Label>
                <Input
                  id="senha-gerente"
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>
            {aviso ? <p className="text-sm text-destructive">{aviso}</p> : null}
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Cadastrar gerente"}
            </Button>
          </form>

          <section className="mt-6">
            <h2 className="font-medium">Quem gerencia</h2>
            {(painel?.gerentes.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum gerente cadastrado ainda.</p>
            ) : (
              <ul className="mt-3 divide-y rounded-xl border bg-card">
                {painel?.gerentes.map((gerente) => (
                  <li key={gerente.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-secondary font-mono text-xs">
                        {iniciais(gerente.nome)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{gerente.nome}</p>
                        <p className="truncate text-sm text-muted-foreground">{gerente.email}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => void remover(gerente)}
                      disabled={(painel?.gerentes.length ?? 0) <= 1}
                    >
                      Remover
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Estado>
      </div>
    </div>
  );
}
