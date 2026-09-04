import { Module } from '@nestjs/common';
import { SEGUIMIENTO_REPOSITORY } from './domain/seguimiento.repository.js';
import { PrismaSeguimientoRepository } from './infrastructure/prisma-seguimiento.repository.js';
import { SeguimientoController } from './controllers/seguimiento.controller.js';
import {
  ListarSeguimientosUseCase,
  RegistrarSeguimientoUseCase,
} from './use-cases/seguimiento.use-cases.js';

@Module({
  controllers: [SeguimientoController],
  providers: [
    { provide: SEGUIMIENTO_REPOSITORY, useClass: PrismaSeguimientoRepository },
    RegistrarSeguimientoUseCase,
    ListarSeguimientosUseCase,
  ],
})
export class SeguimientoModule {}
