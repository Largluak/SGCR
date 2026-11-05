import { Injectable } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SistemaService {
  constructor(private readonly prisma: PrismaService) {}

  async painel() {
    const [casas, gerentes] = await Promise.all([
      this.prisma.restaurante.findMany({
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true, corSecundaria: true },
      }),
      this.prisma.usuario.findMany({
        where: { perfil: Perfil.GERENTE },
        select: {
          id: true,
          nome: true,
          email: true,
          restaurante: { select: { id: true, nome: true } },
        },
        orderBy: { nome: 'asc' },
      }),
    ]);

    const restaurantes = await Promise.all(
      casas.map(async (casa) => ({
        ...casa,
        mesas: await this.prisma.mesa.count({
          where: { restauranteId: casa.id },
        }),
        comandasAbertas: await this.prisma.comanda.count({
          where: { status: 'ABERTA', mesa: { restauranteId: casa.id } },
        }),
        garcons: await this.prisma.usuario.count({
          where: { perfil: Perfil.GARCOM, restauranteId: casa.id },
        }),
      })),
    );

    return { restaurantes, gerentes };
  }
}
