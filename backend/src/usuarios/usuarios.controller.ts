import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { Roles } from '../common/roles.decorator';
import { CriarGarcomDto } from './dto/criar-garcom.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@Roles(Perfil.GERENTE)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar() {
    return this.usuarios.listar();
  }

  @Post()
  criar(@Body() dto: CriarGarcomDto) {
    return this.usuarios.criarGarcom(dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.usuarios.removerGarcom(id);
  }
}
