import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

export async function createNestApp(expressAdapter?: any) {
  const app = expressAdapter
    ? await NestFactory.create<NestExpressApplication>(AppModule, expressAdapter)
    : await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://space-defenders.vercel.app',
      /\.vercel\.app$/,
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Space Defenders - Auth Service')
    .setDescription('Documentação da API do microsserviço de autenticação')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  return app;
}

async function bootstrap() {
  const app = await createNestApp();
  await app.listen(process.env.PORT || 3001);
  console.log('Serviço de Autenticação rodando em: http://localhost:3001');
  console.log('Documentação Swagger em: http://localhost:3001/docs');
}

if (require.main === module) {
  bootstrap();
}