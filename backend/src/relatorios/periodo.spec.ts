import { intervaloDoPeriodo, mesesDoIntervalo } from './periodo';

describe('intervaloDoPeriodo', () => {
  const agora = new Date(2026, 9, 5, 15, 0, 0);

  it('delimita o mês pedido', () => {
    const intervalo = intervaloDoPeriodo(
      { periodo: 'mensal', ano: 2026, mes: 8 },
      agora,
    );
    expect(intervalo.inicio).toEqual(new Date(2026, 7, 1));
    expect(intervalo.fim).toEqual(new Date(2026, 8, 1));
    expect(intervalo.rotulo).toBe('agosto de 2026');
  });

  it('delimita o trimestre', () => {
    const intervalo = intervaloDoPeriodo(
      { periodo: 'trimestral', ano: 2026, trimestre: 4 },
      agora,
    );
    expect(intervalo.inicio).toEqual(new Date(2026, 9, 1));
    expect(intervalo.fim).toEqual(new Date(2027, 0, 1));
    expect(mesesDoIntervalo(intervalo.inicio, intervalo.fim)).toHaveLength(3);
  });

  it('delimita o semestre', () => {
    const intervalo = intervaloDoPeriodo(
      { periodo: 'semestral', ano: 2026, semestre: 2 },
      agora,
    );
    expect(intervalo.inicio).toEqual(new Date(2026, 6, 1));
    expect(intervalo.fim).toEqual(new Date(2027, 0, 1));
    expect(mesesDoIntervalo(intervalo.inicio, intervalo.fim)).toHaveLength(6);
  });
});
