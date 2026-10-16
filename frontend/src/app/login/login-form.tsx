"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { MarcaLogo, MarcaNome } from "@/components/marca-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Usuario } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const { usuario, pronto, entrar } = useAuth();
  const [email, setEmail] = useState("carla.souza@ardosia.local");
  const [senha, setSenha] = useState("gerente123");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!pronto || !usuario) return;
    router.replace(usuario.perfil === "GERENTE" ? "/gestao" : "/garcom");
  }, [pronto, router, usuario]);

  async function aoEnviar(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await api<{ accessToken: string; usuario: Usuario }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, senha }),
        },
      );
      entrar(resposta.accessToken, resposta.usuario);
      router.push(resposta.usuario.perfil === "GERENTE" ? "/gestao" : "/garcom");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha no login.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-salao px-12 py-14 text-salao-ink lg:flex">
        <p className="font-heading text-3xl">
          <MarcaNome />
        </p>
        <p className="max-w-sm font-heading text-4xl leading-[1.1] text-salao-ink">
          Quem atende entra no salão. Quem cuida da casa entra aqui.
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-salao-muted">
          O mesmo usuário serve para os dois lados. O perfil escolhe a tela.
        </p>
      </section>
      <section className="flex items-center justify-center px-4 py-12 sm:px-6">
      <form
        onSubmit={aoEnviar}
        className="w-full max-w-sm"
      >
        <div className="flex min-w-0 items-center gap-3">
          <MarcaLogo />
          <p className="min-w-0 truncate font-heading text-xl text-brand">
            <MarcaNome />
          </p>
        </div>
        <h1 className="mt-6 text-4xl">Entrar na casa</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground lg:hidden">
          O mesmo login vale para o salão e para a gestão. O perfil define a tela.
        </p>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Usuário</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              required
            />
          </div>
        </div>
        {erro ? <p className="mt-4 text-sm text-destructive">{erro}</p> : null}
        <Button className="mt-6 w-full" type="submit" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
        <div className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>Acesso da equipe. Para a demonstração:</p>
          <p>
            Carla, gerente
            <span className="mt-1 block font-mono text-xs">
              carla.souza@ardosia.local
              <br />
              senha gerente123
            </span>
          </p>
          <p>
            João, garçom
            <span className="mt-1 block font-mono text-xs">
              joao.ribeiro@ardosia.local
              <br />
              senha garcom123
            </span>
          </p>
        </div>
      </form>
      </section>
    </main>
  );
}
