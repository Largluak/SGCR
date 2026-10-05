import {
  CategoriaProduto,
  FormaPagamento,
  Prisma,
  PrismaClient,
  StatusComanda,
  StatusPagamentoItem,
  TipoProduto,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function aleatorio(semente: number) {
  let valor = semente;
  return () => {
    valor = (valor + 0x6d2b79f5) | 0;
    let t = Math.imul(valor ^ (valor >>> 15), 1 | valor);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cardapio: {
  nome: string;
  descricao?: string;
  categoria: CategoriaProduto;
  preco: number;
  tipo: TipoProduto;
  quantidade?: number;
  minimo?: number;
}[] = [
  { nome: 'Pão de alho na brasa', categoria: CategoriaProduto.ENTRADA, preco: 22, tipo: TipoProduto.PREPARADO },
  { nome: 'Bolinho de costela', categoria: CategoriaProduto.ENTRADA, preco: 34, tipo: TipoProduto.PREPARADO },
  { nome: 'Tábua de queijos', categoria: CategoriaProduto.ENTRADA, preco: 48, tipo: TipoProduto.PREPARADO },
  {
    nome: 'Picanha na chapa',
    descricao: '300g, arroz, farofa e vinagrete',
    categoria: CategoriaProduto.PRATO,
    preco: 89,
    tipo: TipoProduto.PREPARADO,
  },
  { nome: 'Risoto de funghi', categoria: CategoriaProduto.PRATO, preco: 62, tipo: TipoProduto.PREPARADO },
  { nome: 'Filé ao poivre', categoria: CategoriaProduto.PRATO, preco: 94, tipo: TipoProduto.PREPARADO },
  { nome: 'Salmão grelhado', categoria: CategoriaProduto.PRATO, preco: 78, tipo: TipoProduto.PREPARADO },
  { nome: 'Fettuccine ao sugo', categoria: CategoriaProduto.PRATO, preco: 54, tipo: TipoProduto.PREPARADO },
  { nome: 'Cerveja Pilsen 600ml', categoria: CategoriaProduto.BEBIDA, preco: 18, tipo: TipoProduto.DIRETO, quantidade: 42, minimo: 12 },
  { nome: 'Chopp artesanal 500ml', categoria: CategoriaProduto.BEBIDA, preco: 16, tipo: TipoProduto.DIRETO, quantidade: 6, minimo: 10 },
  { nome: 'Água com gás 500ml', categoria: CategoriaProduto.BEBIDA, preco: 8, tipo: TipoProduto.DIRETO, quantidade: 30, minimo: 10 },
  { nome: 'Refrigerante lata', categoria: CategoriaProduto.BEBIDA, preco: 9, tipo: TipoProduto.DIRETO, quantidade: 0, minimo: 15 },
  { nome: 'Vinho tinto (taça)', categoria: CategoriaProduto.BEBIDA, preco: 28, tipo: TipoProduto.DIRETO, quantidade: 14, minimo: 6 },
  { nome: 'Caipirinha', categoria: CategoriaProduto.BEBIDA, preco: 24, tipo: TipoProduto.PREPARADO },
  { nome: 'Petit gâteau', categoria: CategoriaProduto.SOBREMESA, preco: 32, tipo: TipoProduto.PREPARADO },
  { nome: 'Pudim de leite', categoria: CategoriaProduto.SOBREMESA, preco: 22, tipo: TipoProduto.PREPARADO },
];

async function limpar() {
  await prisma.movimentacaoEstoque.deleteMany();
  await prisma.itemComanda.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.comanda.deleteMany();
  await prisma.estoque.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.mesa.deleteMany();
  await prisma.usuario.deleteMany();
}

async function main() {
  await limpar();
  const senhaGerente = await bcrypt.hash('gerente123', 10);
  const senhaGarcom = await bcrypt.hash('garcom123', 10);
  await prisma.usuario.createMany({
    data: [
      {
        nome: 'Carla Souza',
        email: 'carla.souza@ardosia.local',
        senhaHash: senhaGerente,
        perfil: 'GERENTE',
      },
      {
        nome: 'João Ribeiro',
        email: 'joao.ribeiro@ardosia.local',
        senhaHash: senhaGarcom,
        perfil: 'GARCOM',
      },
    ],
  });

  const mesas: { id: string }[] = [];
  for (let numero = 1; numero <= 12; numero += 1) {
    mesas.push(await prisma.mesa.create({ data: { numero } }));
  }

  const produtos: { id: string; nome: string; preco: Prisma.Decimal }[] = [];
  for (const item of cardapio) {
    produtos.push(
      await prisma.produto.create({
        data: {
          nome: item.nome,
          descricao: item.descricao,
          categoria: item.categoria,
          preco: item.preco.toFixed(2),
          tipo: item.tipo,
          estoque:
            item.tipo === TipoProduto.DIRETO
              ? { create: { quantidade: item.quantidade ?? 0, minimo: item.minimo ?? 5 } }
              : undefined,
        },
      }),
    );
  }
  const porNome = new Map(produtos.map((produto) => [produto.nome, produto]));

  async function comandaAberta(
    numero: number,
    pessoas: number,
    abertaEm: Date,
    aguardandoPagamento: boolean,
    itens: { nome: string; quantidade: number }[],
  ) {
    const mesa = mesas[numero - 1];
    await prisma.comanda.create({
      data: {
        mesaId: mesa.id,
        pessoas,
        abertaEm,
        aguardandoPagamento,
        itens: {
          create: itens.map((item) => {
            const produto = porNome.get(item.nome);
            if (!produto) {
              throw new Error(`Produto ausente no seed: ${item.nome}`);
            }
            return {
              produtoId: produto.id,
              quantidade: item.quantidade,
              precoUnitario: produto.preco,
            };
          }),
        },
      },
    });
  }

  const agora = Date.now();
  await comandaAberta(1, 3, new Date(agora - 83 * 60 * 1000), false, [
    { nome: 'Picanha na chapa', quantidade: 1 },
    { nome: 'Cerveja Pilsen 600ml', quantidade: 3 },
    { nome: 'Bolinho de costela', quantidade: 1 },
    { nome: 'Petit gâteau', quantidade: 2 },
  ]);
  await comandaAberta(3, 2, new Date(agora - 47 * 60 * 1000), false, [
    { nome: 'Filé ao poivre', quantidade: 1 },
    { nome: 'Salmão grelhado', quantidade: 1 },
    { nome: 'Água com gás 500ml', quantidade: 1 },
  ]);
  await comandaAberta(5, 4, new Date(agora - 125 * 60 * 1000), true, [
    { nome: 'Filé ao poivre', quantidade: 2 },
    { nome: 'Salmão grelhado', quantidade: 2 },
    { nome: 'Cerveja Pilsen 600ml', quantidade: 6 },
    { nome: 'Pudim de leite', quantidade: 4 },
  ]);
  await comandaAberta(8, 2, new Date(agora - 26 * 60 * 60 * 1000), false, [
    { nome: 'Bolinho de costela', quantidade: 1 },
    { nome: 'Cerveja Pilsen 600ml', quantidade: 2 },
  ]);

  const sortear = aleatorio(20261005);
  const formas = [FormaPagamento.DINHEIRO, FormaPagamento.CARTAO, FormaPagamento.PIX];
  const meses = [3, 4, 5, 6, 7, 8, 9];
  for (const mes of meses) {
    const quantidade = 8 + Math.floor(sortear() * 5);
    for (let indice = 0; indice < quantidade; indice += 1) {
      const ultimoDia = mes === 9 ? 4 : 27;
      const dia = 1 + Math.floor(sortear() * ultimoDia);
      const abertaEm = new Date(2026, mes, dia, 12, 30, 0);
      const fechadaEm = new Date(abertaEm.getTime() + 80 * 60 * 1000);
      const mesa = mesas[Math.floor(sortear() * mesas.length)];
      const escolhidos = Array.from({ length: 2 + Math.floor(sortear() * 3) }, () => ({
        produto: produtos[Math.floor(sortear() * produtos.length)],
        quantidade: 1 + Math.floor(sortear() * 3),
      }));
      const comanda = await prisma.comanda.create({
        data: {
          mesaId: mesa.id,
          pessoas: 2 + Math.floor(sortear() * 3),
          status: StatusComanda.FECHADA,
          abertaEm,
          fechadaEm,
          itens: {
            create: escolhidos.map((item) => ({
              produtoId: item.produto.id,
              quantidade: item.quantidade,
              precoUnitario: item.produto.preco,
              statusPagamento: StatusPagamentoItem.PAGO,
            })),
          },
        },
        include: { itens: true },
      });
      const centavos = comanda.itens.reduce(
        (soma, item) => soma + Math.round(Number(item.precoUnitario) * 100) * item.quantidade,
        0,
      );
      await prisma.pagamento.create({
        data: {
          comandaId: comanda.id,
          forma: formas[Math.floor(sortear() * formas.length)],
          valor: new Prisma.Decimal((centavos / 100).toFixed(2)),
          itens: { connect: comanda.itens.map((item) => ({ id: item.id })) },
        },
      });
    }
  }

  console.log('Seed concluído.');
  console.log('Gerente: carla.souza@ardosia.local / gerente123');
  console.log('Garçom: joao.ribeiro@ardosia.local / garcom123');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
