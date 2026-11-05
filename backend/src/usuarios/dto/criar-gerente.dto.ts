import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CriarGerenteDto {
  @IsString()
  @MinLength(2, { message: 'Informe o nome do gerente.' })
  @MaxLength(80)
  nome!: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @MaxLength(120)
  email!: string;

  @IsString()
  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' })
  @MaxLength(72)
  senha!: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Escolha o restaurante do gerente.' })
  restauranteId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Informe o nome do restaurante.' })
  @MaxLength(80)
  restauranteNome?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'A casa nova precisa de pelo menos uma mesa.' })
  @Max(40, { message: 'Cadastre no máximo 40 mesas de uma vez.' })
  mesas?: number;
}
