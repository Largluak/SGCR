import {
  ArgumentsHost,
  Body,
  Catch,
  Controller,
  Delete,
  ExceptionFilter,
  Get,
  NotFoundException,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { Perfil } from '@prisma/client';
import { createReadStream } from 'fs';
import { Public } from '../common/public.decorator';
import { Roles } from '../common/roles.decorator';
import { AtualizarRestauranteDto } from './dto/atualizar-restaurante.dto';
import type { FotoEnviada } from './restaurante.service';
import { RestauranteService } from './restaurante.service';

@Catch(MulterError)
class FotoLimiteFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const grande = exception.code === 'LIMIT_FILE_SIZE';
    response.status(400).json({
      message: grande
        ? 'A foto precisa ter no máximo 2 MB.'
        : 'Não foi possível enviar a foto.',
    });
  }
}

@Controller('restaurante')
@UseFilters(FotoLimiteFilter)
export class RestauranteController {
  constructor(private readonly restaurante: RestauranteService) {}

  @Public()
  @Get()
  obter() {
    return this.restaurante.obter();
  }

  @Roles(Perfil.GERENTE)
  @Patch()
  atualizar(@Body() dto: AtualizarRestauranteDto) {
    return this.restaurante.atualizar(dto);
  }

  @Roles(Perfil.GERENTE)
  @Post('foto')
  @UseInterceptors(
    FileInterceptor('foto', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  enviarFoto(@UploadedFile() arquivo?: FotoEnviada) {
    return this.restaurante.salvarFoto(arquivo);
  }

  @Roles(Perfil.GERENTE)
  @Delete('foto')
  removerFoto() {
    return this.restaurante.removerFoto();
  }

  @Public()
  @Get('foto')
  async foto(): Promise<StreamableFile> {
    const arquivo = await this.restaurante.lerFoto();
    if (!arquivo) {
      throw new NotFoundException('O restaurante ainda não tem foto.');
    }
    return new StreamableFile(createReadStream(arquivo.caminho), {
      type: arquivo.tipo,
      disposition: `inline; filename="${arquivo.nome}"`,
    });
  }
}
