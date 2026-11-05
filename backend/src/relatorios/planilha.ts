import { Workbook, type Worksheet } from 'exceljs';

export type LinhaProduto = {
  nome: string;
  quantidade: number;
  total: number;
};

export type DadosPlanilha = {
  casa: string;
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

const VINHO = 'FF6B2E1A';
const TERRACOTA = 'FFC45C26';
const CREME = 'FFF8F1EA';
const PAPEL = 'FFFFFBF7';
const TEXTO = 'FF2C211C';
const MUTED = 'FF7A655C';
const LINHA = 'FFE6D5C8';
const BRANCO = 'FFFFFFFF';
const REAL = '"R$" #,##0.00';

const borda = {
  top: { style: 'thin' as const, color: { argb: LINHA } },
  left: { style: 'thin' as const, color: { argb: LINHA } },
  bottom: { style: 'thin' as const, color: { argb: LINHA } },
  right: { style: 'thin' as const, color: { argb: LINHA } },
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
  livro.title = `Relatório de vendas · ${dados.casa}`;
  livro.created = new Date();

  montarResumo(livro.addWorksheet('Resumo', { views: [{ showGridLines: false }] }), dados);
  montarMeses(livro.addWorksheet('Vendas por mês', { views: [{ showGridLines: false }] }), dados);
  montarProdutos(livro.addWorksheet('Produtos', { views: [{ showGridLines: false }] }), dados);

  const conteudo = await livro.xlsx.writeBuffer();
  return Buffer.from(conteudo);
}

function montarResumo(planilha: Worksheet, dados: DadosPlanilha) {
  planilha.properties.tabColor = { argb: TERRACOTA };
  planilha.pageSetup = pagina();
  planilha.columns = [
    { width: 28 },
    { width: 22 },
    { width: 22 },
    { width: 24 },
  ];
  faixa(planilha, 1, 1, 4, VINHO);
  faixa(planilha, 2, 1, 4, VINHO);
  faixa(planilha, 3, 1, 4, VINHO);
  planilha.mergeCells('A1:D1');
  planilha.mergeCells('A2:D2');
  planilha.mergeCells('A3:D3');
  planilha.getRow(1).height = 18;
  planilha.getRow(2).height = 28;
  planilha.getRow(3).height = 20;
  escrever(planilha, 'A1', 'SGCR', { cor: CREME, tamanho: 11, negrito: true });
  escrever(planilha, 'A2', 'Relatório de vendas', { cor: BRANCO, tamanho: 22, negrito: true });
  escrever(planilha, 'A3', `${dados.casa}  ·  ${dados.rotulo}`, { cor: 'FFF3D2C4', tamanho: 12 });

  const melhor = dados.melhorMes;
  const rotulos = ['Total vendido', 'Comandas fechadas', 'Média mensal', 'Melhor mês'];
  const valores: Array<string | number> = [
    dados.totalVendido,
    dados.comandasFechadas,
    dados.mediaMensal,
    melhor ? melhor.total : 0,
  ];
  planilha.getRow(5).height = 18;
  planilha.getRow(6).height = 26;
  rotulos.forEach((rotulo, indice) => {
    const coluna = indice + 1;
    const cabecalho = planilha.getCell(5, coluna);
    cabecalho.value = indice === 3 && melhor ? `${rotulo} · ${melhor.rotulo}` : rotulo;
    cabecalho.font = { name: 'Calibri', size: 10, color: { argb: MUTED }, bold: true };
    cabecalho.alignment = { vertical: 'middle' };
    const valor = planilha.getCell(6, coluna);
    valor.value = valores[indice];
    valor.font = { name: 'Calibri', size: 16, color: { argb: TEXTO }, bold: true };
    valor.alignment = { vertical: 'middle' };
    valor.border = { bottom: { style: 'medium', color: { argb: TERRACOTA } } };
    if (indice !== 1) valor.numFmt = REAL;
  });

  planilha.getRow(8).height = 18;
  escrever(planilha, 'A8', 'Produto mais vendido', { cor: MUTED, tamanho: 10, negrito: true });
  const destaque = dados.produtoMaisVendido;
  planilha.mergeCells('A9:B9');
  planilha.getRow(9).height = 24;
  escrever(planilha, 'A9', destaque?.nome ?? 'Sem vendas neste período', {
    cor: TEXTO,
    tamanho: 16,
    negrito: true,
  });
  if (destaque) {
    planilha.getCell('C9').value = destaque.quantidade;
    planilha.getCell('C9').numFmt = '0" un."';
    planilha.getCell('D9').value = destaque.total;
    planilha.getCell('D9').numFmt = REAL;
    for (const endereco of ['C9', 'D9']) {
      const celula = planilha.getCell(endereco);
      celula.font = { name: 'Calibri', size: 14, color: { argb: TEXTO } };
      celula.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  }

  planilha.getRow(11).height = 32;
  planilha.mergeCells('A11:D11');
  escrever(
    planilha,
    'A11',
    'Valores das comandas fechadas no período. O arquivo foi gerado pelo SGCR.',
    { cor: MUTED, tamanho: 10 },
  );
  planilha.getCell('A11').alignment = { vertical: 'middle', wrapText: true };
}

function montarMeses(planilha: Worksheet, dados: DadosPlanilha) {
  planilha.properties.tabColor = { argb: VINHO };
  planilha.pageSetup = pagina();
  planilha.columns = [{ width: 18 }, { width: 22 }];
  titulo(planilha, `${dados.casa}  ·  vendas por mês`, dados.rotulo);
  cabecalho(planilha, 4, ['Mês', 'Total'], 0);
  dados.vendasPorMes.forEach((item, indice) => {
    const linha = planilha.getRow(5 + indice);
    linha.height = 22;
    linha.getCell(1).value = item.rotulo;
    linha.getCell(2).value = item.total;
    linha.getCell(2).numFmt = REAL;
    linha.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };
    pintarLinha(linha, 2, indice);
  });
  const fim = 4 + Math.max(dados.vendasPorMes.length, 1);
  if (dados.vendasPorMes.some((item) => item.total > 0)) {
    planilha.addConditionalFormatting({
      ref: `B5:B${fim}`,
      rules: [
        {
          type: 'dataBar',
          gradient: false,
          showValue: true,
          cfvo: [{ type: 'num', value: 0 }, { type: 'max' }],
          color: { argb: TERRACOTA },
        },
      ],
    });
  }
  planilha.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }];
  planilha.autoFilter = { from: 'A4', to: `B${fim}` };
}

function montarProdutos(planilha: Worksheet, dados: DadosPlanilha) {
  planilha.properties.tabColor = { argb: 'FF8C3A1E' };
  planilha.pageSetup = pagina();
  planilha.columns = [
    { width: 12 },
    { width: 42 },
    { width: 16 },
    { width: 20 },
  ];
  titulo(planilha, `${dados.casa}  ·  produtos mais vendidos`, dados.rotulo);
  cabecalho(planilha, 4, ['Posição', 'Produto', 'Quantidade', 'Total'], 1);
  if (dados.ranking.length === 0) {
    planilha.mergeCells('A5:D5');
    planilha.getRow(5).height = 22;
    escrever(planilha, 'A5', 'Sem vendas neste período', { cor: MUTED, tamanho: 12 });
    planilha.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }];
    return;
  }
  dados.ranking.forEach((item, indice) => {
    const linha = planilha.getRow(5 + indice);
    linha.height = 22;
    linha.getCell(1).value = indice + 1;
    linha.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    linha.getCell(2).value = item.nome;
    linha.getCell(3).value = item.quantidade;
    linha.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    linha.getCell(4).value = item.total;
    linha.getCell(4).numFmt = REAL;
    linha.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
    pintarLinha(linha, 4, indice);
  });
  const fim = 4 + dados.ranking.length;
  planilha.addConditionalFormatting({
    ref: `D5:D${fim}`,
    rules: [
      {
        type: 'dataBar',
        gradient: false,
        showValue: true,
        cfvo: [{ type: 'num', value: 0 }, { type: 'max' }],
        color: { argb: TERRACOTA },
      },
    ],
  });
  planilha.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }];
  planilha.autoFilter = { from: 'A4', to: `D${fim}` };
}

function titulo(planilha: Worksheet, tituloTexto: string, rotulo: string) {
  const colunas = planilha.columnCount;
  faixa(planilha, 1, 1, colunas, VINHO);
  faixa(planilha, 2, 1, colunas, VINHO);
  planilha.mergeCells(1, 1, 1, colunas);
  planilha.mergeCells(2, 1, 2, colunas);
  planilha.getRow(1).height = 26;
  planilha.getRow(2).height = 18;
  escrever(planilha, 'A1', tituloTexto, { cor: BRANCO, tamanho: 16, negrito: true });
  escrever(planilha, 'A2', rotulo, { cor: 'FFF3D2C4', tamanho: 11 });
  planilha.getRow(3).height = 10;
}

function cabecalho(planilha: Worksheet, linha: number, colunas: string[], colunaTexto: number) {
  const row = planilha.getRow(linha);
  row.height = 22;
  colunas.forEach((texto, indice) => {
    const celula = row.getCell(indice + 1);
    celula.value = texto;
    celula.font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRANCO } };
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TERRACOTA } };
    celula.alignment = {
      vertical: 'middle',
      horizontal: indice === colunaTexto ? 'left' : 'center',
    };
    celula.border = {
      bottom: { style: 'thin', color: { argb: VINHO } },
    };
  });
}

function pintarLinha(
  linha: { getCell(col: number): import('exceljs').Cell },
  colunas: number,
  indice: number,
) {
  for (let coluna = 1; coluna <= colunas; coluna += 1) {
    const celula = linha.getCell(coluna);
    celula.font = { name: 'Calibri', size: 12, color: { argb: TEXTO } };
    celula.alignment = {
      vertical: 'middle',
      horizontal: celula.alignment?.horizontal ?? 'left',
    };
    celula.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: indice % 2 === 0 ? PAPEL : CREME },
    };
    celula.border = borda;
  }
}

function faixa(planilha: Worksheet, linha: number, de: number, ate: number, cor: string) {
  for (let coluna = de; coluna <= ate; coluna += 1) {
    planilha.getCell(linha, coluna).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: cor },
    };
  }
}

function escrever(
  planilha: Worksheet,
  endereco: string,
  valor: string,
  estilo: { cor: string; tamanho: number; negrito?: boolean },
) {
  const celula = planilha.getCell(endereco);
  celula.value = valor;
  celula.font = {
    name: 'Calibri',
    size: estilo.tamanho,
    bold: estilo.negrito ?? false,
    color: { argb: estilo.cor },
  };
  celula.alignment = { vertical: 'middle', horizontal: 'left' };
}

function pagina() {
  return {
    paperSize: 9,
    orientation: 'landscape' as const,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.2, footer: 0.2 },
  };
}
