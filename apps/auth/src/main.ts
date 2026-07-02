import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativa a validação automática para todas as rotas do sistema
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove campos extras enviados que não estão no DTO
    forbidNonWhitelisted: true, // Bloqueia a requisição se enviarem campos que não deviam
    transform: true, // Transforma os tipos dos dados automaticamente
  }));
  app.enableCors();

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Space Defenders - Auth Service')
    .setDescription('Documentação da API do microsserviço de autenticação')
    .setVersion('1.0')
    .addBearerAuth() // habilita o botão "Authorize" pra testar rotas com JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // disponível em /docs

  await app.listen(3001);
  console.log('Serviço de Autenticação rodando em: http://localhost:3001');
  console.log('Documentação Swagger em: http://localhost:3001/docs');
}
bootstrap();