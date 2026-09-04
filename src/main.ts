import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter.js';

// En desarrollo se acepta cualquier puerto de localhost (el front cambia de
// puerto segun que mas este corriendo). En despliegue, CORS_ORIGINS manda.
const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function obtenerCorsOrigins(): (string | RegExp)[] {
  const origins = process.env.CORS_ORIGINS;
  if (!origins) {
    return [LOCALHOST];
  }
  const lista: (string | RegExp)[] = origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  lista.push(LOCALHOST);
  return lista;
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
