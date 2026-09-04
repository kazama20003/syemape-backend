import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UnidadesModule } from './unidades/unidades.module.js';
import { PersonalModule } from './personal/personal.module.js';
import { RutasModule } from './rutas/rutas.module.js';
import { ClientesModule } from './clientes/clientes.module.js';
import { UbicacionesModule } from './ubicaciones/ubicaciones.module.js';
import { TiposServicioModule } from './tipos-servicio/tipos-servicio.module.js';
import { ManifiestosModule } from './manifiestos/manifiestos.module.js';
import { HistorialModule } from './historial/historial.module.js';
import { SeguimientoModule } from './seguimiento/seguimiento.module.js';
import { IncidenciasModule } from './incidencias/incidencias.module.js';
import { DocumentosModule } from './documentos/documentos.module.js';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    UnidadesModule,
    PersonalModule,
    RutasModule,
    ClientesModule,
    UbicacionesModule,
    TiposServicioModule,
    ManifiestosModule,
    HistorialModule,
    SeguimientoModule,
    IncidenciasModule,
    DocumentosModule,
  ],
})
export class AppModule {}
