import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class EntradaEstoqueDto {
  @IsString()
  produtoId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantidade!: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}

export class AjusteEstoqueDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantidade!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimo?: number;
}
