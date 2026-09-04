import { Module } from '@nestjs/common';
import { UNIDAD_REPOSITORY } from './domain/repositories/unidad.repository.js';
import { PrismaUnidadRepository } from './infrastructure/prisma-unidad.repository.js';
import { UnidadesController } from './controllers/unidades.controller.js';
import {
  ActualizarUnidadUseCase,
  AnularUnidadUseCase,
  ListarUnidadesUseCase,
  ObtenerUnidadUseCase,
  RegistrarUnidadUseCase,
} from './use-cases/unidad.use-cases.js';

@Module({
  controllers: [UnidadesController],
  providers: [
    { provide: UNIDAD_REPOSITORY, useClass: PrismaUnidadRepository },
    RegistrarUnidadUseCase,
    ListarUnidadesUseCase,
    ObtenerUnidadUseCase,
    ActualizarUnidadUseCase,
    AnularUnidadUseCase,
  ],
  exports: [UNIDAD_REPOSITORY],
})
export class UnidadesModule {}
