import { Module } from '@nestjs/common';
import { PERSONAL_REPOSITORY } from './domain/repositories/personal.repository.js';
import { PrismaPersonalRepository } from './infrastructure/prisma-personal.repository.js';
import { PersonalController } from './controllers/personal.controller.js';
import { PersonalPublicoController } from './controllers/personal-publico.controller.js';
import { RolesPersonalModule } from '../roles-personal/roles-personal.module.js';
import {
  ActualizarPersonalUseCase,
  AnularPersonalUseCase,
  ListarPersonalUseCase,
  ObtenerPersonalUseCase,
  RegistrarPersonalUseCase,
} from './use-cases/personal.use-cases.js';
import { SincronizarPersonalUseCase } from './use-cases/sincronizar-personal.use-case.js';

@Module({
  imports: [RolesPersonalModule],
  controllers: [PersonalController, PersonalPublicoController],
  providers: [
    { provide: PERSONAL_REPOSITORY, useClass: PrismaPersonalRepository },
    RegistrarPersonalUseCase,
    ListarPersonalUseCase,
    ObtenerPersonalUseCase,
    ActualizarPersonalUseCase,
    AnularPersonalUseCase,
    SincronizarPersonalUseCase,
  ],
  exports: [PERSONAL_REPOSITORY],
})
export class PersonalModule {}
