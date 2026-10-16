import { corDeFrente, normalizarHex } from './cor';

describe('cor da marca', () => {
  it('normaliza hex curto e recusa valor inválido', () => {
    expect(normalizarHex('#abc')).toBe('#AABBCC');
    expect(normalizarHex('b08968')).toBe('#B08968');
    expect(normalizarHex('vermelho')).toBeNull();
  });

  it('escolhe texto escuro no bronze e texto claro no marinho', () => {
    expect(corDeFrente('#B08968')).toBe('#1C232B');
    expect(corDeFrente('#1E3A5F')).toBe('#FFFAF3');
  });
});
