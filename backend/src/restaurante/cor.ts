const ESCURO = '#1C232B';
const CLARO = '#FFFAF3';

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

export function normalizarHex(valor: string): string | null {
  const limpo = valor.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(limpo)) {
    return `#${limpo
      .split('')
      .map((caractere) => caractere + caractere)
      .join('')
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
