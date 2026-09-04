import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter.js';

const CORS_ORIGINS_DEFAULT = ['http://localhost:3000'];

function obtenerCorsOrigins(): string[] {
  const origins = process.env.CORS_ORIGINS;
  if (!origins) {
    return CORS_ORIGINS_DEFAULT;
  }
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT ?? 3020;

  app.enableCors({ origin: obtenerCorsOrigins(), credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(port, '0.0.0.0');

  logger.log(`Backend syemape escuchando en http://localhost:${port}/api`);
}
void bootstrap();
