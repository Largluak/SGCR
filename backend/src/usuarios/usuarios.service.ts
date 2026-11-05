import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { casaAtual, filtroCasa } from '../common/casa';
import { COR_PADRAO } from '../restaurante/cor';
import { PrismaService } from '../prisma/prisma.service';
import { CriarGarcomDto } from './dto/criar-garcom.dto';
import { CriarGerenteDto } from './dto/criar-gerente.dto';

const publico = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const usuarios = await this.prisma.usuario.findMany({
      where: { perfil: { not: Perfil.DESENVOLVEDOR }, ...filtroCasa() },
      select: publico,
      orderBy: { nome: 'asc' },
    });
    return usuarios.sort((a, b) => {
      if (a.perfil !== b.perfil) return a.perfil === Perfil.GERENTE ? -1 : 1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }

  async criarGarcom(dto: CriarGarcomDto) {
    const email = dto.email.trim().toLowerCase();
    const existente = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (existente) {
      throw new ConflictException('Já existe um acesso com esse e-mail.');
    }
    const restauranteId = casaAtual() ?? (await this.restauranteDoGarcom());
    return this.prisma.usuario.create({
      select: publico,
      data: {
        nome: dto.nome.trim(),
        email,
        senhaHash: await bcrypt.hash(dto.senha, 10),
        perfil: Perfil.GARCOM,
        restauranteId,
      },
    });
  }

  async criarGerente(dto: CriarGerenteDto) {
    const email = dto.email.trim().toLowerCase();
    const existente = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (existente) {
      throw new ConflictException('Já existe um acesso com esse e-mail.');
    }
    const nomeDaCasa = dto.restauranteNome?.trim();
    if (nomeDaCasa) {
      return this.criarCasaEGerente(dto, email, nomeDaCasa);
    }
    if (!dto.restauranteId) {
      throw new BadRequestException(
        'Escolha um restaurante ou informe o nome da casa nova.',
      );
    }
    const casa = await this.prisma.restaurante.findUnique({
      where: { id: dto.restauranteId },
    });
    if (!casa) {
      throw new NotFoundException('Restaurante não encontrado.');
    }
    return this.prisma.usuario.create({
      select: publico,
      data: {
        nome: dto.nome.trim(),
        email,
        senhaHash: await bcrypt.hash(dto.senha, 10),
        perfil: Perfil.GERENTE,
        restauranteId: casa.id,
      },
    });
  }

  async removerGerente(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Gerente não encontrado.');
    }
    if (usuario.perfil !== Perfil.GERENTE) {
      throw new BadRequestException('Só é possível remover um gerente.');
    }
    this.garantirCasa(usuario.restauranteId, 'Gerente não encontrado.');
    await this.prisma.usuario.delete({ where: { id } });
    return { ok: true };
  }

  async removerGarcom(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Garçom não encontrado.');
    }
    if (usuario.perfil !== Perfil.GARCOM) {
      throw new BadRequestException('Só é possível remover um garçom.');
    }
    this.garantirCasa(usuario.restauranteId, 'Garçom não encontrado.');
    await this.prisma.usuario.delete({ where: { id } });
    return { ok: true };
  }

  private async criarCasaEGerente(
    dto: CriarGerenteDto,
    email: string,
    nomeDaCasa: string,
  ) {
    const repetida = await this.prisma.restaurante.findFirst({
      where: { nome: { equals: nomeDaCasa, mode: 'insensitive' } },
    });
    if (repetida) {
      throw new ConflictException('Já existe um restaurante com esse nome.');
    }
    const id = await this.idLivre(nomeDaCasa);
    const cor = await this.corLivre();
    const mesas = dto.mesas ?? 8;
    const senhaHash = await bcrypt.hash(dto.senha, 10);

    return this.prisma.$transaction(async (tx) => {
      await tx.restaurante.create({
        data: { id, nome: nomeDaCasa, corSecundaria: cor },
      });
      await tx.mesa.createMany({
        data: Array.from({ length: mesas }, (_, indice) => ({
          numero: indice + 1,
          restauranteId: id,
        })),
      });
      return tx.usuario.create({
        select: publico,
        data: {
          nome: dto.nome.trim(),
          email,
          senhaHash,
          perfil: Perfil.GERENTE,
          restauranteId: id,
        },
      });
    });
  }

  private async idLivre(nome: string) {
    const base =
      nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'casa';
    let id = base;
    let sufixo = 2;
    while (await this.prisma.restaurante.findUnique({ where: { id } })) {
      id = `${base}-${sufixo}`;
      sufixo += 1;
    }
    return id;
  }

  private async corLivre() {
    const paleta = ['#C45C26', '#2F5D50', '#3D4C7A', '#8A6A2F', '#6B2E1A', COR_PADRAO];
    const casas = await this.prisma.restaurante.findMany({
      select: { corSecundaria: true },
    });
    const usadas = new Set(casas.map((casa) => casa.corSecundaria.toUpperCase()));
    return paleta.find((cor) => !usadas.has(cor.toUpperCase())) ?? COR_PADRAO;
  }

  private garantirCasa(restauranteId: string | null, mensagem: string) {
    const casa = casaAtual();
    if (casa && restauranteId !== casa) {
      throw new NotFoundException(mensagem);
    }
  }

  private async restauranteDoGarcom() {
    const casa = await this.prisma.restaurante.findFirst({
      orderBy: { nome: 'asc' },
    });
    if (!casa) {
      throw new BadRequestException(
        'Não há restaurante para vincular o garçom.',
      );
    }
    return casa.id;
  }
}
