import { Module } from '@nestjs/common';
import { CuentasModule } from '../cuentas/cuentas.module.js';
import { ProyectosController } from './controllers/proyectos.controller.js';
import { PROYECTO_REPOSITORY } from './domain/repositories/proyecto.repository.js';
import { PrismaProyectoRepository } from './infrastructure/prisma-proyecto.repository.js';
import { ActualizarProyectoUseCase, AnularProyectoUseCase, ListarProyectosUseCase, ObtenerProyectoUseCase, RegistrarProyectoUseCase } from './use-cases/proyecto.use-cases.js';
@Module({ imports: [CuentasModule], controllers: [ProyectosController], providers: [{ provide: PROYECTO_REPOSITORY, useClass: PrismaProyectoRepository }, RegistrarProyectoUseCase, ListarProyectosUseCase, ObtenerProyectoUseCase, ActualizarProyectoUseCase, AnularProyectoUseCase], exports: [PROYECTO_REPOSITORY] }) export class ProyectosModule {}
