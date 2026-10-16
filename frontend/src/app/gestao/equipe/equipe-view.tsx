"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Perfil } from "@/lib/types";
import { Estado } from "@/components/estado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Membro = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
};

export function EquipeView() {
  const [membros, setMembros] = useState<Membro[]>([]);
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
      setMembros(await api<Membro[]>("/usuarios"));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar a equipe.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const garcons = membros.filter((membro) => membro.perfil === "GARCOM");

  async function adicionar(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setAviso(null);
    try {
      await api("/usuarios", {
        method: "POST",
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha }),
      });
      setNome("");
      setEmail("");
      setSenha("");
      await carregar();
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível incluir o garçom.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(membro: Membro) {
    setAviso(null);
    try {
      await api(`/usuarios/${membro.id}`, { method: "DELETE" });
      await carregar();
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível remover o garçom.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Equipe</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Cadastre quem atende o salão. O garçom entra com o e-mail e a senha definidos aqui e usa o app do salão.
      </p>

      <form onSubmit={adicionar} className="mt-6 space-y-4 rounded-xl border bg-card p-4">
        <h2 className="font-medium">Novo garçom</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome-garcom">Nome</Label>
            <Input id="nome-garcom" value={nome} onChange={(event) => setNome(event.target.value)} required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-garcom">E-mail</Label>
            <Input id="email-garcom" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="off" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="senha-garcom">Senha</Label>
            <Input id="senha-garcom" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} required minLength={6} autoComplete="new-password" />
          </div>
        </div>
        {aviso ? <p className="text-sm text-destructive">{aviso}</p> : null}
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Adicionar garçom"}
        </Button>
      </form>

      <section className="mt-6">
        <h2 className="font-medium">Quem pode entrar</h2>
        <Estado
          carregando={carregando}
          erro={erro}
          onTentar={carregar}
          vazio={!carregando && !erro && membros.length === 0}
          tituloVazio="Nenhuma conta cadastrada"
          textoVazio="O acesso do gerente aparece aqui junto com os garçons."
        >
          {garcons.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum garçom cadastrado ainda.</p>
          ) : null}
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {membros.map((membro) => (
              <li key={membro.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{membro.nome}</p>
                  <p className="truncate text-sm text-muted-foreground">{membro.email}</p>
                </div>
                {membro.perfil === "GARCOM" ? (
                  <Button type="button" size="sm" variant="destructive" onClick={() => void remover(membro)}>
                    Remover
                  </Button>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">Gerente</span>
                )}
              </li>
            ))}
          </ul>
        </Estado>
      </section>
    </div>
  );
}
