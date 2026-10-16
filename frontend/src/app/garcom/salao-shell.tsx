"use client";

import { useRouter } from "next/navigation";
import { RequireAuth, useAuth } from "@/components/auth-provider";

export function SalaoShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-salao text-salao-ink">
        <BarraDaConta />
        {children}
      </div>
    </RequireAuth>
  );
}

function BarraDaConta() {
  const router = useRouter();
  const { usuario, sair } = useAuth();
  const papel = usuario?.perfil === "GERENTE" ? "Gerente" : "Garçom";

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-salao-line bg-salao/95 px-4 py-3 backdrop-blur">
      <p className="min-w-0 truncate text-sm">
        <span className="font-medium">{usuario?.nome}</span>
        <span className="text-salao-muted"> · {papel}</span>
      </p>
      <button
        type="button"
        className="shrink-0 text-sm font-medium text-brand underline-offset-4 hover:underline"
        onClick={() => {
          sair();
          router.push("/login");
        }}
      >
        Sair
      </button>
    </div>
  );
}
