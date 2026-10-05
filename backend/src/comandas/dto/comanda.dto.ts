import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FormaPagamento } from '@prisma/client';

export class AbrirComandaDto {
  @IsString()
  mesaId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pessoas!: number;
}

export class AddItemDto {
  @IsString()
  produtoId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade!: number;
}

export class AtualizarItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantidade!: number;
}

export class PagarDto {
  @IsEnum(FormaPagamento)
  forma!: FormaPagamento;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pessoas?: number;
}
