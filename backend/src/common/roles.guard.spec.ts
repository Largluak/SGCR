import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function contexto(perfil?: Perfil): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: perfil ? { perfil } : undefined }),
    }),
  } as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  it('libera a rota quando nenhum perfil é exigido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contexto(Perfil.GARCOM))).toBe(true);
  });

  it('impede o garçom de acessar função de gerente', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Perfil.GERENTE]);
    expect(() => guard.canActivate(contexto(Perfil.GARCOM))).toThrow(
      ForbiddenException,
    );
  });

  it('permite o gerente', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Perfil.GERENTE]);
    expect(guard.canActivate(contexto(Perfil.GERENTE))).toBe(true);
  });
});
