import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FormaPagamento,
  Prisma,
  StatusComanda,
  StatusPagamentoItem,
  TipoMovimentacao,
  TipoProduto,
} from '@prisma/client';
import { fromCents, toCents } from '../common/money';
import { PrismaService } from '../prisma/prisma.service';

const comandaInclude = {
  mesa: true,
  itens: { include: { produto: true }, orderBy: { id: 'asc' as const } },
  pagamentos: {
    include: { itens: true },
    orderBy: { criadoEm: 'asc' as const },
  },
} satisfies Prisma.ComandaInclude;

type ComandaCompleta = Prisma.ComandaGetPayload<{
  include: typeof comandaInclude;
}>;
type ItemComProduto = ComandaCompleta['itens'][number];

@Injectable()
export class ComandasService {
  constructor(private readonly prisma: PrismaService) {}

  async abrir(mesaId: string, pessoas: number) {
    const mesa = await this.prisma.mesa.findUnique({ where: { id: mesaId } });
    if (!mesa) {
      throw new NotFoundException('Mesa não encontrada.');
    }
    const aberta = await this.prisma.comanda.findFirst({
      where: { mesaId, status: StatusComanda.ABERTA },
    });
    if (aberta) {
      throw new ConflictException('Esta mesa já tem uma comanda aberta.');
    }
    const comanda = await this.prisma.comanda.create({
      data: { mesaId, pessoas, status: StatusComanda.ABERTA },
      include: comandaInclude,
    });
    return this.apresentar(comanda);
  }

  async listar() {
    const comandas = await this.prisma.comanda.findMany({
      orderBy: { abertaEm: 'desc' },
      include: comandaInclude,
      take: 50,
    });
    return comandas.map((comanda) => this.apresentar(comanda));
  }

  async buscar(id: string) {
    return this.apresentar(await this.carregar(id));
  }

  async pedirConta(id: string) {
    const comanda = await this.carregar(id);
    if (comanda.status !== StatusComanda.ABERTA) {
      throw new BadRequestException('A comanda não está aberta.');
    }
    const atualizada = await this.prisma.comanda.update({
      where: { id },
      data: { aguardandoPagamento: true },
      include: comandaInclude,
    });
    return this.apresentar(atualizada);
  }

  async adicionarItem(
    comandaId: string,
    produtoId: string,
    quantidade: number,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const comanda = await this.comandaAberta(tx, comandaId);
      const produto = await tx.produto.findUnique({
        where: { id: produtoId },
        include: { estoque: true },
      });
      if (!produto || !produto.ativo) {
        throw new NotFoundException('Produto não encontrado.');
      }
      await this.baixarEstoque(
        tx,
        produto,
        quantidade,
        'Lançamento em comanda',
      );

      const existente = await tx.itemComanda.findFirst({
        where: {
          comandaId: comanda.id,
          produtoId: produto.id,
          statusPagamento: StatusPagamentoItem.PENDENTE,
          precoUnitario: produto.preco,
        },
      });
      if (existente) {
        await tx.itemComanda.update({
          where: { id: existente.id },
          data: { quantidade: existente.quantidade + quantidade },
        });
        return;
      }
      await tx.itemComanda.create({
        data: {
          comandaId: comanda.id,
          produtoId: produto.id,
          quantidade,
          precoUnitario: produto.preco,
        },
      });
    });
    return this.buscar(comandaId);
  }

  async atualizarQuantidade(
    comandaId: string,
    itemId: string,
    quantidade: number,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const item = await this.itemPendente(tx, comandaId, itemId);
      if (quantidade === item.quantidade) {
        return;
      }
      if (quantidade === 0) {
        await this.devolverEstoque(tx, item, item.quantidade);
        await tx.itemComanda.delete({ where: { id: item.id } });
        return;
      }
      const delta = quantidade - item.quantidade;
      if (delta > 0) {
        await this.baixarEstoque(
          tx,
          item.produto,
          delta,
          'Aumento de quantidade na comanda',
        );
      } else {
        await this.devolverEstoque(tx, item, -delta);
      }
      await tx.itemComanda.update({
        where: { id: item.id },
        data: { quantidade },
      });
    });
    return this.buscar(comandaId);
  }

  async pagar(
    comandaId: string,
    forma: FormaPagamento,
    itemIds?: string[],
    pessoas?: number,
  ) {
    const resultado = await this.prisma.$transaction(async (tx) => {
      const comanda = await tx.comanda.findUnique({
        where: { id: comandaId },
        include: { itens: true },
      });
      if (!comanda) {
        throw new NotFoundException('Comanda não encontrada.');
      }
      if (comanda.status !== StatusComanda.ABERTA) {
        throw new BadRequestException(
          'Uma comanda só pode ser fechada se estiver aberta.',
        );
      }

      const pendentes = comanda.itens.filter(
        (item) => item.statusPagamento === StatusPagamentoItem.PENDENTE,
      );
      const selecionados = this.selecionarItens(pendentes, itemIds);
      const centavos = selecionados.reduce(
        (soma, item) => soma + toCents(item.precoUnitario) * item.quantidade,
        0,
      );
      const pagamento = await tx.pagamento.create({
        data: {
          comandaId,
          forma,
          valor: (centavos / 100).toFixed(2),
          itens: { connect: selecionados.map((item) => ({ id: item.id })) },
        },
      });
      await tx.itemComanda.updateMany({
        where: { id: { in: selecionados.map((item) => item.id) } },
        data: {
          statusPagamento: StatusPagamentoItem.PAGO,
          pagamentoId: pagamento.id,
        },
      });

      const fechada = pendentes.length === selecionados.length;
      if (fechada) {
        await tx.comanda.update({
          where: { id: comandaId },
          data: {
            status: StatusComanda.FECHADA,
            fechadaEm: new Date(),
            aguardandoPagamento: false,
          },
        });
      }

      return {
        pagamentoId: pagamento.id,
        forma,
        valor: fromCents(centavos),
        fechada,
        divisao: pessoas
          ? { pessoas, porPessoa: fromCents(Math.round(centavos / pessoas)) }
          : null,
      };
    });

    return { ...resultado, comanda: await this.buscar(comandaId) };
  }

  private selecionarItens<T extends { id: string }>(
    pendentes: T[],
    itemIds?: string[],
  ) {
    if (!itemIds || itemIds.length === 0) {
      if (pendentes.length === 0) {
        throw new BadRequestException('Não há itens pendentes para pagamento.');
      }
      return pendentes;
    }
    const ids = [...new Set(itemIds)];
    const porId = new Map(pendentes.map((item) => [item.id, item]));
    const selecionados = ids.map((id) => porId.get(id));
    if (selecionados.some((item) => !item)) {
      throw new BadRequestException(
        'Um ou mais itens não podem ser pagos. Item pago não entra em outro fechamento.',
      );
    }
    return selecionados.filter((item): item is T => Boolean(item));
  }

  private async comandaAberta(tx: Prisma.TransactionClient, id: string) {
    const comanda = await tx.comanda.findUnique({ where: { id } });
    if (!comanda) {
      throw new NotFoundException('Comanda não encontrada.');
    }
    if (comanda.status !== StatusComanda.ABERTA) {
      throw new BadRequestException('A comanda não está aberta.');
    }
    return comanda;
  }

  private async itemPendente(
    tx: Prisma.TransactionClient,
    comandaId: string,
    itemId: string,
  ) {
    await this.comandaAberta(tx, comandaId);
    const item = await tx.itemComanda.findUnique({
      where: { id: itemId },
      include: { produto: { include: { estoque: true } } },
    });
    if (!item || item.comandaId !== comandaId) {
      throw new NotFoundException('Item não encontrado.');
    }
    if (item.statusPagamento !== StatusPagamentoItem.PENDENTE) {
      throw new BadRequestException('Item pago não pode ser alterado.');
    }
    return item;
  }

  private async baixarEstoque(
    tx: Prisma.TransactionClient,
    produto: {
      tipo: TipoProduto;
      estoque: { id: string; quantidade: number } | null;
    },
    quantidade: number,
    motivo: string,
  ) {
    if (produto.tipo !== TipoProduto.DIRETO) {
      return;
    }
    if (!produto.estoque || produto.estoque.quantidade < quantidade) {
      throw new BadRequestException(
        'Não é permitido lançar um produto direto sem estoque suficiente.',
      );
    }
    await tx.estoque.update({
      where: { id: produto.estoque.id },
      data: { quantidade: { decrement: quantidade } },
    });
    await tx.movimentacaoEstoque.create({
      data: {
        estoqueId: produto.estoque.id,
        tipo: TipoMovimentacao.SAIDA,
        quantidade,
        motivo,
      },
    });
  }

  private async devolverEstoque(
    tx: Prisma.TransactionClient,
    item: {
      produto: {
        tipo: TipoProduto;
        estoque: { id: string } | null;
      };
    },
    quantidade: number,
  ) {
    if (item.produto.tipo !== TipoProduto.DIRETO || !item.produto.estoque) {
      return;
    }
    await tx.estoque.update({
      where: { id: item.produto.estoque.id },
      data: { quantidade: { increment: quantidade } },
    });
    await tx.movimentacaoEstoque.create({
      data: {
        estoqueId: item.produto.estoque.id,
        tipo: TipoMovimentacao.ENTRADA,
        quantidade,
        motivo: 'Devolução de item da comanda',
      },
    });
  }

  private async carregar(id: string) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { id },
      include: comandaInclude,
    });
    if (!comanda) {
      throw new NotFoundException('Comanda não encontrada.');
    }
    return comanda;
  }

  private apresentar(comanda: ComandaCompleta) {
    const total = fromCents(
      comanda.itens.reduce(
        (soma, item) => soma + toCents(item.precoUnitario) * item.quantidade,
        0,
      ),
    );
    const totalPago = fromCents(
      comanda.itens
        .filter((item) => item.statusPagamento === StatusPagamentoItem.PAGO)
        .reduce(
          (soma, item) => soma + toCents(item.precoUnitario) * item.quantidade,
          0,
        ),
    );
    return {
      id: comanda.id,
      status: comanda.status,
      pessoas: comanda.pessoas,
      aguardandoPagamento: comanda.aguardandoPagamento,
      abertaEm: comanda.abertaEm,
      fechadaEm: comanda.fechadaEm,
      mesa: { id: comanda.mesa.id, numero: comanda.mesa.numero },
      total,
      totalPago,
      totalPendente: fromCents(toCents(total) - toCents(totalPago)),
      itens: comanda.itens.map((item) => this.apresentarItem(item)),
      pagamentos: comanda.pagamentos.map((pagamento) => ({
        id: pagamento.id,
        forma: pagamento.forma,
        valor: fromCents(toCents(pagamento.valor)),
        criadoEm: pagamento.criadoEm,
        itemIds: pagamento.itens.map((item) => item.id),
      })),
    };
  }

  private apresentarItem(item: ItemComProduto) {
    return {
      id: item.id,
      quantidade: item.quantidade,
      precoUnitario: fromCents(toCents(item.precoUnitario)),
      total: fromCents(toCents(item.precoUnitario) * item.quantidade),
      statusPagamento: item.statusPagamento,
      produto: {
        id: item.produto.id,
        nome: item.produto.nome,
        categoria: item.produto.categoria,
        tipo: item.produto.tipo,
      },
    };
  }
}
