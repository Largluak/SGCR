"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { hexParaHsv, hsvParaHex, normalizarHex, type Hsv } from "@/lib/cor";

const FAIXA_MATIZ =
  "linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)";

function limitar(valor: number, maximo: number) {
  return Math.min(maximo, Math.max(0, valor));
}

export function SeletorCor({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (hex: string) => void;
}) {
  const inicial = normalizarHex(valor) ?? "#B08968";
  const [hsv, setHsv] = useState<Hsv>(() => hexParaHsv(inicial));
  const [texto, setTexto] = useState(inicial);
  const emitido = useRef(inicial);
  const hsvRef = useRef(hsv);
  hsvRef.current = hsv;

  useEffect(() => {
    const valida = normalizarHex(valor);
    if (!valida || valida === emitido.current) return;
    emitido.current = valida;
    setTexto(valida);
    setHsv(hexParaHsv(valida));
  }, [valor]);

  function publicar(proximo: Hsv) {
    const hex = hsvParaHex(proximo.h, proximo.s, proximo.v);
    hsvRef.current = proximo;
    setHsv(proximo);
    setTexto(hex);
    emitido.current = hex;
    onChange(hex);
  }

  function definirSuperficie(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    publicar({
      ...hsvRef.current,
      s: limitar(((event.clientX - rect.left) / rect.width) * 100, 100),
      v: limitar((1 - (event.clientY - rect.top) / rect.height) * 100, 100),
    });
  }

  function definirMatiz(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const h = limitar(((event.clientY - rect.top) / rect.height) * 360, 359.99);
    publicar({ ...hsvRef.current, h });
  }

  function arrastar(aoMover: (event: PointerEvent<HTMLElement>) => void) {
    return {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        aoMover(event);
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        aoMover(event);
      },
    };
  }

  const hex = hsvParaHex(hsv.h, hsv.s, hsv.v);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex gap-3">
          <div
            role="slider"
            aria-label="Saturação e brilho"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(hsv.s)}
            tabIndex={0}
            className="relative h-40 flex-1 cursor-crosshair touch-none rounded-md"
            style={{
              backgroundColor: `hsl(${hsv.h} 100% 50%)`,
              backgroundImage:
                "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
            }}
            onKeyDown={(event) => {
              const passo = event.shiftKey ? 10 : 4;
              const atual = hsvRef.current;
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
              event.preventDefault();
              if (event.key === "ArrowLeft") publicar({ ...atual, s: limitar(atual.s - passo, 100) });
              if (event.key === "ArrowRight") publicar({ ...atual, s: limitar(atual.s + passo, 100) });
              if (event.key === "ArrowUp") publicar({ ...atual, v: limitar(atual.v + passo, 100) });
              if (event.key === "ArrowDown") publicar({ ...atual, v: limitar(atual.v - passo, 100) });
            }}
            {...arrastar(definirSuperficie)}
          >
            <span
              className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
            />
          </div>
          <div
            role="slider"
            aria-label="Matiz"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            tabIndex={0}
            className="relative h-40 w-4 shrink-0 cursor-ns-resize touch-none rounded-md"
            style={{ backgroundImage: FAIXA_MATIZ }}
            onKeyDown={(event) => {
              const passo = event.shiftKey ? 20 : 4;
              const atual = hsvRef.current;
              if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
              event.preventDefault();
              if (event.key === "ArrowUp") publicar({ ...atual, h: limitar(atual.h - passo, 359.99) });
              if (event.key === "ArrowDown") publicar({ ...atual, h: limitar(atual.h + passo, 359.99) });
            }}
            {...arrastar(definirMatiz)}
          >
            <span
              className="pointer-events-none absolute inset-x-[-2px] h-2 -translate-y-1/2 rounded-sm border-2 border-white shadow"
              style={{ top: `${(hsv.h / 360) * 100}%` }}
            />
          </div>
        </div>
        <Input
          value={texto}
          onChange={(event) => {
            const digitado = event.target.value.toUpperCase();
            setTexto(digitado);
            const valida = normalizarHex(digitado);
            if (!valida) return;
            emitido.current = valida;
            setHsv(hexParaHsv(valida));
            onChange(valida);
          }}
          onBlur={() => {
            if (!normalizarHex(texto)) setTexto(hex);
          }}
          className="font-mono uppercase"
          spellCheck={false}
          aria-label="Código da cor"
        />
      </div>
      <div
        className="h-24 w-full rounded-md border sm:h-40 sm:w-36"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
    </div>
  );
}
