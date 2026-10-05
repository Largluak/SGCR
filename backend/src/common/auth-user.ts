import { Perfil } from '@prisma/client';

export type AuthUser = {
  sub: string;
  nome: string;
  email: string;
  perfil: Perfil;
};
