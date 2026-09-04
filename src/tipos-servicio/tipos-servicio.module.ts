import { Module } from '@nestjs/common';
import { TIPO_SERVICIO_REPOSITORY } from './domain/repositories/tipo-servicio.repository.js';
import { PrismaTipoServicioRepository } from './infrastructure/prisma-tipo-servicio.repository.js';
import { TiposServicioController } from './controllers/tipos-servicio.controller.js';
import {
  ActualizarTipoServicioUseCase,
  AnularTipoServicioUseCase,
  ListarTiposServicioUseCase,
  ObtenerTipoServicioUseCase,
  RegistrarTipoServicioUseCase,
} from './use-cases/tipo-servicio.use-cases.js';

@Module({
  controllers: [TiposServicioController],
  providers: [
    { provide: TIPO_SERVICIO_REPOSITORY, useClass: PrismaTipoServicioRepository },
    RegistrarTipoServicioUseCase,
    ListarTiposServicioUseCase,
    ObtenerTipoServicioUseCase,
    ActualizarTipoServicioUseCase,
    AnularTipoServicioUseCase,
  ],
  exports: [TIPO_SERVICIO_REPOSITORY],
})
export class TiposServicioModule {}
