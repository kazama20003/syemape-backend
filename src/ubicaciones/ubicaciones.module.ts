import { Module } from '@nestjs/common';
import { UBICACION_REPOSITORY } from './domain/repositories/ubicacion.repository.js';
import { PrismaUbicacionRepository } from './infrastructure/prisma-ubicacion.repository.js';
import { UbicacionesController } from './controllers/ubicaciones.controller.js';
import {
  ActualizarUbicacionUseCase,
  AnularUbicacionUseCase,
  ListarUbicacionesUseCase,
  ObtenerUbicacionUseCase,
  RegistrarUbicacionUseCase,
} from './use-cases/ubicacion.use-cases.js';

@Module({
  controllers: [UbicacionesController],
  providers: [
    { provide: UBICACION_REPOSITORY, useClass: PrismaUbicacionRepository },
    RegistrarUbicacionUseCase,
    ListarUbicacionesUseCase,
    ObtenerUbicacionUseCase,
    ActualizarUbicacionUseCase,
    AnularUbicacionUseCase,
  ],
  exports: [UBICACION_REPOSITORY],
})
export class UbicacionesModule {}
