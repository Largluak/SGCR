import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { Roles } from '../common/roles.decorator';
import { AtualizarMesaDto, CriarMesaDto } from './dto/mesa.dto';
import { MesasService } from './mesas.service';

@Controller('mesas')
export class MesasController {
  constructor(private readonly mesas: MesasService) {}

  @Get()
  listar() {
    return this.mesas.listar();
  }

  @Post()
  criar(@Body() dto: CriarMesaDto) {
    return this.mesas.criar(dto.numero);
  }

  @Roles(Perfil.GERENTE)
  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarMesaDto) {
    return this.mesas.atualizar(id, dto.numero);
  }

  @Roles(Perfil.GERENTE)
  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.mesas.remover(id);
  }
}
