import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// O PartialType herda todas as regras do CreateUserDto, mas torna todos os campos opcionais (?)
export class UpdateUserDto extends PartialType(CreateUserDto) {}