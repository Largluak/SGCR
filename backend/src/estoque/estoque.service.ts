import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TipoMovimentacao, TipoProduto } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EstoqueService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const itens = await this.prisma.estoque.findMany({
      where: { produto: { tipo: TipoProduto.DIRETO, ativo: true } },
      include: { produto: true },
      orderBy: { produto: { nome: 'asc' } },
    });
    return itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.produto.nome,
      categoria: item.produto.categoria,
      quantidade: item.quantidade,
      minimo: item.minimo,
      baixo: item.quantidade <= item.minimo,
    }));
  }

  async entrada(produtoId: string, quantidade: number, motivo?: string) {
    const estoque = await this.estoqueDireto(produtoId);
    const atualizado = await this.prisma.estoque.update({
      where: { id: estoque.id },
      data: { quantidade: { increment: quantidade } },
      include: { produto: true },
    });
    await this.prisma.movimentacaoEstoque.create({
      data: {
        estoqueId: estoque.id,
        tipo: TipoMovimentacao.ENTRADA,
        quantidade,
        motivo: motivo?.trim() || 'Entrada manual',
      },
    });
    return this.apresentar(atualizado);
  }

  async ajustar(produtoId: string, quantidade: number, minimo?: number) {
    const estoque = await this.estoqueDireto(produtoId);
    const delta = quantidade - estoque.quantidade;
    const atualizado = await this.prisma.estoque.update({
      where: { id: estoque.id },
      data: {
        quantidade,
        minimo: minimo ?? estoque.minimo,
      },
      include: { produto: true },
    });
    if (delta !== 0) {
      await this.prisma.movimentacaoEstoque.create({
        data: {
          estoqueId: estoque.id,
          tipo: TipoMovimentacao.AJUSTE,
          quantidade: Math.abs(delta),
          motivo:
            delta > 0
              ? 'Ajuste de contagem para cima'
              : 'Ajuste de contagem para baixo',
        },
      });
    } else if (minimo !== undefined && minimo !== estoque.minimo) {
      await this.prisma.movimentacaoEstoque.create({
        data: {
          estoqueId: estoque.id,
          tipo: TipoMovimentacao.AJUSTE,
          quantidade: 0,
          motivo: 'Atualização do estoque mínimo',
        },
      });
    }
    return this.apresentar(atualizado);
  }

  private async estoqueDireto(produtoId: string) {
    const produto = await this.prisma.produto.findUnique({
      where: { id: produtoId },
      include: { estoque: true },
    });
    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }
    if (produto.tipo !== TipoProduto.DIRETO || !produto.estoque) {
      throw new BadRequestException(
        'Só produtos diretos entram no controle de estoque.',
      );
    }
    return produto.estoque;
  }

  private apresentar(item: {
    produtoId: string;
    quantidade: number;
    minimo: number;
    produto: { nome: string };
  }) {
    return {
      produtoId: item.produtoId,
      nome: item.produto.nome,
      quantidade: item.quantidade,
      minimo: item.minimo,
      baixo: item.quantidade <= item.minimo,
    };
  }
}
