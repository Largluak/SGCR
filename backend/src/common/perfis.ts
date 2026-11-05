import { Perfil } from '@prisma/client';

export const PAPEIS_GESTAO = [Perfil.GERENTE, Perfil.DESENVOLVEDOR] as const;

export function ehGestao(perfil: Perfil) {
  return perfil === Perfil.GERENTE || perfil === Perfil.DESENVOLVEDOR;
}
