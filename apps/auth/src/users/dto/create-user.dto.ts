import { IsEmail, IsNotEmpty, IsOptional, ValidateIf, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário', minLength: 3 })
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MinLength(3, { message: 'O nome deve ter pelo menos 3 caracteres.' })
  name!: string;

  @ApiProperty({ example: 'usuario@email.com', description: 'E-mail do usuário' })
  @IsEmail({}, { message: 'O formato do e-mail é inválido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email!: string;

  @ApiProperty({
    example: 'senha123',
    description: 'Senha do usuário (obrigatória apenas para provider local)',
    required: false,
  })
  @ValidateIf((dto) => dto.provider === 'local')
  @IsString()
  password?: string;

  @ApiProperty({
    example: 'local',
    description: 'Provedor de autenticação (local, google, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O provider deve ser um texto.' })
  provider?: string;
}