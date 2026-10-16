"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { categoriaLabel, categorias, reais, tipoLabel } from "@/lib/format";
import type { Categoria, Produto, TipoProduto } from "@/lib/types";
import { Estado } from "@/components/estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const vazio = {
  nome: "",
  descricao: "",
  categoria: "PRATO" as Categoria,
  preco: "",
  tipo: "PREPARADO" as TipoProduto,
  minimo: "5",
  ativo: true,
};

export function CardapioGestao() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState(vazio);
  const [acaoErro, setAcaoErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setProdutos(await api<Produto[]>("/produtos?incluirInativos=true"));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar o cardápio.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirNovo() {
    setEditando(null);
    setForm(vazio);
    setAcaoErro(null);
    setAberto(true);
  }

  function abrirEdicao(produto: Produto) {
    setEditando(produto);
    setForm({
      nome: produto.nome,
      descricao: produto.descricao ?? "",
      categoria: produto.categoria,
      preco: String(produto.preco),
      tipo: produto.tipo,
      minimo: String(produto.estoque?.minimo ?? 5),
      ativo: produto.ativo,
    });
    setAcaoErro(null);
    setAberto(true);
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setAcaoErro(null);
    const corpo = {
      nome: form.nome,
      descricao: form.descricao,
      categoria: form.categoria,
      preco: Number(form.preco),
      tipo: form.tipo,
      minimo: Number(form.minimo),
      ativo: form.ativo,
    };
    try {
      if (editando) {
        await api(`/produtos/${editando.id}`, { method: "PATCH", body: JSON.stringify(corpo) });
      } else {
        await api("/produtos", { method: "POST", body: JSON.stringify(corpo) });
      }
      setAberto(false);
      await carregar();
    } catch (error) {
      setAcaoErro(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(produto: Produto) {
    setAcaoErro(null);
    try {
      await api(`/produtos/${produto.id}`, { method: "DELETE" });
      await carregar();
    } catch (error) {
      setAcaoErro(error instanceof Error ? error.message : "Não foi possível remover o produto.");
    }
  }

  const ativos = produtos.filter((produto) => produto.ativo).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Cardápio</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ativos} produtos cadastrados no cardápio ativo</p>
        </div>
        <Button onClick={abrirNovo}>Novo produto</Button>
      </div>
      {acaoErro && !aberto ? <p className="mt-3 text-sm text-destructive">{acaoErro}</p> : null}
      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <Estado carregando={carregando} erro={erro} onTentar={carregar} vazio={!carregando && !erro && produtos.length === 0} tituloVazio="Cardápio vazio" textoVazio="Cadastre o primeiro produto para o salão começar a lançar pedidos.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell>
                    {produto.nome}
                    {produto.ativo ? null : <Badge className="ml-2" variant="outline">Inativo</Badge>}
                  </TableCell>
                  <TableCell>{categoriaLabel[produto.categoria]}</TableCell>
                  <TableCell className="font-mono">{reais(produto.preco)}</TableCell>
                  <TableCell>{tipoLabel[produto.tipo]}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => abrirEdicao(produto)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => remover(produto)}>Remover</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Estado>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={salvar}>
            <DialogHeader>
              <DialogTitle>{editando ? "Editar produto" : "Novo produto"}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="descricao">Descrição</Label>
                <Input id="descricao" value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(valor) => valor && setForm({ ...form, categoria: valor as Categoria })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categorias.map((item) => (
                        <SelectItem key={item} value={item}>{categoriaLabel[item]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(valor) => valor && setForm({ ...form, tipo: valor as TipoProduto })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREPARADO">Preparado</SelectItem>
                      <SelectItem value="DIRETO">Direto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="preco">Preço</Label>
                  <Input id="preco" type="number" min="0.01" step="0.01" value={form.preco} onChange={(event) => setForm({ ...form, preco: event.target.value })} required />
                </div>
                {form.tipo === "DIRETO" ? (
                  <div className="space-y-1">
                    <Label htmlFor="minimo">Mínimo</Label>
                    <Input id="minimo" type="number" min="0" value={form.minimo} onChange={(event) => setForm({ ...form, minimo: event.target.value })} />
                  </div>
                ) : null}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.checked })} />
                Produto ativo no cardápio
              </label>
            </div>
            {acaoErro ? <p className="mt-3 text-sm text-destructive">{acaoErro}</p> : null}
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
