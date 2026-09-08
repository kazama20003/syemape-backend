import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';

export const RUTA_REPOSITORY = Symbol('RUTA_REPOSITORY');

export interface RutaProps {
  id: number;
  publicId: string;
  nombre: string;
  origen: string;
  destino: string;
  ubicacionOrigenId: number | null;
  ubicacionDestinoId: number | null;
  distanciaKm: number | null;
  duracionEstimadaHoras: number | null;
  descripcion: string | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

export interface CrearRutaData {
  nombre: string;
  origen: string;
  destino: string;
  ubicacionOrigenId: number | null;
  ubicacionDestinoId: number | null;
  distanciaKm: number | null;
  duracionEstimadaHoras: number | null;
  descripcion: string | null;
  usuarioCreacion: string;
}

export interface ActualizarRutaData {
  nombre?: string;
  origen?: string;
  destino?: string;
  ubicacionOrigenId?: number | null;
  ubicacionDestinoId?: number | null;
  distanciaKm?: number | null;
  duracionEstimadaHoras?: number | null;
  descripcion?: string | null;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarRutasFiltros {
  texto?: string;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface RutaRepository {
  findById(id: number): Promise<RutaProps | null>;
  findByPublicId(publicId: string): Promise<RutaProps | null>;
  crear(data: CrearRutaData): Promise<RutaProps>;
  actualizar(id: number, data: ActualizarRutaData): Promise<RutaProps>;
  anular(id: number, usuarioModificacion: string): Promise<RutaProps>;
  buscar(
    filtros: BuscarRutasFiltros,
  ): Promise<{ datos: RutaProps[]; total: number }>;
}
