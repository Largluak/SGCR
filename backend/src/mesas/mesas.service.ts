import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusComanda, StatusPagamentoItem } from '@prisma/client';
import { fromCents, toCents } from '../common/money';
import { PrismaService } from '../prisma/prisma.service';

type ItemValor = {
  quantidade: number;
  precoUnitario: Prisma.Decimal;
  statusPagamento: StatusPagamentoItem;
};

export function statusDaMesa(
  comanda: {
    status: StatusComanda;
    aguardandoPagamento: boolean;
    itens: { statusPagamento: StatusPagamentoItem }[];
  } | null,
) {
  if (!comanda || comanda.status !== StatusComanda.ABERTA) {
    return 'LIVRE' as const;
  }
  const algumPago = comanda.itens.some(
    (item) => item.statusPagamento === StatusPagamentoItem.PAGO,
  );
  const algumPendente = comanda.itens.some(
    (item) => item.statusPagamento === StatusPagamentoItem.PENDENTE,
  );
  if (comanda.aguardandoPagamento || (algumPago && algumPendente)) {
    return 'AGUARDANDO_PAGAMENTO' as const;
  }
  return 'OCUPADA' as const;
}

export function totalDosItens(
  itens: ItemValor[],
  somente?: StatusPagamentoItem,
) {
  const lista = somente
    ? itens.filter((item) => item.statusPagamento === somente)
    : itens;
  return fromCents(
    lista.reduce(
      (soma, item) => soma + toCents(item.precoUnitario) * item.quantidade,
      0,
    ),
  );
}

@Injectable()
export class MesasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const mesas = await this.prisma.mesa.findMany({
      orderBy: { numero: 'asc' },
      include: {
        comandas: {
          where: { status: StatusComanda.ABERTA },
          include: { itens: true },
        },
      },
    });

    return mesas.map((mesa) => {
      const comanda = mesa.comandas[0] ?? null;
      return {
        id: mesa.id,
        numero: mesa.numero,
        status: statusDaMesa(comanda),
        comanda: comanda
          ? {
              id: comanda.id,
              pessoas: comanda.pessoas,
              abertaEm: comanda.abertaEm,
              aguardandoPagamento: comanda.aguardandoPagamento,
              total: totalDosItens(comanda.itens),
              totalPendente: totalDosItens(
                comanda.itens,
                StatusPagamentoItem.PENDENTE,
              ),
            }
          : null,
      };
    });
  }

  async criar(numero: number) {
    try {
      const mesa = await this.prisma.mesa.create({ data: { numero } });
      return {
        id: mesa.id,
        numero: mesa.numero,
        status: 'LIVRE' as const,
        comanda: null,
      };
    } catch (error) {
      this.tratarNumeroDuplicado(error);
    }
  }

  async atualizar(id: string, numero: number) {
    await this.buscar(id);
    try {
      const mesa = await this.prisma.mesa.update({
        where: { id },
        data: { numero },
      });
      return { id: mesa.id, numero: mesa.numero };
    } catch (error) {
      this.tratarNumeroDuplicado(error);
    }
  }

  async remover(id: string) {
    await this.buscar(id);
    const comandas = await this.prisma.comanda.count({ where: { mesaId: id } });
    if (comandas > 0) {
      throw new ConflictException(
        'Não é possível remover uma mesa que já teve comandas.',
      );
    }
    await this.prisma.mesa.delete({ where: { id } });
    return { removida: true };
  }

  private async buscar(id: string) {
    const mesa = await this.prisma.mesa.findUnique({ where: { id } });
    if (!mesa) {
      throw new NotFoundException('Mesa não encontrada.');
    }
    return mesa;
  }

  private tratarNumeroDuplicado(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Já existe uma mesa com esse número.');
    }
    throw error;
  }
}
