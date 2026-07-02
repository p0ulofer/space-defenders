import { ApiProperty } from '@nestjs/swagger';

export class GoogleUserDto {
  @ApiProperty({ example: 'google', description: 'Provedor de autenticação' })
  provider!: string;

  @ApiProperty({ example: '1234567890', description: 'ID do usuário no provedor' })
  providerId!: string;

  @ApiProperty({ example: 'usuario@gmail.com', description: 'E-mail do usuário' })
  email!: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome do usuário' })
  name!: string;

  @ApiProperty({ example: 'https://lh3.googleusercontent.com/...', description: 'URL da foto de perfil' })
  picture!: string;
}