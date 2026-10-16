export const COR_PADRAO = '#B08968';

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
