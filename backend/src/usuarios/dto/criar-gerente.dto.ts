import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

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

  @IsString()
  @MinLength(1, { message: 'Escolha o restaurante do gerente.' })
  restauranteId!: string;
}
