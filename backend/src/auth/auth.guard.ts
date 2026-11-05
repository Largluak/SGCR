import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from '../common/auth-user';
import { IS_PUBLIC } from '../common/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();
    if (isPublic) {
      await this.anexar(request);
      return true;
    }

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Faça login para continuar.');
    }
    const usuario = await this.anexar(request);
    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
    return true;
  }

  private async anexar(request: {
    headers: { authorization?: string };
    user?: AuthUser;
  }) {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    try {
      request.user = await this.jwt.verifyAsync<AuthUser>(header.slice(7));
      return request.user;
    } catch {
      return null;
    }
  }
}
