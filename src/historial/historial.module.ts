import { Module } from '@nestjs/common';
import { HISTORIAL_REPOSITORY } from './domain/repositories/historial.repository.js';
import { PrismaHistorialRepository } from './infrastructure/prisma-historial.repository.js';
import { HistorialController } from './controllers/historial.controller.js';
import { ListarHistorialUseCase } from './use-cases/historial.use-cases.js';

@Module({
  controllers: [HistorialController],
  providers: [
    { provide: HISTORIAL_REPOSITORY, useClass: PrismaHistorialRepository },
    ListarHistorialUseCase,
  ],
})
export class HistorialModule {}
