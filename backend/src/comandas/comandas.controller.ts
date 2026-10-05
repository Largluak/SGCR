import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ComandasService } from './comandas.service';
import {
  AbrirComandaDto,
  AddItemDto,
  AtualizarItemDto,
  PagarDto,
} from './dto/comanda.dto';

@Controller('comandas')
export class ComandasController {
  constructor(private readonly comandas: ComandasService) {}

  @Get()
  listar() {
    return this.comandas.listar();
  }

  @Post()
  abrir(@Body() dto: AbrirComandaDto) {
    return this.comandas.abrir(dto.mesaId, dto.pessoas);
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.comandas.buscar(id);
  }

  @Post(':id/pedir-conta')
  pedirConta(@Param('id') id: string) {
    return this.comandas.pedirConta(id);
  }

  @Post(':id/itens')
  adicionarItem(@Param('id') id: string, @Body() dto: AddItemDto) {
    return this.comandas.adicionarItem(id, dto.produtoId, dto.quantidade);
  }

  @Patch(':id/itens/:itemId')
  atualizarItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: AtualizarItemDto,
  ) {
    return this.comandas.atualizarQuantidade(id, itemId, dto.quantidade);
  }

  @Post(':id/pagamentos')
  pagar(@Param('id') id: string, @Body() dto: PagarDto) {
    return this.comandas.pagar(id, dto.forma, dto.itemIds, dto.pessoas);
  }
}
