import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoProduto } from '@prisma/client';
import { fromCents, toCents } from '../common/money';
import { PrismaService } from '../prisma/prisma.service';
import { SalvarProdutoDto } from './dto/produto.dto';

const produtoInclude = { estoque: true } satisfies Prisma.ProdutoInclude;
type ProdutoComEstoque = Prisma.ProdutoGetPayload<{
  include: typeof produtoInclude;
}>;

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(incluirInativos: boolean) {
    const produtos = await this.prisma.produto.findMany({
      where: incluirInativos ? {} : { ativo: true },
      include: produtoInclude,
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    });
    return produtos.map((produto) => this.apresentar(produto));
  }

  async criar(dto: SalvarProdutoDto) {
    const produto = await this.prisma.produto.create({
      data: {
        nome: dto.nome.trim(),
        descricao: dto.descricao?.trim() || null,
        categoria: dto.categoria,
        preco: dto.preco.toFixed(2),
        tipo: dto.tipo,
        ativo: dto.ativo ?? true,
        estoque:
          dto.tipo === TipoProduto.DIRETO
            ? { create: { quantidade: 0, minimo: dto.minimo ?? 5 } }
            : undefined,
      },
      include: produtoInclude,
    });
    return this.apresentar(produto);
  }

  async atualizar(id: string, dto: SalvarProdutoDto) {
    const atual = await this.prisma.produto.findUnique({
      where: { id },
      include: produtoInclude,
    });
    if (!atual) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const produto = await this.prisma.produto.update({
      where: { id },
      data: {
        nome: dto.nome.trim(),
        descricao: dto.descricao?.trim() || null,
        categoria: dto.categoria,
        preco: dto.preco.toFixed(2),
        tipo: dto.tipo,
        ativo: dto.ativo ?? atual.ativo,
      },
      include: produtoInclude,
    });

    if (dto.tipo === TipoProduto.DIRETO && !produto.estoque) {
      await this.prisma.estoque.create({
        data: {
          produtoId: produto.id,
          quantidade: 0,
          minimo: dto.minimo ?? 5,
        },
      });
    }

    const completo = await this.prisma.produto.findUniqueOrThrow({
      where: { id },
      include: produtoInclude,
    });
    return this.apresentar(completo);
  }

  async remover(id: string) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: { _count: { select: { itens: true } } },
    });
    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }
    if (produto._count.itens > 0) {
      await this.prisma.produto.update({
        where: { id },
        data: { ativo: false },
      });
      return { removido: false, desativado: true };
    }
    await this.prisma.produto.delete({ where: { id } });
    return { removido: true, desativado: false };
  }

  private apresentar(produto: ProdutoComEstoque) {
    return {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      categoria: produto.categoria,
      preco: fromCents(toCents(produto.preco)),
      tipo: produto.tipo,
      ativo: produto.ativo,
      estoque: produto.estoque
        ? {
            quantidade: produto.estoque.quantidade,
            minimo: produto.estoque.minimo,
          }
        : null,
    };
  }
}
