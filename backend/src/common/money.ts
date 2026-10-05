export function toCents(
  value: { toString(): string } | number | string,
): number {
  const text = typeof value === 'number' ? value.toFixed(2) : value.toString();
  const negative = text.trim().startsWith('-');
  const [inteiro, frac = ''] = text.replace('-', '').split('.');
  const cents = Number(inteiro) * 100 + Number((frac + '00').slice(0, 2));
  return negative ? -cents : cents;
}

export function fromCents(cents: number): number {
  return cents / 100;
}
