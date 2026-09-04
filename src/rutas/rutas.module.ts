import { Module } from '@nestjs/common';
import { RUTA_REPOSITORY } from './domain/repositories/ruta.repository.js';
import { PrismaRutaRepository } from './infrastructure/prisma-ruta.repository.js';
import { RutasController } from './controllers/rutas.controller.js';
import {
  ActualizarRutaUseCase,
  AnularRutaUseCase,
  ListarRutasUseCase,
  ObtenerRutaUseCase,
  RegistrarRutaUseCase,
} from './use-cases/ruta.use-cases.js';

@Module({
  controllers: [RutasController],
  providers: [
    { provide: RUTA_REPOSITORY, useClass: PrismaRutaRepository },
    RegistrarRutaUseCase,
    ListarRutasUseCase,
    ObtenerRutaUseCase,
    ActualizarRutaUseCase,
    AnularRutaUseCase,
  ],
  exports: [RUTA_REPOSITORY],
})
export class RutasModule {}
