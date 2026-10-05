import { Controller, Get, Query } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { Roles } from '../common/roles.decorator';
import { RelatorioQueryDto } from './dto/relatorio.dto';
import { RelatoriosService } from './relatorios.service';

@Roles(Perfil.GERENTE)
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
}
