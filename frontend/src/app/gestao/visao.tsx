"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dataPorExtenso, haQuantoTempo, reais } from "@/lib/format";
import type { Dashboard, Mesa } from "@/lib/types";
import { Estado } from "@/components/estado";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusTexto = {
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  FECHADA: "Fechada",
} as const;

export function VisaoGeral() {
  const [dados, setDados] = useState<Dashboard | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [numero, setNumero] = useState("");
  const [editando, setEditando] = useState<Mesa | null>(null);
  const [novoNumero, setNovoNumero] = useState("");
  const [acaoErro, setAcaoErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [painel, lista] = await Promise.all([
        api<Dashboard>("/dashboard"),
        api<Mesa[]>("/mesas"),
      ]);
      setDados(painel);
      setMesas(lista);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar a visão geral.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function criarMesa(event: FormEvent) {
    event.preventDefault();
    setAcaoErro(null);
    try {
      await api("/mesas", { method: "POST", body: JSON.stringify({ numero: Number(numero) }) });
      setNumero("");
      await carregar();
    } catch (error) {
      setAcaoErro(error instanceof Error ? error.message : "Não foi possível cadastrar a mesa.");
    }
  }

  async function salvarMesa(event: FormEvent) {
    event.preventDefault();
    if (!editando) return;
    setAcaoErro(null);
    try {
      await api(`/mesas/${editando.id}`, {
        method: "PATCH",
        body: JSON.stringify({ numero: Number(novoNumero) }),
      });
      setEditando(null);
      await carregar();
    } catch (error) {
      setAcaoErro(error instanceof Error ? error.message : "Não foi possível editar a mesa.");
    }
  }

  async function removerMesa(mesa: Mesa) {
    setAcaoErro(null);
    try {
      await api(`/mesas/${mesa.id}`, { method: "DELETE" });
      await carregar();
    } catch (error) {
      setAcaoErro(error instanceof Error ? error.message : "Não foi possível remover a mesa.");
    }
  }

  return (
    <Estado carregando={carregando} erro={erro} onTentar={carregar} vazio={false}>
      {dados ? (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold">Visão geral</h1>
            <p className="mt-1 text-sm text-muted-foreground">{dataPorExtenso()}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Vendas do dia</CardTitle></CardHeader>
              <CardContent>
                <p className="font-mono text-2xl">{reais(dados.vendasDoDia)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{dados.comandasDoDia} comandas fechadas ou em aberto</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Mesas ocupadas agora</CardTitle></CardHeader>
              <CardContent>
                <p className="font-mono text-2xl">{dados.mesasOcupadas} / {dados.totalMesas}</p>
                <p className="mt-1 text-sm text-muted-foreground">Atualizado pelo salão</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Itens com estoque baixo</CardTitle></CardHeader>
              <CardContent>
                <p className="font-mono text-2xl">{dados.estoqueBaixo.length}</p>
                <ul className="mt-2 text-sm text-muted-foreground">
                  {dados.estoqueBaixo.length === 0 ? <li>Nenhum item abaixo do mínimo.</li> : null}
                  {dados.estoqueBaixo.map((item) => (
                    <li key={item.produtoId}>{item.nome}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <section>
            <h2 className="text-lg font-semibold">Últimas comandas</h2>
            <p className="text-sm text-muted-foreground">Comandas abertas e recém-fechadas no salão</p>
            <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mesa</TableHead>
                    <TableHead>Aberta há</TableHead>
                    <TableHead>Pessoas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.ultimasComandas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>Nenhuma comanda registrada ainda.</TableCell>
                    </TableRow>
                  ) : null}
                  {dados.ultimasComandas.map((comanda) => (
                    <TableRow key={comanda.id}>
                      <TableCell>Mesa {comanda.mesaNumero}</TableCell>
                      <TableCell>{haQuantoTempo(comanda.abertaEm)}</TableCell>
                      <TableCell>{comanda.pessoas}</TableCell>
                      <TableCell>{statusTexto[comanda.statusOperacional]}</TableCell>
                      <TableCell className="font-mono">{reais(comanda.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Mesas</h2>
            <p className="text-sm text-muted-foreground">Cadastro, edição e remoção ficam com o gerente. O garçom também pode incluir uma mesa nova no salão.</p>
            <form onSubmit={criarMesa} className="mt-3 flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="nova-mesa">Número</Label>
                <Input id="nova-mesa" type="number" min={1} value={numero} onChange={(event) => setNumero(event.target.value)} required className="w-28" />
              </div>
              <Button type="submit">Cadastrar mesa</Button>
            </form>
            {acaoErro ? <p className="mt-2 text-sm text-destructive">{acaoErro}</p> : null}
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {mesas.map((mesa) => (
                <li key={mesa.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                  <span>Mesa {mesa.numero}</span>
                  <span className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditando(mesa); setNovoNumero(String(mesa.numero)); setAcaoErro(null); }}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={() => removerMesa(mesa)}>Remover</Button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      <Dialog open={editando !== null} onOpenChange={(aberto) => !aberto && setEditando(null)}>
        <DialogContent>
          <form onSubmit={salvarMesa}>
            <DialogHeader>
              <DialogTitle>Editar mesa</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <Label htmlFor="editar-numero">Número</Label>
              <Input id="editar-numero" type="number" min={1} value={novoNumero} onChange={(event) => setNovoNumero(event.target.value)} required />
            </div>
            {acaoErro ? <p className="mt-3 text-sm text-destructive">{acaoErro}</p> : null}
            <DialogFooter className="mt-4">
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Estado>
  );
}
