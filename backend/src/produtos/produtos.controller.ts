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
import { Perfil } from '@prisma/client';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
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
      user.perfil === Perfil.GERENTE && incluirInativos === 'true';
    return this.produtos.listar(incluir);
  }

  @Roles(Perfil.GERENTE)
  @Post()
  criar(@Body() dto: SalvarProdutoDto) {
    return this.produtos.criar(dto);
  }

  @Roles(Perfil.GERENTE)
  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: SalvarProdutoDto) {
    return this.produtos.atualizar(id, dto);
  }

  @Roles(Perfil.GERENTE)
  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.produtos.remover(id);
  }
}
