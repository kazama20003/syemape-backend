import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';
import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';

export const ROL_PERSONAL_REPOSITORY = Symbol('ROL_PERSONAL_REPOSITORY');

export interface RolPersonalProps {
  id: number;
  publicId: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  puedeConducir: boolean;
  puedeSupervisar: boolean;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

export interface CrearRolPersonalData {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  puedeConducir: boolean;
  puedeSupervisar: boolean;
  usuarioCreacion: string;
}

export interface ActualizarRolPersonalData {
  nombre?: string;
  descripcion?: string | null;
  puedeConducir?: boolean;
  puedeSupervisar?: boolean;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarRolesPersonalFiltros {
  texto?: string;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface RolPersonalRepository {
  findById(id: number): Promise<RolPersonalProps | null>;
  findByCodigo(codigo: string): Promise<RolPersonalProps | null>;
  findActivosByIds(ids: number[]): Promise<RolPersonalProps[]>;
  crear(data: CrearRolPersonalData): Promise<RolPersonalProps>;
  actualizar(
    id: number,
    data: ActualizarRolPersonalData,
  ): Promise<RolPersonalProps>;
  anular(id: number, usuarioModificacion: string): Promise<RolPersonalProps>;
  buscar(
    filtros: BuscarRolesPersonalFiltros,
  ): Promise<{ datos: RolPersonalProps[]; total: number }>;
}
