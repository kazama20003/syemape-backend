import { Module } from '@nestjs/common';
import { PERSONAL_REPOSITORY } from './domain/repositories/personal.repository.js';
import { PrismaPersonalRepository } from './infrastructure/prisma-personal.repository.js';
import { PersonalController } from './controllers/personal.controller.js';
import { RolesPersonalModule } from '../roles-personal/roles-personal.module.js';
import {
  ActualizarPersonalUseCase,
  AnularPersonalUseCase,
  ListarPersonalUseCase,
  ObtenerPersonalUseCase,
  RegistrarPersonalUseCase,
} from './use-cases/personal.use-cases.js';

@Module({
  imports: [RolesPersonalModule],
  controllers: [PersonalController],
  providers: [
    { provide: PERSONAL_REPOSITORY, useClass: PrismaPersonalRepository },
    RegistrarPersonalUseCase,
    ListarPersonalUseCase,
    ObtenerPersonalUseCase,
    ActualizarPersonalUseCase,
    AnularPersonalUseCase,
  ],
  exports: [PERSONAL_REPOSITORY],
})
export class PersonalModule {}
