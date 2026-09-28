import { Module } from '@nestjs/common';
import { UnidadesModule } from '../unidades/unidades.module.js';
import { PersonalModule } from '../personal/personal.module.js';
import { RutasModule } from '../rutas/rutas.module.js';
import { ClientesModule } from '../clientes/clientes.module.js';
import { TiposServicioModule } from '../tipos-servicio/tipos-servicio.module.js';
import { UbicacionesModule } from '../ubicaciones/ubicaciones.module.js';
import { RolesPersonalModule } from '../roles-personal/roles-personal.module.js';
import { CuentasModule } from '../cuentas/cuentas.module.js';
import { ProyectosModule } from '../proyectos/proyectos.module.js';
import { MANIFIESTO_REPOSITORY } from './domain/repositories/manifiesto.repository.js';
import { PrismaManifiestoRepository } from './infrastructure/prisma-manifiesto.repository.js';
import { ManifiestoPdfGenerator } from './infrastructure/manifiesto-pdf.generator.js';
import { ManifiestosController } from './controllers/manifiestos.controller.js';
import {
  AnularManifiestoUseCase,
  CambiarEstadoManifiestoUseCase,
  DescargarManifiestoPdfUseCase,
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
    RolesPersonalModule,
    CuentasModule,
    ProyectosModule,
  ],
  controllers: [ManifiestosController],
  providers: [
    { provide: MANIFIESTO_REPOSITORY, useClass: PrismaManifiestoRepository },
    ManifiestoPdfGenerator,
    RegistrarManifiestoUseCase,
    ListarManifiestosUseCase,
    ObtenerManifiestoUseCase,
    DescargarManifiestoPdfUseCase,
    CambiarEstadoManifiestoUseCase,
    AnularManifiestoUseCase,
  ],
})
export class ManifiestosModule {}
