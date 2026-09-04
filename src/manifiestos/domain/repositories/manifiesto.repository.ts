import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { TipoPersonal } from '../../../personal/domain/value-objects/tipo-personal.enum.js';
import { EstadoManifiesto } from '../value-objects/estado-manifiesto.enum.js';
import {
  EstadoCarga,
  NivelCombustible,
  UnidadMedida,
  Viaticos,
} from '../value-objects/servicio.enums.js';

export const MANIFIESTO_REPOSITORY = Symbol('MANIFIESTO_REPOSITORY');

export interface ResumenUnidad {
  id: number;
  publicId: string;
  placa: string;
  clase: string;
}

export interface ResumenPersonal {
  id: number;
  publicId: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  apelativo?: string | null;
}

export interface ResumenRuta {
  id: number;
  publicId: string;
  nombre: string;
  origen: string;
  destino: string;
}

export interface ResumenCliente {
  id: number;
  publicId: string;
  razonSocial: string;
}

export interface ResumenTipoServicio {
  id: number;
  publicId: string;
  codigo: string;
  nombre: string;
}

export interface ResumenUbicacion {
  id: number;
  publicId: string;
  nombre: string;
  latitud: number | null;
  longitud: number | null;
}

export interface TripulanteProps {
  personal: ResumenPersonal;
  rol: TipoPersonal;
}

export interface CargaProps {
  id: number;
  descripcion: string;
  cantidad: number | null;
  unidadMedida: UnidadMedida;
  pesoKg: number | null;
  piezas: number | null;
  embalaje: string | null;
  valorDeclarado: number | null;
}

export interface ManifiestoProps {
  id: number;
  publicId: string;
  numero: string;
  estado: EstadoManifiesto;
  // Servicio
  fechaServicio: Date;
  horaServicio: string | null;
  origen: string;
  destino: string;
  ubicacionOrigen: ResumenUbicacion | null;
  ubicacionDestino: ResumenUbicacion | null;
  tipoServicio: ResumenTipoServicio | null;
  cliente: ResumenCliente | null;
  clienteTexto: string | null;
  estadoCarga: EstadoCarga | null;
  combustible: NivelCombustible | null;
  viaticos: Viaticos | null;
  // Unidad / operador
  unidad: ResumenUnidad;
  segundaUnidad: ResumenUnidad | null;
  segundaPlaca: string | null;
  conductor: ResumenPersonal;
  ruta: ResumenRuta | null;
  // Supervision
  supervisor: ResumenPersonal | null;
  base: string | null;
  puestoControl: string | null;
  // Fechas
  fechaLlegadaEstimada: Date | null;
  fechaCierre: Date | null;
  observaciones: string | null;
  cargas: CargaProps[];
  tripulantes: TripulanteProps[];
  estadoRegistro: EstadoRegistro;
}

export interface CrearCargaData {
  descripcion: string;
  cantidad: number | null;
  unidadMedida: UnidadMedida;
  pesoKg: number | null;
  piezas: number | null;
  embalaje: string | null;
  valorDeclarado: number | null;
}

export interface CrearManifiestoData {
  numero: string;
  fechaServicio: Date;
  horaServicio: string | null;
  origen: string;
  destino: string;
  ubicacionOrigenId: number | null;
  ubicacionDestinoId: number | null;
  tipoServicioId: number | null;
  clienteId: number | null;
  clienteTexto: string | null;
  estadoCarga: EstadoCarga | null;
  combustible: NivelCombustible | null;
  viaticos: Viaticos | null;
  unidadId: number;
  segundaUnidadId: number | null;
  segundaPlaca: string | null;
  conductorId: number;
  rutaId: number | null;
  supervisorId: number | null;
  base: string | null;
  puestoControl: string | null;
  fechaLlegadaEstimada: Date | null;
  observaciones: string | null;
  cargas: CrearCargaData[];
  tripulantes: { personalId: number; rol: TipoPersonal }[];
  usuarioCreacion: string;
}

export interface BuscarManifiestosFiltros {
  numero?: string;
  estado?: EstadoManifiesto;
  unidadId?: number;
  conductorId?: number;
  clienteId?: number;
  rutaId?: number;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface ManifiestoRepository {
  findById(id: number): Promise<ManifiestoProps | null>;
  findByPublicId(publicId: string): Promise<ManifiestoProps | null>;
  crear(data: CrearManifiestoData): Promise<ManifiestoProps>;
  cambiarEstado(
    id: number,
    data: {
      estado: EstadoManifiesto;
      fechaCierre: Date | null;
      usuarioModificacion: string;
    },
  ): Promise<ManifiestoProps>;
  anular(id: number, usuarioModificacion: string): Promise<ManifiestoProps>;
  buscar(
    filtros: BuscarManifiestosFiltros,
  ): Promise<{ datos: ManifiestoProps[]; total: number }>;
  // Total de manifiestos creados (para el correlativo MAPE-####).
  contarTotal(): Promise<number>;
}
