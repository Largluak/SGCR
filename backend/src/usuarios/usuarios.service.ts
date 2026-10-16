import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CriarGarcomDto } from './dto/criar-garcom.dto';

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
    return this.prisma.usuario.create({
      select: publico,
      data: {
        nome: dto.nome.trim(),
        email,
        senhaHash: await bcrypt.hash(dto.senha, 10),
        perfil: Perfil.GARCOM,
      },
    });
  }

  async removerGarcom(id: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Garçom não encontrado.');
    }
    if (usuario.perfil !== Perfil.GARCOM) {
      throw new BadRequestException('Só é possível remover um garçom.');
    }
    await this.prisma.usuario.delete({ where: { id } });
    return { ok: true };
  }
}
