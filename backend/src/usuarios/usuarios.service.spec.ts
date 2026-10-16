import { BadRequestException, ConflictException } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  const prisma = {
    usuario: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new UsuariosService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cadastra o novo acesso sempre como garçom', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      id: 'g1',
      nome: 'Ana Lima',
      email: 'ana@ardosia.local',
      perfil: Perfil.GARCOM,
    });

    await service.criarGarcom({
      nome: ' Ana Lima ',
      email: 'Ana@Ardosia.local',
      senha: 'senha123',
    });

    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: 'Ana Lima',
          email: 'ana@ardosia.local',
          perfil: Perfil.GARCOM,
        }) as unknown,
      }),
    );
  });

  it('recusa e-mail que já está em uso', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: 'existente' });
    await expect(
      service.criarGarcom({
        nome: 'Ana Lima',
        email: 'ana@ardosia.local',
        senha: 'senha123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('recusa remover o gerente', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'gerente',
      perfil: Perfil.GERENTE,
    });
    await expect(service.removerGarcom('gerente')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.usuario.delete).not.toHaveBeenCalled();
  });
});
