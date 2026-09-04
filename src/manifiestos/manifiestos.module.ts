import { Module } from '@nestjs/common';
import { UnidadesModule } from '../unidades/unidades.module.js';
import { PersonalModule } from '../personal/personal.module.js';
import { RutasModule } from '../rutas/rutas.module.js';
import { ClientesModule } from '../clientes/clientes.module.js';
import { TiposServicioModule } from '../tipos-servicio/tipos-servicio.module.js';
import { UbicacionesModule } from '../ubicaciones/ubicaciones.module.js';
import { MANIFIESTO_REPOSITORY } from './domain/repositories/manifiesto.repository.js';
import { PrismaManifiestoRepository } from './infrastructure/prisma-manifiesto.repository.js';
import { ManifiestosController } from './controllers/manifiestos.controller.js';
import {
  AnularManifiestoUseCase,
  CambiarEstadoManifiestoUseCase,
  ListarManifiestosUseCase,
  ObtenerManifiestoUseCase,
  RegistrarManifiestoUseCase,
} from './use-cases/manifiesto.use-cases.js';

// Importa los demas contextos para reusar sus repositorios (validar que la
// unidad, conductor, supervisor, cliente, ruta, tipo de servicio y ubicaciones
// existen y estan activos).
@Module({
  imports: [
    UnidadesModule,
    PersonalModule,
    RutasModule,
    ClientesModule,
    TiposServicioModule,
    UbicacionesModule,
  ],
  controllers: [ManifiestosController],
  providers: [
    { provide: MANIFIESTO_REPOSITORY, useClass: PrismaManifiestoRepository },
    RegistrarManifiestoUseCase,
    ListarManifiestosUseCase,
    ObtenerManifiestoUseCase,
    CambiarEstadoManifiestoUseCase,
    AnularManifiestoUseCase,
  ],
})
export class ManifiestosModule {}
