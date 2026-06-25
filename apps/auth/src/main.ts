import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- IMPORTANTE

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Ativa a validação automática para todas as rotas do sistema
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove campos extras enviados que não estão no DTO
    forbidNonWhitelisted: true, // Bloqueia a requisição se enviarem campos que não deviam
    transform: true, // Transforma os tipos dos dados automaticamente
  }));
  app.enableCors();
  await app.listen(3001);
  console.log('Serviço de Autenticação rodando em: http://localhost:3001');
}
bootstrap();