"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { categoriaLabel, categorias, numeroMesa, reais } from "@/lib/format";
import type { Categoria, Mesa, Produto } from "@/lib/types";
import { Estado } from "@/components/estado";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CardapioView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoria, setCategoria] = useState<Categoria>("ENTRADA");
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [mesas, lista] = await Promise.all([
        api<Mesa[]>("/mesas"),
        api<Produto[]>("/produtos"),
      ]);
      const encontrada = mesas.find((item) => item.id === params.id) ?? null;
      if (!encontrada?.comanda) {
        setErro("Abra a comanda da mesa antes de lançar itens.");
      }
      setMesa(encontrada);
      setProdutos(lista);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar o cardápio.");
    } finally {
      setCarregando(false);
    }
  }, [params.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const visiveis = produtos.filter((produto) => produto.categoria === categoria);
  const selecionados = Object.values(quantidades).reduce((soma, valor) => soma + valor, 0);

  function alterar(produto: Produto, delta: number) {
    setQuantidades((atual) => {
      const proxima = Math.max(0, (atual[produto.id] ?? 0) + delta);
      if (produto.tipo === "DIRETO" && produto.estoque && proxima > produto.estoque.quantidade) {
        return atual;
      }
      return { ...atual, [produto.id]: proxima };
    });
  }

  async function lancar() {
    if (!mesa?.comanda) return;
    setEnviando(true);
    setErro(null);
    try {
      for (const [produtoId, quantidade] of Object.entries(quantidades)) {
        if (quantidade < 1) continue;
        await api(`/comandas/${mesa.comanda.id}/itens`, {
          method: "POST",
          body: JSON.stringify({ produtoId, quantidade }),
        });
      }
      router.push(`/garcom/mesa/${mesa.id}`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível lançar o item.");
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 pb-28">
      <Link href={`/garcom/mesa/${params.id}`} className="font-mono text-xs text-[#b08968]">
        Voltar para a comanda
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Cardápio</h1>
      <p className="text-sm text-[#9aa4ae]">Mesa {mesa ? numeroMesa(mesa.numero) : ""}</p>
      <Estado carregando={carregando} erro={erro && !mesa ? erro : null} onTentar={carregar} vazio={false}>
        <Tabs value={categoria} onValueChange={(valor) => setCategoria(valor as Categoria)} className="mt-6">
          <TabsList className="w-full bg-[#232a32]">
            {categorias.map((item) => (
              <TabsTrigger key={item} value={item} className="text-[#ede9df] data-active:bg-[#b08968] data-active:text-[#1c232b]">
                {categoriaLabel[item]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ul className="mt-4 space-y-3">
          {visiveis.map((produto) => {
            const semEstoque = produto.tipo === "DIRETO" && (produto.estoque?.quantidade ?? 0) === 0;
            return (
              <li key={produto.id} className="rounded-md border border-[#3a4450] bg-[#232a32] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{produto.nome}</p>
                    {produto.descricao ? (
                      <p className="text-sm text-[#9aa4ae]">{produto.descricao}</p>
                    ) : null}
                    <p className="mt-1 font-mono text-sm text-[#b08968]">{reais(produto.preco)}</p>
                    {produto.tipo === "DIRETO" ? (
                      <p className="font-mono text-xs text-[#9aa4ae]">
                        {semEstoque ? "Sem estoque" : `${produto.estoque?.quantidade ?? 0} un`}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon-sm" variant="outline" className="border-[#3a4450] bg-transparent text-[#ede9df]" onClick={() => alterar(produto, -1)} disabled={!quantidades[produto.id]}>
                      −
                    </Button>
                    <span className="w-6 text-center font-mono">{quantidades[produto.id] ?? 0}</span>
                    <Button size="icon-sm" variant="outline" className="border-[#3a4450] bg-transparent text-[#ede9df]" onClick={() => alterar(produto, 1)} disabled={semEstoque}>
                      +
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {erro && mesa ? <p className="mt-4 text-sm text-[#e7b2a8]">{erro}</p> : null}
      </Estado>
      <div className="fixed inset-x-0 bottom-0 bg-[#1c232b] p-4">
        <Button className="mx-auto flex w-full max-w-lg bg-[#b08968] text-[#1c232b] hover:bg-[#c4a080]" disabled={selecionados === 0 || enviando || !mesa?.comanda} onClick={lancar}>
          {enviando ? "Lançando..." : `Lançar na comanda${selecionados ? ` (${selecionados})` : ""}`}
        </Button>
      </div>
    </main>
  );
}
