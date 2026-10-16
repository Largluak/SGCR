import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AtualizarRestauranteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nome!: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Escolha uma cor no formato #RRGGBB.',
  })
  corSecundaria!: string;
}
