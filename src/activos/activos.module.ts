import { Module } from '@nestjs/common';
import { ActivosController } from './controllers/activos.controller.js';
import { ACTIVO_REPOSITORY } from './domain/repositories/activo.repository.js';
import { PrismaActivoRepository } from './infrastructure/prisma-activo.repository.js';
import {
  ActualizarActivoUseCase,
  AnularActivoUseCase,
  ListarActivosUseCase,
  ObtenerActivoUseCase,
  RegistrarActivoUseCase,
} from './use-cases/activo.use-cases.js';

@Module({
  controllers: [ActivosController],
  providers: [
    { provide: ACTIVO_REPOSITORY, useClass: PrismaActivoRepository },
    RegistrarActivoUseCase,
    ListarActivosUseCase,
    ObtenerActivoUseCase,
    ActualizarActivoUseCase,
    AnularActivoUseCase,
  ],
  exports: [ACTIVO_REPOSITORY],
})
export class ActivosModule {}
