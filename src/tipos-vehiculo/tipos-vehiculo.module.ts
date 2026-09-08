import { Module } from '@nestjs/common';
import { TIPO_VEHICULO_REPOSITORY } from './domain/repositories/tipo-vehiculo.repository.js';
import { PrismaTipoVehiculoRepository } from './infrastructure/prisma-tipo-vehiculo.repository.js';
import { TiposVehiculoController } from './controllers/tipos-vehiculo.controller.js';
import {
  ActualizarTipoVehiculoUseCase,
  AnularTipoVehiculoUseCase,
  ListarTiposVehiculoUseCase,
  ObtenerTipoVehiculoUseCase,
  RegistrarTipoVehiculoUseCase,
} from './use-cases/tipo-vehiculo.use-cases.js';

@Module({
  controllers: [TiposVehiculoController],
  providers: [
    { provide: TIPO_VEHICULO_REPOSITORY, useClass: PrismaTipoVehiculoRepository },
    RegistrarTipoVehiculoUseCase,
    ListarTiposVehiculoUseCase,
    ObtenerTipoVehiculoUseCase,
    ActualizarTipoVehiculoUseCase,
    AnularTipoVehiculoUseCase,
  ],
  exports: [TIPO_VEHICULO_REPOSITORY],
})
export class TiposVehiculoModule {}
