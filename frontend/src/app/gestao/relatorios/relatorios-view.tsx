"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { reais } from "@/lib/format";
import type { Relatorio } from "@/lib/types";
import { Estado } from "@/components/estado";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function RelatoriosView() {
  const hoje = new Date();
  const [periodo, setPeriodo] = useState("semestral");
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [mes, setMes] = useState(String(hoje.getMonth() + 1));
  const [trimestre, setTrimestre] = useState(String(Math.floor(hoje.getMonth() / 3) + 1));
  const [semestre, setSemestre] = useState(hoje.getMonth() < 6 ? "1" : "2");
  const [dados, setDados] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const params = new URLSearchParams({ periodo, ano });
    if (periodo === "mensal") params.set("mes", mes);
    if (periodo === "trimestral") params.set("trimestre", trimestre);
    if (periodo === "semestral") params.set("semestre", semestre);
    try {
      setDados(await api<Relatorio>(`/relatorios?${params.toString()}`));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao gerar o relatório.");
    } finally {
      setCarregando(false);
    }
  }, [ano, mes, periodo, semestre, trimestre]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const maximo = Math.max(...(dados?.vendasPorMes.map((item) => item.total) ?? [1]), 1);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Relatórios</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {dados ? dados.rotulo : "Vendas de comandas fechadas"}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Select value={periodo} onValueChange={(valor) => valor && setPeriodo(valor)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="trimestral">Trimestral</SelectItem>
            <SelectItem value="semestral">Semestral</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ano} onValueChange={(valor) => valor && setAno(valor)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2027">2027</SelectItem>
          </SelectContent>
        </Select>
        {periodo === "mensal" ? (
          <Select value={mes} onValueChange={(valor) => valor && setMes(valor)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {meses.map((nome, indice) => (
                <SelectItem key={nome} value={String(indice + 1)}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {periodo === "trimestral" ? (
          <Select value={trimestre} onValueChange={(valor) => valor && setTrimestre(valor)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º trimestre</SelectItem>
              <SelectItem value="2">2º trimestre</SelectItem>
              <SelectItem value="3">3º trimestre</SelectItem>
              <SelectItem value="4">4º trimestre</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
        {periodo === "semestral" ? (
          <Select value={semestre} onValueChange={(valor) => valor && setSemestre(valor)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1º semestre</SelectItem>
              <SelectItem value="2">2º semestre</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="mt-6">
        <Estado carregando={carregando} erro={erro} onTentar={carregar} vazio={false}>
          {dados ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle>Total no período</CardTitle></CardHeader>
                  <CardContent className="font-mono text-2xl">{reais(dados.totalVendido)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Comandas fechadas</CardTitle></CardHeader>
                  <CardContent className="font-mono text-2xl">{dados.comandasFechadas}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Produto mais vendido</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-lg font-medium">{dados.produtoMaisVendido?.nome ?? "Sem vendas"}</p>
                    {dados.produtoMaisVendido ? (
                      <p className="text-sm text-muted-foreground">{dados.produtoMaisVendido.quantidade} un · {reais(dados.produtoMaisVendido.total)}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Média mensal</CardTitle></CardHeader>
                  <CardContent className="font-mono text-xl">{reais(dados.mediaMensal)}</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Melhor mês</CardTitle></CardHeader>
                  <CardContent>
                    {dados.melhorMes ? `${dados.melhorMes.rotulo} · ${reais(dados.melhorMes.total)}` : "Sem vendas no período"}
                  </CardContent>
                </Card>
              </div>
              <section className="rounded-xl border bg-card p-4">
                <h2 className="font-medium">Vendas por mês</h2>
                {dados.comandasFechadas === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Nenhuma comanda fechada neste período.</p>
                ) : (
                  <div className="mt-4 flex h-44 items-end gap-3">
                    {dados.vendasPorMes.map((item) => (
                      <div key={item.rotulo} className="flex h-full flex-1 flex-col justify-end gap-2">
                        <div
                          className="rounded-t bg-brand"
                          style={{ height: `${Math.max((item.total / maximo) * 100, item.total > 0 ? 6 : 0)}%` }}
                        />
                        <span className="text-center font-mono text-xs">{item.rotulo}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h2 className="font-medium">Produtos mais vendidos</h2>
                <p className="text-sm text-muted-foreground">Ranking por quantidade no período</p>
                <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dados.ranking.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>Sem produtos vendidos neste período.</TableCell>
                        </TableRow>
                      ) : null}
                      {dados.ranking.map((item, indice) => (
                        <TableRow key={item.nome}>
                          <TableCell>{indice + 1}</TableCell>
                          <TableCell>{item.nome}</TableCell>
                          <TableCell>{item.quantidade}</TableCell>
                          <TableCell className="font-mono">{reais(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>
          ) : null}
        </Estado>
      </div>
    </div>
  );
}
