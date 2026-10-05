"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { Perfil, Usuario } from "@/lib/types";
import { TOKEN_KEY, USER_KEY } from "@/lib/types";

type AuthContextValue = {
  usuario: Usuario | null;
  pronto: boolean;
  entrar: (token: string, usuario: Usuario) => void;
  sair: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const salvo = window.localStorage.getItem(USER_KEY);
    if (salvo) {
      try {
        setUsuario(JSON.parse(salvo) as Usuario);
      } catch {
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.removeItem(TOKEN_KEY);
      }
    }
    setPronto(true);
  }, []);

  const valor = useMemo<AuthContextValue>(
    () => ({
      usuario,
      pronto,
      entrar: (token, proximo) => {
        window.localStorage.setItem(TOKEN_KEY, token);
        window.localStorage.setItem(USER_KEY, JSON.stringify(proximo));
        setUsuario(proximo);
      },
      sair: () => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setUsuario(null);
      },
    }),
    [usuario, pronto],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }
  return contexto;
}

export function RequireAuth({
  papel,
  children,
}: {
  papel?: Perfil;
  children: React.ReactNode;
}) {
  const { usuario, pronto } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!pronto) return;
    if (!usuario) {
      router.replace("/login");
      return;
    }
    if (papel && usuario.perfil !== papel) {
      router.replace(usuario.perfil === "GERENTE" ? "/gestao" : "/garcom");
    }
  }, [papel, pronto, router, usuario]);

  if (!pronto || !usuario || (papel && usuario.perfil !== papel)) {
    return (
      <p className="p-8 text-sm text-muted-foreground">Conferindo o acesso...</p>
    );
  }

  return children;
}
