import { AsyncLocalStorage } from 'async_hooks';
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { Observable } from 'rxjs';
import { AuthUser } from './auth-user';
import { PrismaService } from '../prisma/prisma.service';

const storage = new AsyncLocalStorage<string>();

export function casaAtual() {
  return storage.getStore();
}

export function filtroCasa() {
  const restauranteId = casaAtual();
  return restauranteId ? { restauranteId } : {};
}

export function filtroPelaMesa() {
  const restauranteId = casaAtual();
  return restauranteId ? { mesa: { restauranteId } } : {};
}

@Injectable()
export class CasaInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthUser;
      headers: { 'x-casa'?: string | string[] };
    }>();
    if (!request.user) return next.handle();
    const header = request.headers['x-casa'];
    const escolhida = Array.isArray(header) ? header[0] : header;

    return new Observable((subscriber) => {
      void this.resolver(request.user as AuthUser, escolhida)
        .then((id) => {
          storage.run(id, () => {
            next.handle().subscribe(subscriber);
          });
        })
        .catch((error: unknown) => subscriber.error(error));
    });
  }

  private async resolver(user: AuthUser, escolhida?: string) {
    if (user.perfil === Perfil.DESENVOLVEDOR) {
      const id = escolhida?.trim() || 'principal';
      const casa = await this.prisma.restaurante.findUnique({ where: { id } });
      if (!casa) throw new NotFoundException('Restaurante não encontrado.');
      return casa.id;
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: user.sub },
      select: { restauranteId: true },
    });
    if (!usuario?.restauranteId) {
      throw new ForbiddenException('Sua conta não está ligada a um restaurante.');
    }
    return usuario.restauranteId;
  }
}
