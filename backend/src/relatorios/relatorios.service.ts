import { Injectable } from '@nestjs/common';
import { Prisma, StatusComanda, TipoProduto } from '@prisma/client';
import { fromCents, toCents } from '../common/money';
import { statusDaMesa, totalDosItens } from '../mesas/mesas.service';
import { PrismaService } from '../prisma/prisma.service';
import { RelatorioQueryDto } from './dto/relatorio.dto';
import { MESES_CURTOS, intervaloDoPeriodo, mesesDoIntervalo } from './periodo';

type ItemRelatorio = {
  quantidade: number;
  precoUnitario: Prisma.Decimal;
  produto: { nome: string };
};

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 1);

    const [comandasDoDia, abertas, fechadasRecentes, totalMesas, estoque] =
      await Promise.all([
        this.prisma.comanda.findMany({
          where: {
            OR: [
              { abertaEm: { gte: inicio, lt: fim } },
              { fechadaEm: { gte: inicio, lt: fim } },
            ],
          },
          include: { itens: true },
        }),
        this.prisma.comanda.findMany({
          where: { status: StatusComanda.ABERTA },
          include: { mesa: true, itens: true },
          orderBy: { abertaEm: 'desc' },
        }),
        this.prisma.comanda.findMany({
          where: { status: StatusComanda.FECHADA },
          include: { mesa: true, itens: true },
          orderBy: { fechadaEm: 'desc' },
          take: 5,
        }),
        this.prisma.mesa.count(),
        this.prisma.estoque.findMany({
          where: { produto: { tipo: TipoProduto.DIRETO, ativo: true } },
          include: { produto: true },
          orderBy: { quantidade: 'asc' },
        }),
      ]);

    const vendasDoDia = fromCents(
      comandasDoDia.reduce(
        (soma, comanda) => soma + toCents(totalDosItens(comanda.itens)),
        0,
      ),
    );

    const ultimas = [...abertas, ...fechadasRecentes]
      .sort((a, b) => b.abertaEm.getTime() - a.abertaEm.getTime())
      .slice(0, 8)
      .map((comanda) => ({
        id: comanda.id,
        mesaNumero: comanda.mesa.numero,
        abertaEm: comanda.abertaEm,
        pessoas: comanda.pessoas,
        status: comanda.status,
        statusOperacional:
          comanda.status === StatusComanda.FECHADA
            ? 'FECHADA'
            : statusDaMesa(comanda) === 'AGUARDANDO_PAGAMENTO'
              ? 'AGUARDANDO_PAGAMENTO'
              : 'EM_ANDAMENTO',
        total: totalDosItens(comanda.itens),
      }));

    return {
      vendasDoDia,
      comandasDoDia: comandasDoDia.length,
      mesasOcupadas: abertas.length,
      totalMesas,
      estoqueBaixo: estoque
        .filter((item) => item.quantidade <= item.minimo)
        .map((item) => ({
          produtoId: item.produtoId,
          nome: item.produto.nome,
          quantidade: item.quantidade,
          minimo: item.minimo,
        })),
      ultimasComandas: ultimas,
    };
  }

  async relatorio(query: RelatorioQueryDto) {
    const intervalo = intervaloDoPeriodo(query);
    const comandas = await this.prisma.comanda.findMany({
      where: {
        status: StatusComanda.FECHADA,
        fechadaEm: { gte: intervalo.inicio, lt: intervalo.fim },
      },
      include: { itens: { include: { produto: true } } },
    });

    const meses = mesesDoIntervalo(intervalo.inicio, intervalo.fim).map(
      (data) => ({
        chave: `${data.getFullYear()}-${data.getMonth()}`,
        rotulo: MESES_CURTOS[data.getMonth()],
        totalCentavos: 0,
      }),
    );
    const porProduto = new Map<
      string,
      { quantidade: number; centavos: number }
    >();
    let totalCentavos = 0;

    for (const comanda of comandas) {
      const fechamento = comanda.fechadaEm ?? comanda.abertaEm;
      const chave = `${fechamento.getFullYear()}-${fechamento.getMonth()}`;
      const mes = meses.find((item) => item.chave === chave);
      for (const item of comanda.itens) {
        const centavos = toCents(item.precoUnitario) * item.quantidade;
        totalCentavos += centavos;
        if (mes) {
          mes.totalCentavos += centavos;
        }
        this.somarProduto(porProduto, item, centavos);
      }
    }

    const ranking = [...porProduto.entries()]
      .map(([nome, valor]) => ({
        nome,
        quantidade: valor.quantidade,
        total: fromCents(valor.centavos),
      }))
      .sort((a, b) => b.quantidade - a.quantidade || b.total - a.total);

    const vendasPorMes = meses.map((mes) => ({
      rotulo: mes.rotulo,
      total: fromCents(mes.totalCentavos),
    }));
    const melhor = vendasPorMes.reduce<(typeof vendasPorMes)[number] | null>(
      (atual, mes) => (atual === null || mes.total > atual.total ? mes : atual),
      null,
    );

    return {
      periodo: query.periodo,
      rotulo: intervalo.rotulo,
      inicio: intervalo.inicio,
      fim: intervalo.fim,
      totalVendido: fromCents(totalCentavos),
      comandasFechadas: comandas.length,
      produtoMaisVendido: ranking[0] ?? null,
      mediaMensal: fromCents(
        Math.round(totalCentavos / Math.max(meses.length, 1)),
      ),
      melhorMes: melhor && melhor.total > 0 ? melhor : null,
      vendasPorMes,
      ranking: ranking.slice(0, 8),
    };
  }

  private somarProduto(
    mapa: Map<string, { quantidade: number; centavos: number }>,
    item: ItemRelatorio,
    centavos: number,
  ) {
    const atual = mapa.get(item.produto.nome) ?? { quantidade: 0, centavos: 0 };
    atual.quantidade += item.quantidade;
    atual.centavos += centavos;
    mapa.set(item.produto.nome, atual);
  }
}
