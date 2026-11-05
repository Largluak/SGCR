import { Workbook } from 'exceljs';
import { gerarPlanilha, nomeDoArquivo, type DadosPlanilha } from './planilha';

const dados: DadosPlanilha = {
  casa: 'Ardósia',
  periodo: 'semestral',
  rotulo: '2º semestre de 2026',
  totalVendido: 961,
  comandasFechadas: 3,
  produtoMaisVendido: {
    nome: 'Picanha na chapa',
    quantidade: 4,
    total: 356,
  },
  mediaMensal: 160.17,
  melhorMes: { rotulo: 'Out', total: 480 },
  vendasPorMes: [
    { rotulo: 'Jul', total: 0 },
    { rotulo: 'Out', total: 480 },
  ],
  ranking: [
    { nome: 'Picanha na chapa', quantidade: 4, total: 356 },
    { nome: 'Chopp artesanal 500ml', quantidade: 6, total: 96 },
  ],
};

describe('planilha do relatório', () => {
  it('nomeia o arquivo pelo período', () => {
    expect(nomeDoArquivo('mensal', 'outubro de 2026')).toBe(
      'relatorio-mensal-outubro-de-2026.xlsx',
    );
    expect(nomeDoArquivo(dados.periodo, dados.rotulo)).toBe(
      'relatorio-semestral-2-semestre-de-2026.xlsx',
    );
  });

  it('grava resumo, meses e ranking', async () => {
    const conteudo = await gerarPlanilha(dados);
    const livro = new Workbook();
    await livro.xlsx.load(conteudo);

    const resumo = livro.getWorksheet('Resumo');
    const meses = livro.getWorksheet('Vendas por mês');
    const produtos = livro.getWorksheet('Produtos');
    expect(resumo?.getCell('A2').value).toBe('Relatório de vendas');
    expect(resumo?.getCell('A3').value).toBe('Ardósia  ·  2º semestre de 2026');
    expect(resumo?.getCell('A6').value).toBe(961);
    expect(resumo?.getCell('B6').value).toBe(3);
    expect(resumo?.getCell('A9').value).toBe('Picanha na chapa');
    expect(meses?.getCell('A4').value).toBe('Mês');
    expect(meses?.getCell('A6').value).toBe('Out');
    expect(meses?.getCell('B6').value).toBe(480);
    expect(produtos?.getCell('B5').value).toBe('Picanha na chapa');
    expect(produtos?.getCell('C6').value).toBe(6);
    expect(produtos?.getCell('D6').value).toBe(96);
    expect(resumo?.getCell('A2').font?.color?.argb).toBe('FFFFFFFF');
    expect(meses?.getCell('A4').fill).toMatchObject({ fgColor: { argb: 'FFC45C26' } });
  });
});
