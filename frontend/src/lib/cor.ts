const ESCURO = "#1C232B";
const CLARO = "#FFFAF3";

function canal(valor: number) {
  const c = valor / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = canal((n >> 16) & 255);
  const g = canal((n >> 8) & 255);
  const b = canal(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: number, b: number) {
  const claro = Math.max(a, b);
  const escuro = Math.min(a, b);
  return (claro + 0.05) / (escuro + 0.05);
}

export type Hsv = { h: number; s: number; v: number };

export function hexParaHsv(hex: string): Hsv {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : (delta / max) * 100, v: max * 100 };
}

export function hsvParaHex(h: number, s: number, v: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = s / 100;
  const vv = v / 100;
  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const canalHex = (valor: number) =>
    Math.round((valor + m) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${canalHex(r)}${canalHex(g)}${canalHex(b)}`;
}

export function normalizarHex(valor: string): string | null {
  const limpo = valor.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(limpo)) {
    return `#${limpo
      .split("")
      .map((caractere) => caractere + caractere)
      .join("")
      .toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(limpo)) {
    return `#${limpo.toUpperCase()}`;
  }
  return null;
}

export function corDeFrente(hex: string): string {
  const fundo = luminancia(hex);
  const noEscuro = contraste(fundo, luminancia(ESCURO));
  const noClaro = contraste(fundo, luminancia(CLARO));
  return noEscuro >= noClaro ? ESCURO : CLARO;
}

export function aplicarCor(cor: string) {
  const frente = corDeFrente(cor);
  const root = document.documentElement;
  root.style.setProperty("--brand", cor);
  root.style.setProperty("--brand-foreground", frente);
  root.style.setProperty("--accent", cor);
  root.style.setProperty("--accent-foreground", frente);
  root.style.setProperty("--ring", cor);
}
