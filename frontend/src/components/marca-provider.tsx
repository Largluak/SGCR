"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, urlDaApi } from "@/lib/api";
import { aplicarCor } from "@/lib/cor";
import { iniciais } from "@/lib/format";
import { MARCA_PADRAO, type Marca } from "@/lib/types";
import { cn } from "@/lib/utils";

type MarcaContexto = {
  marca: Marca;
  fotoSrc: string | null;
  recarregar: () => void;
};

const Contexto = createContext<MarcaContexto>({
  marca: MARCA_PADRAO,
  fotoSrc: null,
  recarregar: () => undefined,
});

export function MarcaProvider({ children }: { children: React.ReactNode }) {
  const [marca, setMarca] = useState<Marca>(MARCA_PADRAO);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    api<Marca>("/restaurante")
      .then((dados) => {
        if (ativo) setMarca(dados);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [versao]);

  useEffect(() => {
    aplicarCor(marca.corSecundaria);
  }, [marca.corSecundaria]);

  const fotoSrc = useMemo(() => {
    if (!marca.fotoUrl) return null;
    const versaoFoto = encodeURIComponent(marca.atualizadoEm);
    return `${urlDaApi(marca.fotoUrl)}?v=${versaoFoto}`;
  }, [marca.atualizadoEm, marca.fotoUrl]);

  const valor = useMemo(
    () => ({
      marca,
      fotoSrc,
      recarregar: () => setVersao((atual) => atual + 1),
    }),
    [fotoSrc, marca],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useMarca() {
  return useContext(Contexto);
}

export function MarcaLogo({
  className,
  tamanho = "size-10",
}: {
  className?: string;
  tamanho?: string;
}) {
  const { marca, fotoSrc } = useMarca();
  if (fotoSrc) {
    return (
      // A foto é servida pela API, cujo endereço muda entre o computador e o celular.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoSrc}
        alt={marca.nome}
        className={cn("shrink-0 rounded-full object-cover", tamanho, className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs text-brand-foreground",
        tamanho,
        className,
      )}
    >
      {iniciais(marca.nome)}
    </span>
  );
}

export function MarcaNome({ className }: { className?: string }) {
  const { marca } = useMarca();
  return <span className={className}>{marca.nome}</span>;
}

export function MarcaSelo() {
  const { marca } = useMarca();
  return (
    <span className="mx-auto mb-6 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-brand px-3 py-1 text-center font-mono text-xs break-words text-brand">
      <MarcaLogo tamanho="size-5" />
      {marca.nome}
    </span>
  );
}
