import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { access, mkdir, readFile, readdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import { casaAtual } from '../common/casa';
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
      where: { id: this.idDaCasa() },
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
    const nome = `foto${extensao}`;
    const id = this.idDaCasa();
    const registro = await this.prisma.restaurante.update({
      where: { id },
      data: {
        fotoArquivo: nome,
        fotoMime: arquivo.mimetype,
        fotoDados: new Uint8Array(arquivo.buffer),
      },
    });
    await this.gravarCopiaLocal(id, nome, arquivo.buffer);
    return this.apresentar(registro);
  }

  async removerFoto(): Promise<RestaurantePublico> {
    const id = this.idDaCasa();
    await this.garantir();
    await this.limparArquivos(id);
    const registro = await this.prisma.restaurante.update({
      where: { id },
      data: { fotoArquivo: null, fotoMime: null, fotoDados: null },
    });
    return this.apresentar(registro);
  }

  async lerFoto(id = this.idDaCasa()): Promise<{
    conteudo: Buffer;
    tipo: string;
    nome: string;
  } | null> {
    const registro = await this.prisma.restaurante.findUnique({
      where: { id },
    });
    if (!registro) return null;
    if (registro.fotoDados && registro.fotoMime && TIPOS[registro.fotoMime]) {
      return {
        conteudo: Buffer.from(registro.fotoDados),
        tipo: registro.fotoMime,
        nome: `foto${TIPOS[registro.fotoMime]}`,
      };
    }
    if (!registro.fotoArquivo) return null;
    const nome = path.basename(registro.fotoArquivo);
    const tipo = MIME[path.extname(nome).toLowerCase()];
    if (!tipo || !/^foto\.(jpg|jpeg|png|webp)$/.test(nome)) return null;
    const candidatos = [path.join(this.pasta(id), nome)];
    if (id === ID) candidatos.push(path.join(PASTA, nome));
    for (const caminho of candidatos) {
      try {
        await access(caminho);
        return { conteudo: await readFile(caminho), tipo, nome };
      } catch {
        continue;
      }
    }
    return null;
  }

  private idDaCasa() {
    return casaAtual() ?? ID;
  }

  private pasta(id: string) {
    return path.join(PASTA, id);
  }

  private async garantir() {
    const id = this.idDaCasa();
    const existente = await this.prisma.restaurante.findUnique({
      where: { id },
    });
    if (existente) return existente;
    if (id !== ID) {
      throw new NotFoundException('Restaurante não encontrado.');
    }
    return this.prisma.restaurante.create({
      data: { id: ID, nome: 'Ardósia', corSecundaria: COR_PADRAO },
    });
  }

  private apresentar(registro: {
    id: string;
    nome: string;
    corSecundaria: string;
    fotoArquivo: string | null;
    fotoMime: string | null;
    fotoDados: Uint8Array | null;
    atualizadoEm: Date;
  }): RestaurantePublico {
    const temFoto = Boolean(
      (registro.fotoDados?.byteLength && registro.fotoMime) ||
      registro.fotoArquivo,
    );
    return {
      nome: registro.nome,
      corSecundaria: registro.corSecundaria,
      fotoUrl: temFoto ? `/restaurante/foto/${registro.id}` : null,
      atualizadoEm: registro.atualizadoEm.toISOString(),
    };
  }

  private async gravarCopiaLocal(id: string, nome: string, conteudo: Buffer) {
    const pasta = this.pasta(id);
    try {
      await mkdir(pasta, { recursive: true });
      await this.limparArquivos(id);
      await writeFile(path.join(pasta, nome), conteudo);
    } catch {
      // Na Vercel o disco não guarda arquivo entre requisições.
      // A cópia que vale é a gravada no banco.
    }
  }

  private async limparArquivos(id: string) {
    let nomes: string[] = [];
    try {
      nomes = await readdir(this.pasta(id));
    } catch {
      return;
    }
    await Promise.all(
      nomes
        .filter((nome) => /^foto\.(jpg|jpeg|png|webp)$/.test(nome))
        .map((nome) => rm(path.join(this.pasta(id), nome), { force: true })),
    );
  }
}
