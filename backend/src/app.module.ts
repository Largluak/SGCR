import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { CasaInterceptor } from './common/casa';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './common/roles.guard';
import { ComandasModule } from './comandas/comandas.module';
import { EstoqueModule } from './estoque/estoque.module';
import { HealthController } from './health.controller';
import { MesasModule } from './mesas/mesas.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutosModule } from './produtos/produtos.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { RestauranteModule } from './restaurante/restaurante.module';
import { SistemaModule } from './sistema/sistema.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MesasModule,
    ComandasModule,
    ProdutosModule,
    EstoqueModule,
    RelatoriosModule,
    RestauranteModule,
    UsuariosModule,
    SistemaModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: CasaInterceptor },
  ],
})
export class AppModule {}
