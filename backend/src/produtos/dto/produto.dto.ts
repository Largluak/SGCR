import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { CategoriaProduto, TipoProduto } from '@prisma/client';

export class SalvarProdutoDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsEnum(CategoriaProduto)
  categoria!: CategoriaProduto;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  preco!: number;

  @IsEnum(TipoProduto)
  tipo!: TipoProduto;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimo?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
