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
      count: jest.fn(),
    },
    restaurante: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    mesa: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const service = new UsuariosService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.restaurante.findFirst.mockResolvedValue({ id: 'principal' });
    prisma.restaurante.findUnique.mockResolvedValue({
      id: 'principal',
      nome: 'Ardósia',
    });
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
          restauranteId: 'principal',
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

  it('cadastra o gerente com o perfil de gestão', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      id: 'g2',
      nome: 'Rita Alves',
      email: 'rita@ardosia.local',
      perfil: Perfil.GERENTE,
    });

    await service.criarGerente({
      nome: ' Rita Alves ',
      email: 'Rita@Ardosia.local',
      senha: 'senha123',
      restauranteId: 'principal',
    });

    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: 'Rita Alves',
          email: 'rita@ardosia.local',
          perfil: Perfil.GERENTE,
          restauranteId: 'principal',
        }) as unknown,
      }),
    );
  });

  it('cria a casa nova junto com o gerente', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.restaurante.findFirst.mockResolvedValue(null);
    prisma.restaurante.findUnique.mockResolvedValue(null);
    prisma.restaurante.findMany.mockResolvedValue([
      { corSecundaria: '#B08968' },
      { corSecundaria: '#C45C26' },
    ]);
    prisma.$transaction.mockImplementation(async (acao: (tx: typeof prisma) => unknown) =>
      acao(prisma),
    );
    prisma.usuario.create.mockResolvedValue({
      id: 'g3',
      nome: 'Lia Costa',
      email: 'lia@casa.local',
      perfil: Perfil.GERENTE,
    });

    await service.criarGerente({
      nome: 'Lia Costa',
      email: 'lia@casa.local',
      senha: 'senha123',
      restauranteNome: 'Casa Nova',
      mesas: 4,
    });

    expect(prisma.restaurante.create).toHaveBeenCalledWith({
      data: { id: 'casa-nova', nome: 'Casa Nova', corSecundaria: '#2F5D50' },
    });
    expect(prisma.mesa.createMany).toHaveBeenCalledWith({
      data: [
        { numero: 1, restauranteId: 'casa-nova' },
        { numero: 2, restauranteId: 'casa-nova' },
        { numero: 3, restauranteId: 'casa-nova' },
        { numero: 4, restauranteId: 'casa-nova' },
      ],
    });
    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          restauranteId: 'casa-nova',
          perfil: Perfil.GERENTE,
        }) as unknown,
      }),
    );
  });

  it('remove o gerente mesmo quando ele é o único da casa', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'gerente',
      perfil: Perfil.GERENTE,
    });
    prisma.usuario.count.mockResolvedValue(2);
    prisma.usuario.delete.mockResolvedValue({});
    await expect(service.removerGerente('gerente')).resolves.toEqual({ ok: true });
    expect(prisma.usuario.delete).toHaveBeenCalledWith({ where: { id: 'gerente' } });
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
