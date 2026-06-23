import { IsEmail, IsNotEmpty, IsOptional,ValidateIf,  IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MinLength(3, { message: 'O nome deve ter pelo menos 3 caracteres.' })
  name!: string;

  @IsEmail({}, { message: 'O formato do e-mail é inválido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email!: string;

  @ValidateIf((dto) => dto.provider === 'local')
  @IsString()
  password?: string;

  @IsString({ message: 'O provider deve ser um texto.' })
  @IsNotEmpty({ message: 'O provider é obrigatório.' })
  provider!: string; // <-- Mudamos de '?' para '!' e adicionamos o @IsNotEmpty
}