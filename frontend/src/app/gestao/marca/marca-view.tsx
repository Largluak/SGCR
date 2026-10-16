"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMarca } from "@/components/marca-provider";
import { SeletorCor } from "@/components/seletor-cor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiForm } from "@/lib/api";
import { aplicarCor, normalizarHex } from "@/lib/cor";
import { MARCA_PADRAO, type Marca } from "@/lib/types";

const AMOSTRAS = [
  { cor: "#B08968", nome: "Bronze" },
  { cor: "#1F4E3D", nome: "Verde pinho" },
  { cor: "#8C2F39", nome: "Vinho" },
  { cor: "#1E3A5F", nome: "Marinho" },
  { cor: "#C4A35A", nome: "Dourado" },
  { cor: "#3F3A36", nome: "Carvão" },
];

export function MarcaView() {
  const { marca, fotoSrc, recarregar } = useMarca();
  const [nome, setNome] = useState(marca.nome);
  const [cor, setCor] = useState(marca.corSecundaria);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoFoto, setAvisoFoto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  useEffect(() => {
    setNome(marca.nome);
    setCor(marca.corSecundaria);
  }, [marca.corSecundaria, marca.nome]);

  const corSalva = useRef(marca.corSecundaria);
  corSalva.current = marca.corSecundaria;

  useEffect(() => {
    const valida = normalizarHex(cor);
    if (valida) aplicarCor(valida);
  }, [cor]);

  useEffect(() => {
    return () => aplicarCor(corSalva.current);
  }, []);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    const corSecundaria = normalizarHex(cor);
    if (!corSecundaria) {
      setErro("Use uma cor no formato #RRGGBB.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api<Marca>("/restaurante", {
        method: "PATCH",
        body: JSON.stringify({ nome: nome.trim(), corSecundaria }),
      });
      recarregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a aparência.");
    } finally {
      setSalvando(false);
    }
  }

  async function enviarFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    setEnviandoFoto(true);
    setAvisoFoto(null);
    try {
      const corpo = new FormData();
      corpo.set("foto", arquivo);
      await apiForm<Marca>("/restaurante/foto", corpo);
      recarregar();
    } catch (error) {
      setAvisoFoto(error instanceof Error ? error.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function removerFoto() {
    setEnviandoFoto(true);
    setAvisoFoto(null);
    try {
      await api<Marca>("/restaurante/foto", { method: "DELETE" });
      recarregar();
    } catch (error) {
      setAvisoFoto(error instanceof Error ? error.message : "Não foi possível remover a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Aparência</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        A foto e a cor de destaque seguem a identidade do restaurante. O painel continua claro, o salão continua escuro, e confirmar, cancelar e alerta não mudam.
      </p>

      <section className="mt-6 rounded-xl border bg-card p-4">
        <h2 className="font-medium">Foto do restaurante</h2>
        <div className="mt-4 flex items-center gap-4">
          {fotoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoSrc} alt={marca.nome} className="size-16 rounded-full object-cover" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full border border-dashed text-xs text-muted-foreground">
              Sem foto
            </span>
          )}
          <div className="space-y-2">
            <Label htmlFor="foto" className="sr-only">
              Foto do restaurante
            </Label>
            <Input
              id="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={enviandoFoto}
              onChange={(event) => {
                const arquivo = event.target.files?.[0];
                event.target.value = "";
                void enviarFoto(arquivo);
              }}
            />
            <p className="text-xs text-muted-foreground">JPG, PNG ou WebP, até 2 MB.</p>
            {fotoSrc ? (
              <Button type="button" variant="destructive" size="sm" disabled={enviandoFoto} onClick={() => void removerFoto()}>
                Remover foto
              </Button>
            ) : null}
          </div>
        </div>
        {avisoFoto ? <p className="mt-3 text-sm text-destructive">{avisoFoto}</p> : null}
      </section>

      <form onSubmit={salvar} className="mt-6 space-y-5 rounded-xl border bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="nome-restaurante">Nome do restaurante</Label>
          <Input
            id="nome-restaurante"
            value={nome}
            minLength={2}
            maxLength={80}
            onChange={(event) => setNome(event.target.value)}
            required
          />
        </div>
        <div className="space-y-3">
          <Label>Cor de destaque</Label>
          <SeletorCor valor={normalizarHex(cor) ?? MARCA_PADRAO.corSecundaria} onChange={setCor} />
          <div className="flex flex-wrap gap-2">
            {AMOSTRAS.map((amostra) => (
              <button
                key={amostra.cor}
                type="button"
                title={amostra.nome}
                aria-label={amostra.nome}
                onClick={() => setCor(amostra.cor)}
                className="size-8 rounded-full border border-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                style={{ backgroundColor: amostra.cor }}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Prévia das cores</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex h-8 items-center rounded-lg bg-brand px-3 text-sm text-brand-foreground">Destaque</span>
            <span className="inline-flex h-8 items-center rounded-lg bg-success px-3 text-sm text-success-foreground">Confirmar</span>
            <span className="inline-flex h-8 items-center rounded-lg bg-destructive/10 px-3 text-sm text-destructive">Cancelar</span>
            <span className="inline-flex h-8 items-center rounded-lg border border-warning px-3 text-sm text-warning">Alerta</span>
          </div>
        </div>
        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar aparência"}
        </Button>
      </form>
    </div>
  );
}
