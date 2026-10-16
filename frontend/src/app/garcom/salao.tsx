"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { haQuantoTempo, numeroMesa, statusMesaLabel, turno } from "@/lib/format";
import type { Mesa } from "@/lib/types";
import { Estado } from "@/components/estado";
import { MarcaLogo, MarcaNome } from "@/components/marca-provider";
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

export function Salao() {
  const router = useRouter();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mesaAbertura, setMesaAbertura] = useState<Mesa | null>(null);
  const [pessoas, setPessoas] = useState("2");
  const [novaMesa, setNovaMesa] = useState(false);
  const [numero, setNumero] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setMesas(await api<Mesa[]>("/mesas"));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao carregar o salão.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ocupadas = mesas.filter((mesa) => mesa.status !== "LIVRE").length;

  async function abrirComanda(event: FormEvent) {
    event.preventDefault();
    if (!mesaAbertura) return;
    setSalvando(true);
    setErroAcao(null);
    try {
      await api("/comandas", {
        method: "POST",
        body: JSON.stringify({
          mesaId: mesaAbertura.id,
          pessoas: Number(pessoas),
        }),
      });
      router.push(`/garcom/mesa/${mesaAbertura.id}`);
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Não foi possível abrir a comanda.");
      setSalvando(false);
    }
  }

  async function adicionarMesa(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErroAcao(null);
    try {
      await api("/mesas", {
        method: "POST",
        body: JSON.stringify({ numero: Number(numero) }),
      });
      setNovaMesa(false);
      setNumero("");
      await carregar();
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Não foi possível incluir a mesa.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <MarcaLogo />
          <div>
            <p className="font-mono text-xs text-brand">
              <MarcaNome /> · Turno {turno()}
            </p>
            <h1 className="text-3xl font-semibold">Salão</h1>
            <p className="mt-1 text-sm text-salao-muted">
              {ocupadas} de {mesas.length} mesas ocupadas
            </p>
          </div>
        </div>
        <Button
          className="bg-brand text-brand-foreground hover:bg-brand/85"
          onClick={() => {
            setErroAcao(null);
            setNumero(String((mesas.at(-1)?.numero ?? 0) + 1));
            setNovaMesa(true);
          }}
        >
          Adicionar mesa
        </Button>
      </header>

      <Estado carregando={carregando} erro={erro} onTentar={carregar} vazio={!carregando && !erro && mesas.length === 0} tituloVazio="Nenhuma mesa no salão" textoVazio="Inclua a primeira mesa para começar o atendimento.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {mesas.map((mesa) => (
            <button
              key={mesa.id}
              type="button"
              onClick={() => {
                if (mesa.comanda) {
                  router.push(`/garcom/mesa/${mesa.id}`);
                  return;
                }
                setErroAcao(null);
                setPessoas("2");
                setMesaAbertura(mesa);
              }}
              className={`min-h-28 rounded-md border p-3 text-left ${
                mesa.status === "LIVRE"
                  ? "border-salao-line bg-salao-card"
                  : mesa.status === "AGUARDANDO_PAGAMENTO"
                    ? "border-warning bg-warning/15"
                    : "border-brand bg-brand/15"
              }`}
            >
              <span className="font-mono text-2xl">{numeroMesa(mesa.numero)}</span>
              <span className="mt-3 block text-sm">
                {mesa.status === "AGUARDANDO_PAGAMENTO" ? "Pagar" : statusMesaLabel[mesa.status]}
              </span>
              {mesa.comanda ? (
                <span className="mt-1 block font-mono text-xs text-salao-muted">
                  {haQuantoTempo(mesa.comanda.abertaEm)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </Estado>

      <Dialog open={mesaAbertura !== null} onOpenChange={(aberto) => !aberto && setMesaAbertura(null)}>
        <DialogContent>
          <form onSubmit={abrirComanda}>
            <DialogHeader>
              <DialogTitle>Abrir mesa {mesaAbertura ? numeroMesa(mesaAbertura.numero) : ""}</DialogTitle>
              <DialogDescription>Informe quantas pessoas estão na mesa.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <Label htmlFor="pessoas">Pessoas</Label>
              <Input id="pessoas" type="number" min={1} value={pessoas} onChange={(event) => setPessoas(event.target.value)} required />
            </div>
            {erroAcao ? <p className="mt-3 text-sm text-destructive">{erroAcao}</p> : null}
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={salvando}>Abrir comanda</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={novaMesa} onOpenChange={setNovaMesa}>
        <DialogContent>
          <form onSubmit={adicionarMesa}>
            <DialogHeader>
              <DialogTitle>Adicionar mesa</DialogTitle>
              <DialogDescription>Use quando o salão precisar de mais um lugar além das mesas já cadastradas.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" type="number" min={1} value={numero} onChange={(event) => setNumero(event.target.value)} required />
            </div>
            {erroAcao ? <p className="mt-3 text-sm text-destructive">{erroAcao}</p> : null}
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={salvando}>Incluir mesa</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
