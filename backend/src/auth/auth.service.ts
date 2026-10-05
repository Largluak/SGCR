import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthUser } from '../common/auth-user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });
    const senhaOk =
      usuario !== null && (await bcrypt.compare(senha, usuario.senhaHash));
    if (!usuario || !senhaOk) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const payload: AuthUser = {
      sub: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    };
  }

  async me(user: AuthUser) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: user.sub },
    });
    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
  }
}
