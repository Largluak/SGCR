import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SistemaController } from './sistema.controller';
import { SistemaService } from './sistema.service';

@Module({
  imports: [UsuariosModule],
  controllers: [SistemaController],
  providers: [SistemaService],
})
export class SistemaModule {}
