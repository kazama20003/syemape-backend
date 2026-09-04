import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';

export const TIPO_SERVICIO_REPOSITORY = Symbol('TIPO_SERVICIO_REPOSITORY');

export interface TipoServicioProps {
  id: number;
  publicId: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

export interface CrearTipoServicioData {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  usuarioCreacion: string;
}

export interface ActualizarTipoServicioData {
  nombre?: string;
  descripcion?: string | null;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarTiposServicioFiltros {
  texto?: string;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface TipoServicioRepository {
  findById(id: number): Promise<TipoServicioProps | null>;
  findByPublicId(publicId: string): Promise<TipoServicioProps | null>;
  findByCodigo(codigo: string): Promise<TipoServicioProps | null>;
  crear(data: CrearTipoServicioData): Promise<TipoServicioProps>;
  actualizar(
    id: number,
    data: ActualizarTipoServicioData,
  ): Promise<TipoServicioProps>;
  anular(id: number, usuarioModificacion: string): Promise<TipoServicioProps>;
  buscar(
    filtros: BuscarTiposServicioFiltros,
  ): Promise<{ datos: TipoServicioProps[]; total: number }>;
}
