"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { EstoqueItem } from "@/lib/types";
import { Estado } from "@/components/estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EstoqueView() {
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [item, setItem] = useState<EstoqueItem | null>(null);
  const [entrada, setEntrada] = useState("");
  const [contagem, setContagem] = useState("");
  const [minimo, setMinimo] = useState("");
  const [acaoErro, setAcaoErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setItens(await api<EstoqueItem[]>("/estoque"));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar o estoque.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrir(atual: EstoqueItem) {
    setItem(atual);
    setEntrada("");
    setContagem("");
    setMinimo(String(atual.minimo));
    setAcaoErro(null);
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!item) return;
    setSalvando(true);
    setAcaoErro(null);
    try {
      let quantidade = item.quantidade;
      if (contagem !== "") {
        quantidade = Number(contagem);
        await api(`/estoque/${item.produtoId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantidade, minimo: Number(minimo) }),
        });
      } else if (Number(minimo) !== item.minimo) {
        await api(`/estoque/${item.produtoId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantidade: item.quantidade, minimo: Number(minimo) }),
        });
      }
      if (entrada !== "" && Number(entrada) > 0) {
        await api("/estoque/entradas", {
          method: "POST",
          body: JSON.stringify({
            produtoId: item.produtoId,
            quantidade: Number(entrada),
            motivo: "Entrada manual",
          }),
        });
      }
      setItem(null);
      await carregar();
    } catch (error) {
      setAcaoErro(error instanceof Error ? error.message : "Não foi possível ajustar o estoque.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 className="text-4xl sm:text-5xl">Estoque</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Produtos diretos (bebidas) com baixa automática ao lançar na comanda. Pratos preparados não aparecem aqui, pois não há baixa por ficha técnica neste projeto.
      </p>
      <div className="mt-6">
        <Estado carregando={carregando} erro={erro} onTentar={carregar} vazio={!carregando && !erro && itens.length === 0} tituloVazio="Nenhum produto direto" textoVazio="Cadastre uma bebida como produto direto para controlar o estoque.">
          <ul className="grid gap-3">
            {itens.map((atual) => (
              <li key={atual.produtoId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
                <div>
                  <p className="font-medium">{atual.nome}</p>
                  <p className="text-sm text-muted-foreground">mínimo: {atual.minimo} un</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {atual.baixo ? <Badge variant="destructive">Estoque baixo</Badge> : null}
                  <span className="font-mono text-lg">{atual.quantidade} un</span>
                  <Button variant="outline" onClick={() => abrir(atual)}>Ajustar</Button>
                </div>
              </li>
            ))}
          </ul>
        </Estado>
      </div>

      <Dialog open={item !== null} onOpenChange={(aberto) => !aberto && setItem(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={salvar}>
            <DialogHeader>
              <DialogTitle>Ajustar {item?.nome}</DialogTitle>
              <DialogDescription>
                A entrada soma unidades recebidas. A quantidade contada substitui o saldo antes dessa entrada.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="entrada">Unidades recebidas</Label>
                <Input id="entrada" type="number" min="1" value={entrada} onChange={(event) => setEntrada(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contagem">Quantidade contada</Label>
                <Input id="contagem" type="number" min="0" value={contagem} onChange={(event) => setContagem(event.target.value)} placeholder={item ? String(item.quantidade) : ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="minimo-estoque">Estoque mínimo</Label>
                <Input id="minimo-estoque" type="number" min="0" value={minimo} onChange={(event) => setMinimo(event.target.value)} required />
              </div>
            </div>
            {acaoErro ? <p className="mt-3 text-sm text-destructive">{acaoErro}</p> : null}
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
