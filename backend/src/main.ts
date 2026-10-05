import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origens = (
    process.env.FRONTEND_ORIGIN ?? 'http://localhost:4310,http://127.0.0.1:4310'
  )
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);
  app.enableCors({ origin: origens });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const porta = Number(process.env.PORT ?? 4311);
  await app.listen(porta, '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
