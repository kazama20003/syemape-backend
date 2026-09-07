import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import {
  EstadoOperativoActivo,
  TipoActivo,
} from '../value-objects/activo.enum.js';

export const ACTIVO_REPOSITORY = Symbol('ACTIVO_REPOSITORY');

export interface ActivoProps {
  id: number;
  publicId: string;
  codigo: string;
  nombre: string;
  tipo: TipoActivo;
  subtipo: string | null;
  descripcion: string | null;
  estadoOperativo: EstadoOperativoActivo;
  fechaAdquisicion: Date | null;
  valorAdquisicion: number | null;
  vidaUtilMeses: number | null;
  proveedor: string | null;
  numeroSerie: string | null;
  responsableId: number | null;
  ubicacionHabitualId: number | null;
  estadoRegistro: EstadoRegistro;
}

export interface CrearActivoData {
  codigo: string;
  nombre: string;
  tipo: TipoActivo;
  subtipo: string | null;
  descripcion: string | null;
  estadoOperativo: EstadoOperativoActivo;
  fechaAdquisicion: Date | null;
  valorAdquisicion: number | null;
  vidaUtilMeses: number | null;
  proveedor: string | null;
  numeroSerie: string | null;
  responsableId: number | null;
  ubicacionHabitualId: number | null;
  usuarioCreacion: string;
}

export interface ActualizarActivoData {
  codigo?: string;
  nombre?: string;
  tipo?: TipoActivo;
  subtipo?: string | null;
  descripcion?: string | null;
  estadoOperativo?: EstadoOperativoActivo;
  fechaAdquisicion?: Date | null;
  valorAdquisicion?: number | null;
  vidaUtilMeses?: number | null;
  proveedor?: string | null;
  numeroSerie?: string | null;
  responsableId?: number | null;
  ubicacionHabitualId?: number | null;
  usuarioModificacion: string;
}

export interface BuscarActivosFiltros {
  codigo?: string;
  texto?: string;
  tipo?: TipoActivo;
  estadoOperativo?: EstadoOperativoActivo;
  estadoRegistro?: EstadoRegistro;
  responsableId?: number;
  ubicacionHabitualId?: number;
  page: number;
  pageSize: number;
}

export interface ActivoRepository {
  findById(id: number): Promise<ActivoProps | null>;
  findByCodigo(codigo: string): Promise<ActivoProps | null>;
  crear(data: CrearActivoData): Promise<ActivoProps>;
  actualizar(id: number, data: ActualizarActivoData): Promise<ActivoProps>;
  anular(id: number, usuarioModificacion: string): Promise<ActivoProps>;
  buscar(
    filtros: BuscarActivosFiltros,
  ): Promise<{ datos: ActivoProps[]; total: number }>;
}
