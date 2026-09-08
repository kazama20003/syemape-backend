import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';
import { ClaseUnidad } from '../../../unidades/domain/value-objects/clase-unidad.enum.js';

export const TIPO_VEHICULO_REPOSITORY = Symbol('TIPO_VEHICULO_REPOSITORY');

export interface TipoVehiculoProps {
  id: number;
  publicId: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  claseSugerida: ClaseUnidad | null;
  categoriaSugerida: string | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

export interface CrearTipoVehiculoData {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  claseSugerida: ClaseUnidad | null;
  categoriaSugerida: string | null;
  usuarioCreacion: string;
}

export interface ActualizarTipoVehiculoData {
  nombre?: string;
  descripcion?: string | null;
  claseSugerida?: ClaseUnidad | null;
  categoriaSugerida?: string | null;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarTiposVehiculoFiltros {
  texto?: string;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface TipoVehiculoRepository {
  findById(id: number): Promise<TipoVehiculoProps | null>;
  findByPublicId(publicId: string): Promise<TipoVehiculoProps | null>;
  findByCodigo(codigo: string): Promise<TipoVehiculoProps | null>;
  crear(data: CrearTipoVehiculoData): Promise<TipoVehiculoProps>;
  actualizar(
    id: number,
    data: ActualizarTipoVehiculoData,
  ): Promise<TipoVehiculoProps>;
  anular(id: number, usuarioModificacion: string): Promise<TipoVehiculoProps>;
  buscar(
    filtros: BuscarTiposVehiculoFiltros,
  ): Promise<{ datos: TipoVehiculoProps[]; total: number }>;
}
