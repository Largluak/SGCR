import { BadRequestException } from '@nestjs/common';

export type PeriodoRelatorio = 'mensal' | 'trimestral' | 'semestral';

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export type Intervalo = {
  inicio: Date;
  fim: Date;
  rotulo: string;
};

export function intervaloDoPeriodo(
  input: {
    periodo: PeriodoRelatorio;
    ano?: number;
    mes?: number;
    trimestre?: number;
    semestre?: number;
  },
  agora = new Date(),
): Intervalo {
  const ano = input.ano ?? agora.getFullYear();
  if (input.periodo === 'mensal') {
    const mes = input.mes ?? agora.getMonth() + 1;
    if (mes < 1 || mes > 12) {
      throw new BadRequestException('Mês inválido.');
    }
    return {
      inicio: new Date(ano, mes - 1, 1),
      fim: new Date(ano, mes, 1),
      rotulo: `${MESES[mes - 1]} de ${ano}`,
    };
  }
  if (input.periodo === 'trimestral') {
    const trimestre = input.trimestre ?? Math.floor(agora.getMonth() / 3) + 1;
    if (trimestre < 1 || trimestre > 4) {
      throw new BadRequestException('Trimestre inválido.');
    }
    const inicioMes = (trimestre - 1) * 3;
    return {
      inicio: new Date(ano, inicioMes, 1),
      fim: new Date(ano, inicioMes + 3, 1),
      rotulo: `${trimestre}º trimestre de ${ano}`,
    };
  }
  const semestre = input.semestre ?? (agora.getMonth() < 6 ? 1 : 2);
  if (semestre !== 1 && semestre !== 2) {
    throw new BadRequestException('Semestre inválido.');
  }
  const inicioMes = semestre === 1 ? 0 : 6;
  return {
    inicio: new Date(ano, inicioMes, 1),
    fim: new Date(ano, inicioMes + 6, 1),
    rotulo: `${semestre}º semestre de ${ano}`,
  };
}

export function mesesDoIntervalo(inicio: Date, fim: Date) {
  const meses: Date[] = [];
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  while (cursor < fim) {
    meses.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return meses;
}
