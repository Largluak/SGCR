import { BadRequestException, Injectable } from '@nestjs/common';
import { access, mkdir, readdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { COR_PADRAO, normalizarHex } from './cor';
import { AtualizarRestauranteDto } from './dto/atualizar-restaurante.dto';

const ID = 'principal';
const PASTA = path.join(process.cwd(), 'data', 'marca');
const TIPOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const LIMITE = 2 * 1024 * 1024;

export type FotoEnviada = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

export type RestaurantePublico = {
  nome: string;
  corSecundaria: string;
  fotoUrl: string | null;
  atualizadoEm: string;
};

@Injectable()
export class RestauranteService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(): Promise<RestaurantePublico> {
    const registro = await this.garantir();
    return this.apresentar(registro);
  }

  async atualizar(dto: AtualizarRestauranteDto): Promise<RestaurantePublico> {
    const cor = normalizarHex(dto.corSecundaria);
    if (!cor) {
      throw new BadRequestException('Escolha uma cor no formato #RRGGBB.');
    }
    await this.garantir();
    const registro = await this.prisma.restaurante.update({
      where: { id: ID },
      data: { nome: dto.nome.trim(), corSecundaria: cor },
    });
    return this.apresentar(registro);
  }

  async salvarFoto(arquivo?: FotoEnviada): Promise<RestaurantePublico> {
    if (!arquivo?.buffer?.length) {
      throw new BadRequestException(
        'Escolha uma imagem para a foto do restaurante.',
      );
    }
    const extensao = TIPOS[arquivo.mimetype];
    if (!extensao) {
      throw new BadRequestException('Envie uma imagem JPG, PNG ou WebP.');
    }
    if (arquivo.size > LIMITE) {
      throw new BadRequestException('A foto precisa ter no máximo 2 MB.');
    }
    await this.garantir();
    await mkdir(PASTA, { recursive: true });
    await this.limparArquivos();
    const nome = `foto${extensao}`;
    await writeFile(path.join(PASTA, nome), arquivo.buffer);
    const registro = await this.prisma.restaurante.update({
      where: { id: ID },
      data: { fotoArquivo: nome },
    });
    return this.apresentar(registro);
  }

  async removerFoto(): Promise<RestaurantePublico> {
    await this.garantir();
    await this.limparArquivos();
    const registro = await this.prisma.restaurante.update({
      where: { id: ID },
      data: { fotoArquivo: null },
    });
    return this.apresentar(registro);
  }

  async lerFoto(): Promise<{
    caminho: string;
    tipo: string;
    nome: string;
  } | null> {
    const registro = await this.prisma.restaurante.findUnique({
      where: { id: ID },
    });
    if (!registro?.fotoArquivo) return null;
    const nome = path.basename(registro.fotoArquivo);
    const tipo = MIME[path.extname(nome).toLowerCase()];
    if (!tipo || !/^foto\.(jpg|jpeg|png|webp)$/.test(nome)) return null;
    const caminho = path.join(PASTA, nome);
    try {
      await access(caminho);
    } catch {
      return null;
    }
    return { caminho, tipo, nome };
  }

  private async garantir() {
    return this.prisma.restaurante.upsert({
      where: { id: ID },
      update: {},
      create: { id: ID, nome: 'Ardósia', corSecundaria: COR_PADRAO },
    });
  }

  private apresentar(registro: {
    nome: string;
    corSecundaria: string;
    fotoArquivo: string | null;
    atualizadoEm: Date;
  }): RestaurantePublico {
    return {
      nome: registro.nome,
      corSecundaria: registro.corSecundaria,
      fotoUrl: registro.fotoArquivo ? '/restaurante/foto' : null,
      atualizadoEm: registro.atualizadoEm.toISOString(),
    };
  }

  private async limparArquivos() {
    let nomes: string[] = [];
    try {
      nomes = await readdir(PASTA);
    } catch {
      return;
    }
    await Promise.all(
      nomes
        .filter((nome) => /^foto\.(jpg|jpeg|png|webp)$/.test(nome))
        .map((nome) => rm(path.join(PASTA, nome), { force: true })),
    );
  }
}
