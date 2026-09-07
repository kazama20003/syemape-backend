import { Module } from '@nestjs/common';
import { UNIDAD_REPOSITORY } from './domain/repositories/unidad.repository.js';
import { PrismaUnidadRepository } from './infrastructure/prisma-unidad.repository.js';
import { UnidadesController } from './controllers/unidades.controller.js';
import { UnidadesOperacionController } from './controllers/unidades-operacion.controller.js';
import { UNIDAD_OPERACION_REPOSITORY } from './domain/repositories/unidad-operacion.repository.js';
import { PrismaUnidadOperacionRepository } from './infrastructure/prisma-unidad-operacion.repository.js';
import {
  AsignarGpsUnidadUseCase,
  LiberarGpsUnidadUseCase,
  ListarAsignacionesGpsUnidadUseCase,
  ListarLecturasKilometrajeUnidadUseCase,
  RegistrarLecturaKilometrajeUnidadUseCase,
} from './use-cases/unidad-operacion.use-cases.js';
import {
  ActualizarUnidadUseCase,
  AnularUnidadUseCase,
  ListarUnidadesUseCase,
  ObtenerUnidadUseCase,
  RegistrarUnidadUseCase,
} from './use-cases/unidad.use-cases.js';

@Module({
  controllers: [UnidadesController, UnidadesOperacionController],
  providers: [
    { provide: UNIDAD_REPOSITORY, useClass: PrismaUnidadRepository },
    {
      provide: UNIDAD_OPERACION_REPOSITORY,
      useClass: PrismaUnidadOperacionRepository,
    },
    RegistrarUnidadUseCase,
    ListarUnidadesUseCase,
    ObtenerUnidadUseCase,
    ActualizarUnidadUseCase,
    AnularUnidadUseCase,
    ListarAsignacionesGpsUnidadUseCase,
    AsignarGpsUnidadUseCase,
    LiberarGpsUnidadUseCase,
    ListarLecturasKilometrajeUnidadUseCase,
    RegistrarLecturaKilometrajeUnidadUseCase,
  ],
  exports: [UNIDAD_REPOSITORY],
})
export class UnidadesModule {}
