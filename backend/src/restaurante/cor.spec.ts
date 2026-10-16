import { normalizarHex } from './cor';

describe('cor da marca', () => {
  it('normaliza hex curto e recusa valor inválido', () => {
    expect(normalizarHex('#abc')).toBe('#AABBCC');
    expect(normalizarHex('b08968')).toBe('#B08968');
    expect(normalizarHex('vermelho')).toBeNull();
  });
});
