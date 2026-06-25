import { IsInt, IsPositive } from 'class-validator';

export class CreateScoreDto {
  @IsInt({ message: 'A pontuação deve ser um número inteiro.' })
  @IsPositive({ message: 'A pontuação deve ser maior que zero.' })
  score!: number;

  @IsInt({ message: 'A wave deve ser um número inteiro.' })
  @IsPositive({ message: 'A wave deve ser maior que zero.' })
  wave!: number;
}
