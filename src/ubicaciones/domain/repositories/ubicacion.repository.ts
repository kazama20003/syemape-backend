import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';
import { TipoUbicacion } from '../value-objects/tipo-ubicacion.enum.js';

export const UBICACION_REPOSITORY = Symbol('UBICACION_REPOSITORY');

export interface UbicacionProps {
  id: number;
  publicId: string;
  nombre: string;
  tipo: TipoUbicacion;
  direccion: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

export interface CrearUbicacionData {
  nombre: string;
  tipo: TipoUbicacion;
  direccion: string | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  usuarioCreacion: string;
}

export interface ActualizarUbicacionData {
  nombre?: string;
  tipo?: TipoUbicacion;
  direccion?: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarUbicacionesFiltros {
  texto?: string;
  tipo?: TipoUbicacion;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface UbicacionRepository {
  findById(id: number): Promise<UbicacionProps | null>;
  findByPublicId(publicId: string): Promise<UbicacionProps | null>;
  crear(data: CrearUbicacionData): Promise<UbicacionProps>;
  actualizar(id: number, data: ActualizarUbicacionData): Promise<UbicacionProps>;
  anular(id: number, usuarioModificacion: string): Promise<UbicacionProps>;
  buscar(
    filtros: BuscarUbicacionesFiltros,
  ): Promise<{ datos: UbicacionProps[]; total: number }>;
}
