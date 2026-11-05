import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { Roles } from '../common/roles.decorator';
import { CriarGerenteDto } from '../usuarios/dto/criar-gerente.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { SistemaService } from './sistema.service';

@Controller('sistema')
@Roles(Perfil.DESENVOLVEDOR)
export class SistemaController {
  constructor(
    private readonly sistema: SistemaService,
    private readonly usuarios: UsuariosService,
  ) {}

  @Get()
  painel() {
    return this.sistema.painel();
  }

  @Post('gerentes')
  criarGerente(@Body() dto: CriarGerenteDto) {
    return this.usuarios.criarGerente(dto);
  }

  @Delete('gerentes/:id')
  removerGerente(@Param('id') id: string) {
    return this.usuarios.removerGerente(id);
  }
}
