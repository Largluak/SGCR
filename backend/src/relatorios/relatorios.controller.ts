import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { PAPEIS_GESTAO } from '../common/perfis';
import { Roles } from '../common/roles.decorator';
import { RelatorioQueryDto } from './dto/relatorio.dto';
import { gerarPlanilha, nomeDoArquivo } from './planilha';
import { RelatoriosService } from './relatorios.service';

@Roles(...PAPEIS_GESTAO)
@Controller()
export class RelatoriosController {
  constructor(private readonly relatorios: RelatoriosService) {}

  @Get('dashboard')
  dashboard() {
    return this.relatorios.dashboard();
  }

  @Get('relatorios')
  relatorio(@Query() query: RelatorioQueryDto) {
    return this.relatorios.relatorio(query);
  }

  @Get('relatorios/excel')
  async excel(@Query() query: RelatorioQueryDto) {
    const dados = await this.relatorios.relatorio(query);
    const conteudo = await gerarPlanilha(dados);
    return new StreamableFile(conteudo, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${nomeDoArquivo(dados.periodo, dados.rotulo)}"`,
    });
  }
}
