import { BadRequestException } from '@nestjs/common';
import { FormaPagamento, StatusComanda, TipoProduto } from '@prisma/client';
import { ComandasService } from './comandas.service';
import { PrismaService } from '../prisma/prisma.service';

const comandaVazia = {
  id: 'c1',
  status: StatusComanda.ABERTA,
  pessoas: 2,
  aguardandoPagamento: false,
  abertaEm: new Date('2026-10-05T18:00:00Z'),
  fechadaEm: null,
  mesa: { id: 'm1', numero: 1 },
  itens: [],
  pagamentos: [],
};

describe('ComandasService', () => {
  const tx = {
    comanda: { findUnique: jest.fn(), update: jest.fn() },
    produto: { findUnique: jest.fn() },
    estoque: { update: jest.fn() },
    movimentacaoEstoque: { create: jest.fn() },
    itemComanda: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    pagamento: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
    comanda: { findUnique: jest.fn() },
  };
  const service = new ComandasService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.comanda.findUnique.mockResolvedValue(comandaVazia);
    tx.estoque.update.mockResolvedValue({});
    tx.movimentacaoEstoque.create.mockResolvedValue({});
    tx.itemComanda.create.mockResolvedValue({});
    tx.itemComanda.update.mockResolvedValue({});
    tx.itemComanda.updateMany.mockResolvedValue({});
    tx.itemComanda.delete.mockResolvedValue({});
  });

  it('não lança produto direto sem estoque suficiente', async () => {
    tx.comanda.findUnique.mockResolvedValue({
      id: 'c1',
      status: StatusComanda.ABERTA,
    });
    tx.produto.findUnique.mockResolvedValue({
      id: 'p1',
      ativo: true,
      tipo: TipoProduto.DIRETO,
      preco: '9.00',
      estoque: { id: 'e1', quantidade: 0 },
    });

    await expect(service.adicionarItem('c1', 'p1', 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(tx.estoque.update).not.toHaveBeenCalled();
    expect(tx.itemComanda.create).not.toHaveBeenCalled();
  });

  it('não baixa estoque de produto preparado', async () => {
    tx.comanda.findUnique.mockResolvedValue({
      id: 'c1',
      status: StatusComanda.ABERTA,
    });
    tx.produto.findUnique.mockResolvedValue({
      id: 'p2',
      ativo: true,
      tipo: TipoProduto.PREPARADO,
      preco: '89.00',
      estoque: null,
    });
    tx.itemComanda.findFirst.mockResolvedValue(null);

    await service.adicionarItem('c1', 'p2', 1);

    expect(tx.estoque.update).not.toHaveBeenCalled();
    expect(tx.itemComanda.create).toHaveBeenCalled();
  });

  it('devolve o estoque ao remover item direto', async () => {
    tx.itemComanda.findUnique.mockResolvedValue({
      id: 'i1',
      comandaId: 'c1',
      quantidade: 2,
      statusPagamento: 'PENDENTE',
      produto: {
        tipo: TipoProduto.DIRETO,
        estoque: { id: 'e1', quantidade: 4 },
      },
    });
    tx.comanda.findUnique.mockResolvedValue({
      id: 'c1',
      status: StatusComanda.ABERTA,
    });

    await service.atualizarQuantidade('c1', 'i1', 0);

    expect(tx.estoque.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { quantidade: { increment: 2 } },
    });
    expect(tx.itemComanda.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
  });

  it('mantém a comanda aberta no fechamento parcial', async () => {
    tx.comanda.findUnique.mockResolvedValue({
      id: 'c1',
      status: StatusComanda.ABERTA,
      itens: [
        {
          id: 'a',
          statusPagamento: 'PENDENTE',
          quantidade: 1,
          precoUnitario: '10.00',
        },
        {
          id: 'b',
          statusPagamento: 'PENDENTE',
          quantidade: 2,
          precoUnitario: '5.00',
        },
      ],
    });
    tx.pagamento.create.mockResolvedValue({ id: 'pay1' });

    const resultado = await service.pagar('c1', FormaPagamento.PIX, ['a'], 2);

    expect(resultado.fechada).toBe(false);
    expect(resultado.valor).toBe(10);
    expect(resultado.divisao).toEqual({ pessoas: 2, porPessoa: 5 });
    expect(tx.comanda.update).not.toHaveBeenCalled();
    expect(tx.itemComanda.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['a'] } },
      }),
    );
  });

  it('fecha a comanda quando todos os itens são pagos', async () => {
    tx.comanda.findUnique.mockResolvedValue({
      id: 'c1',
      status: StatusComanda.ABERTA,
      itens: [
        {
          id: 'a',
          statusPagamento: 'PENDENTE',
          quantidade: 1,
          precoUnitario: '10.00',
        },
      ],
    });
    tx.pagamento.create.mockResolvedValue({ id: 'pay2' });

    const resultado = await service.pagar('c1', FormaPagamento.DINHEIRO);

    expect(resultado.fechada).toBe(true);
    const chamadas = tx.comanda.update.mock.calls as unknown as Array<
      [{ data: { status: StatusComanda } }]
    >;
    expect(chamadas[0]?.[0].data.status).toBe(StatusComanda.FECHADA);
  });

  it('recusa pagar de novo um item que já foi quitado', async () => {
    tx.comanda.findUnique.mockResolvedValue({
      id: 'c1',
      status: StatusComanda.ABERTA,
      itens: [
        {
          id: 'a',
          statusPagamento: 'PAGO',
          quantidade: 1,
          precoUnitario: '10.00',
        },
        {
          id: 'b',
          statusPagamento: 'PENDENTE',
          quantidade: 1,
          precoUnitario: '5.00',
        },
      ],
    });

    await expect(
      service.pagar('c1', FormaPagamento.CARTAO, ['a']),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.pagamento.create).not.toHaveBeenCalled();
  });
});
