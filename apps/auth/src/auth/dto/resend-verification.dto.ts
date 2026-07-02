import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'E-mail para reenvio do link de verificação',
  })
  @IsEmail()
  email!: string;
}