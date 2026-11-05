import { Injectable } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SistemaService {
  constructor(private readonly prisma: PrismaService) {}

  async painel() {
    const [restaurantes, mesas, comandasAbertas, garcons, gerentes] =
      await Promise.all([
        this.prisma.restaurante.findMany({
          orderBy: { nome: 'asc' },
          select: { id: true, nome: true, corSecundaria: true },
        }),
        this.prisma.mesa.count(),
        this.prisma.comanda.count({ where: { status: 'ABERTA' } }),
        this.prisma.usuario.count({ where: { perfil: Perfil.GARCOM } }),
        this.prisma.usuario.findMany({
          where: { perfil: Perfil.GERENTE },
          select: { id: true, nome: true, email: true },
          orderBy: { nome: 'asc' },
        }),
      ]);

    return {
      restaurantes,
      operacao: { mesas, comandasAbertas, garcons },
      gerentes,
    };
  }
}
