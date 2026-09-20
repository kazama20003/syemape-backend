import { Module } from '@nestjs/common';
import { RolesPersonalController } from './controllers/roles-personal.controller.js';
import { ROL_PERSONAL_REPOSITORY } from './domain/repositories/rol-personal.repository.js';
import { PrismaRolPersonalRepository } from './infrastructure/prisma-rol-personal.repository.js';
import {
  ActualizarRolPersonalUseCase,
  AnularRolPersonalUseCase,
  ListarRolesPersonalUseCase,
  ObtenerRolPersonalUseCase,
  RegistrarRolPersonalUseCase,
} from './use-cases/rol-personal.use-cases.js';

@Module({
  controllers: [RolesPersonalController],
  providers: [
    { provide: ROL_PERSONAL_REPOSITORY, useClass: PrismaRolPersonalRepository },
    RegistrarRolPersonalUseCase,
    ListarRolesPersonalUseCase,
    ObtenerRolPersonalUseCase,
    ActualizarRolPersonalUseCase,
    AnularRolPersonalUseCase,
  ],
  exports: [ROL_PERSONAL_REPOSITORY],
})
export class RolesPersonalModule {}
