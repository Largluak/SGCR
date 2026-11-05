import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { PAPEIS_GESTAO, ehGestao } from '../common/perfis';
import { Roles } from '../common/roles.decorator';
import { SalvarProdutoDto } from './dto/produto.dto';
import { ProdutosService } from './produtos.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtos: ProdutosService) {}

  @Get()
  listar(
    @CurrentUser() user: AuthUser,
    @Query('incluirInativos') incluirInativos?: string,
  ) {
    const incluir =
      ehGestao(user.perfil) && incluirInativos === 'true';
    return this.produtos.listar(incluir);
  }

  @Roles(...PAPEIS_GESTAO)
  @Post()
  criar(@Body() dto: SalvarProdutoDto) {
    return this.produtos.criar(dto);
  }

  @Roles(...PAPEIS_GESTAO)
  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: SalvarProdutoDto) {
    return this.produtos.atualizar(id, dto);
  }

  @Roles(...PAPEIS_GESTAO)
  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.produtos.remover(id);
  }
}
