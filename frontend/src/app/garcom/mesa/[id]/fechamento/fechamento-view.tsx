"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { categoriaLabel, formaLabel, numeroMesa, porPessoa, reais } from "@/lib/format";
import type { Comanda, FormaPagamento, Mesa } from "@/lib/types";
import { Estado } from "@/components/estado";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formas: FormaPagamento[] = ["DINHEIRO", "CARTAO", "PIX"];

export function FechamentoView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [modo, setModo] = useState("inteira");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [pessoas, setPessoas] = useState(2);
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const mesas = await api<Mesa[]>("/mesas");
      const mesa = mesas.find((item) => item.id === params.id);
      if (!mesa?.comanda) {
        setErro("Esta mesa não tem comanda aberta.");
        return;
      }
      const dados = await api<Comanda>(`/comandas/${mesa.comanda.id}`);
      setComanda(dados);
      setPessoas(dados.pessoas);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar o fechamento.");
    } finally {
      setCarregando(false);
    }
  }, [params.id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const pendentes = useMemo(
    () => comanda?.itens.filter((item) => item.statusPagamento === "PENDENTE") ?? [],
    [comanda],
  );
  const itens = modo === "inteira" ? pendentes : pendentes.filter((item) => selecionados.includes(item.id));
  const total = itens.reduce((soma, item) => soma + item.total, 0);
  const resumo = itens.reduce<Record<string, number>>((mapa, item) => {
    const nome = categoriaLabel[item.produto.categoria];
    mapa[nome] = (mapa[nome] ?? 0) + item.total;
    return mapa;
  }, {});

  function alternar(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  async function confirmar() {
    if (!comanda) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await api<{ fechada: boolean }>(`/comandas/${comanda.id}/pagamentos`, {
        method: "POST",
        body: JSON.stringify({
          forma,
          pessoas,
          itemIds: modo === "parte" ? selecionados : undefined,
        }),
      });
      router.push(resposta.fechada ? "/garcom" : `/garcom/mesa/${params.id}`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível registrar o pagamento.");
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <Link href={`/garcom/mesa/${params.id}`} className="font-mono text-xs text-[#b08968]">
        Voltar para a comanda
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">
        Fechar mesa {comanda ? numeroMesa(comanda.mesa.numero) : ""}
      </h1>
      <Estado carregando={carregando} erro={erro && !comanda ? erro : null} onTentar={carregar} vazio={!carregando && !erro && pendentes.length === 0} tituloVazio="Nada pendente" textoVazio="Todos os itens desta comanda já foram pagos.">
        <Tabs value={modo} onValueChange={setModo} className="mt-6">
          <TabsList className="bg-[#232a32]">
            <TabsTrigger value="inteira" className="text-[#ede9df] data-active:bg-[#b08968] data-active:text-[#1c232b]">Conta inteira</TabsTrigger>
            <TabsTrigger value="parte" className="text-[#ede9df] data-active:bg-[#b08968] data-active:text-[#1c232b]">Pagar parte</TabsTrigger>
          </TabsList>
        </Tabs>

        {modo === "parte" ? (
          <ul className="mt-4 space-y-2">
            {pendentes.map((item) => (
              <li key={item.id}>
                <label className="flex items-center gap-3 rounded-md border border-[#3a4450] bg-[#232a32] p-3">
                  <input
                    type="checkbox"
                    checked={selecionados.includes(item.id)}
                    onChange={() => alternar(item.id)}
                  />
                  <span className="flex-1">
                    {item.quantidade}× {item.produto.nome}
                  </span>
                  <span className="font-mono text-sm">{reais(item.total)}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : null}

        <section className="mt-6 space-y-2">
          <h2 className="text-sm text-[#9aa4ae]">Resumo por categoria</h2>
          {Object.entries(resumo).map(([nome, valor]) => (
            <div key={nome} className="flex justify-between text-sm">
              <span>{nome}</span>
              <span className="font-mono">{reais(valor)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-[#3a4450] pt-3 text-lg">
            <span>Total geral</span>
            <span className="font-mono">{reais(total)}</span>
          </div>
        </section>

        <div className="mt-6 space-y-2">
          <Label htmlFor="dividir" className="text-[#ede9df]">Dividir entre</Label>
          <div className="flex items-center gap-3">
            <Input id="dividir" className="w-24 border-[#3a4450] bg-[#232a32] text-[#ede9df]" type="number" min={1} value={pessoas} onChange={(event) => setPessoas(Number(event.target.value) || 1)} />
            <span className="text-sm text-[#9aa4ae]">pessoas · {reais(porPessoa(total, pessoas))} por pessoa</span>
          </div>
          <p className="text-xs text-[#9aa4ae]">A divisão é só para mostrar o valor. O pagamento continua em um único registro.</p>
        </div>

        <div className="mt-6">
          <p className="text-sm text-[#9aa4ae]">Forma de pagamento</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {formas.map((item) => (
              <Button
                key={item}
                type="button"
                variant="outline"
                className={forma === item ? "border-[#b08968] bg-[#b08968] text-[#1c232b]" : "border-[#3a4450] bg-transparent text-[#ede9df]"}
                onClick={() => setForma(item)}
              >
                {formaLabel[item]}
              </Button>
            ))}
          </div>
        </div>
        {erro && comanda ? <p className="mt-4 text-sm text-[#e7b2a8]">{erro}</p> : null}
        <Button className="mt-6 w-full bg-[#b08968] text-[#1c232b] hover:bg-[#c4a080]" disabled={enviando || itens.length === 0} onClick={confirmar}>
          {enviando ? "Registrando..." : "Confirmar fechamento"}
        </Button>
      </Estado>
    </main>
  );
}
