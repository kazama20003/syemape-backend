import { Module } from '@nestjs/common';
import { INCIDENCIA_REPOSITORY } from './domain/incidencia.repository.js';
import { PrismaIncidenciaRepository } from './infrastructure/prisma-incidencia.repository.js';
import { IncidenciasController } from './controllers/incidencias.controller.js';
import {
  ActualizarIncidenciaUseCase,
  AgregarEvidenciaUseCase,
  ListarIncidenciasUseCase,
  ObtenerIncidenciaUseCase,
  ReportarIncidenciaUseCase,
} from './use-cases/incidencia.use-cases.js';

@Module({
  controllers: [IncidenciasController],
  providers: [
    { provide: INCIDENCIA_REPOSITORY, useClass: PrismaIncidenciaRepository },
    ReportarIncidenciaUseCase,
    ActualizarIncidenciaUseCase,
    AgregarEvidenciaUseCase,
    ObtenerIncidenciaUseCase,
    ListarIncidenciasUseCase,
  ],
})
export class IncidenciasModule {}
