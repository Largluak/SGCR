import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { PeriodoRelatorio } from '../periodo';

export class RelatorioQueryDto {
  @IsIn(['mensal', 'trimestral', 'semestral'])
  periodo!: PeriodoRelatorio;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ano?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  trimestre?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  semestre?: number;
}
