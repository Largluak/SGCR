"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { haQuantoTempo, numeroMesa, reais } from "@/lib/format";
import { acaoMarca, contornoSalao } from "@/lib/salao";
import { cn } from "@/lib/utils";
import type { Comanda, Mesa } from "@/lib/types";
import { Estado } from "@/components/estado";
import { Button, buttonVariants } from "@/components/ui/button";

export function ComandaView() {
  const params = useParams<{ id: string }>();
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [mesaLivre, setMesaLivre] = useState<Mesa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acao, setAcao] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const mesas = await api<Mesa[]>("/mesas");
      const mesa = mesas.find((item) => item.id === params.id);
      if (!mesa) {
        setErro("Mesa não encontrada.");
        setComanda(null);
        return;
      }
      if (!mesa.comanda) {
        setMesaLivre(mesa);
        setComanda(null);
        return;
      }
      setMesaLivre(null);
      setComanda(await api<Comanda>(`/comandas/${mesa.comanda.id}`));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao abrir a comanda.");
    } finally {
      setCarregando(false);
    }
  }, [params.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function alterarQuantidade(itemId: string, quantidade: number) {
    if (!comanda) return;
    setAcao(null);
    try {
      setComanda(
        await api<Comanda>(`/comandas/${comanda.id}/itens/${itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantidade }),
        }),
      );
    } catch (error) {
      setAcao(error instanceof Error ? error.message : "Não foi possível alterar o item.");
    }
  }

  async function pedirConta() {
    if (!comanda) return;
    setAcao(null);
    try {
      setComanda(await api<Comanda>(`/comandas/${comanda.id}/pedir-conta`, { method: "POST" }));
    } catch (error) {
      setAcao(error instanceof Error ? error.message : "Não foi possível pedir a conta.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
      <Link href="/garcom" className="inline-flex min-h-11 items-center font-mono text-sm text-brand">
        Voltar para o salão
      </Link>
      <Estado carregando={carregando} erro={erro} onTentar={carregar} vazio={false}>
        {mesaLivre ? (
          <div className="mt-8">
            <h1 className="text-2xl font-semibold">Mesa {numeroMesa(mesaLivre.numero)} sem comanda aberta.</h1>
            <Link className={cn(buttonVariants(), "mt-6 bg-brand text-brand-foreground")} href="/garcom">
              Voltar para o salão
            </Link>
          </div>
        ) : null}
        {comanda ? (
          <>
            <header className="mt-4">
              <h1 className="text-2xl font-semibold sm:text-3xl">Mesa {numeroMesa(comanda.mesa.numero)}</h1>
              <p className="mt-1 text-sm text-salao-muted">
                {comanda.pessoas} pessoas · aberta há {haQuantoTempo(comanda.abertaEm)}
                {comanda.aguardandoPagamento ? " · aguardando pagamento" : ""}
              </p>
            </header>
            <ul className="mt-6 flex-1 space-y-3">
              {comanda.itens.length === 0 ? (
                <li className="rounded-md border border-dashed border-salao-line p-4 text-sm text-salao-muted">
                  Nenhum item lançado ainda.
                </li>
              ) : null}
              {comanda.itens.map((item) => {
                const pago = item.statusPagamento === "PAGO";
                return (
                  <li key={item.id} className="rounded-md border border-salao-line bg-salao-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium break-words">{item.produto.nome}</p>
                        <p className="font-mono text-xs text-salao-muted">
                          {item.quantidade} x {reais(item.precoUnitario)}
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-sm">{reais(item.total)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`font-mono text-xs ${pago ? "text-success" : "text-salao-muted"}`}>
                        {pago ? "Pago" : "Pendente"}
                      </span>
                      {pago || comanda.status !== "ABERTA" ? null : (
                        <div className="flex items-center gap-2">
                          <Button size="icon-sm" variant="outline" className={contornoSalao} onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}>
                            −
                          </Button>
                          <span className="w-6 text-center font-mono text-sm">{item.quantidade}</span>
                          <Button size="icon-sm" variant="outline" className={contornoSalao} onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}>
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {acao ? <p className="mt-4 text-sm text-danger-soft">{acao}</p> : null}
            <footer className="sticky bottom-0 mt-6 space-y-3 bg-salao py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-salao-muted">Total da comanda</span>
                <span className="shrink-0 font-mono text-xl">{reais(comanda.total)}</span>
              </div>
              {comanda.totalPago > 0 ? (
                <p className="text-right font-mono text-xs text-salao-muted">
                  Pago {reais(comanda.totalPago)} · pendente {reais(comanda.totalPendente)}
                </p>
              ) : null}
              {comanda.status === "ABERTA" ? (
                <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                  <Link className={cn(buttonVariants({ variant: "outline" }), contornoSalao, "w-full min-w-0 justify-center whitespace-normal")} href={`/garcom/mesa/${params.id}/cardapio`}>
                    Adicionar item
                  </Link>
                  <Link className={cn(buttonVariants(), acaoMarca, "w-full min-w-0 justify-center whitespace-normal")} href={`/garcom/mesa/${params.id}/fechamento`}>
                    Fechar comanda
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-salao-muted">Esta comanda já foi fechada.</p>
              )}
              {comanda.status === "ABERTA" && !comanda.aguardandoPagamento ? (
                <Button variant="ghost" className="w-full text-salao-ink" onClick={pedirConta}>
                  Pedir a conta
                </Button>
              ) : null}
            </footer>
          </>
        ) : null}
      </Estado>
    </main>
  );
}
