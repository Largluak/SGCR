import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PAPEIS_GESTAO } from '../common/perfis';
import { Roles } from '../common/roles.decorator';
import { AjusteEstoqueDto, EntradaEstoqueDto } from './dto/estoque.dto';
import { EstoqueService } from './estoque.service';

@Roles(...PAPEIS_GESTAO)
@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoque: EstoqueService) {}

  @Get()
  listar() {
    return this.estoque.listar();
  }

  @Post('entradas')
  entrada(@Body() dto: EntradaEstoqueDto) {
    return this.estoque.entrada(dto.produtoId, dto.quantidade, dto.motivo);
  }

  @Patch(':produtoId')
  ajustar(
    @Param('produtoId') produtoId: string,
    @Body() dto: AjusteEstoqueDto,
  ) {
    return this.estoque.ajustar(produtoId, dto.quantidade, dto.minimo);
  }
}
