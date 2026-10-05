"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
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
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <form
        onSubmit={aoEnviar}
        className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm"
      >
        <p className="font-mono text-xs text-accent">Comanda</p>
        <h1 className="mt-2 text-2xl font-semibold">Painel de gestão do restaurante</h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Acesso restrito à equipe. Demonstração: gerente{" "}
          <span className="font-mono">carla.souza@ardosia.local / gerente123</span>
          ; garçom{" "}
          <span className="font-mono">joao.ribeiro@ardosia.local / garcom123</span>.
        </p>
      </form>
    </main>
  );
}
