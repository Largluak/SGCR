import { Workbook } from 'exceljs';

export type LinhaProduto = {
  nome: string;
  quantidade: number;
  total: number;
};

export type DadosPlanilha = {
  periodo: string;
  rotulo: string;
  totalVendido: number;
  comandasFechadas: number;
  produtoMaisVendido: LinhaProduto | null;
  mediaMensal: number;
  melhorMes: { rotulo: string; total: number } | null;
  vendasPorMes: { rotulo: string; total: number }[];
  ranking: LinhaProduto[];
};

export function nomeDoArquivo(periodo: string, rotulo: string) {
  const base = rotulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `relatorio-${periodo}-${base}.xlsx`;
}

export async function gerarPlanilha(dados: DadosPlanilha) {
  const livro = new Workbook();
  livro.creator = 'SGCR';
  livro.created = new Date();

  const resumo = livro.addWorksheet('Resumo');
  resumo.columns = [
    { header: 'Campo', width: 32 },
    { header: 'Valor', width: 36 },
  ];
  const maisVendido = dados.produtoMaisVendido;
  const linhasResumo: [string, string | number][] = [
    ['Período', dados.rotulo],
    ['Total vendido (R$)', dados.totalVendido],
    ['Comandas fechadas', dados.comandasFechadas],
    ['Produto mais vendido', maisVendido?.nome ?? 'Sem vendas'],
    ['Quantidade do mais vendido', maisVendido?.quantidade ?? 0],
    ['Total do mais vendido (R$)', maisVendido?.total ?? 0],
    ['Média mensal (R$)', dados.mediaMensal],
    ['Melhor mês', dados.melhorMes?.rotulo ?? 'Sem vendas'],
    ['Total do melhor mês (R$)', dados.melhorMes?.total ?? 0],
  ];
  for (const [campo, valor] of linhasResumo) {
    const linha = resumo.addRow([campo, valor]);
    if (typeof valor === 'number' && campo.includes('R$')) {
      linha.getCell(2).numFmt = '#,##0.00';
    }
  }
  resumo.getRow(1).font = { bold: true };

  const meses = livro.addWorksheet('Vendas por mês');
  meses.columns = [
    { header: 'Mês', width: 16 },
    { header: 'Total (R$)', width: 16 },
  ];
  for (const item of dados.vendasPorMes) {
    const linha = meses.addRow([item.rotulo, item.total]);
    linha.getCell(2).numFmt = '#,##0.00';
  }
  meses.getRow(1).font = { bold: true };

  const produtos = livro.addWorksheet('Produtos');
  produtos.columns = [
    { header: 'Posição', width: 12 },
    { header: 'Produto', width: 32 },
    { header: 'Quantidade', width: 14 },
    { header: 'Total (R$)', width: 16 },
  ];
  dados.ranking.forEach((item, indice) => {
    const linha = produtos.addRow([
      indice + 1,
      item.nome,
      item.quantidade,
      item.total,
    ]);
    linha.getCell(4).numFmt = '#,##0.00';
  });
  produtos.getRow(1).font = { bold: true };

  const conteudo = await livro.xlsx.writeBuffer();
  return Buffer.from(conteudo);
}
