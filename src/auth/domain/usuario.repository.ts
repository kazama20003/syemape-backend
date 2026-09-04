import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../shared/enums/estado-activo.enum.js';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export enum RolUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  OPERACIONES = 'OPERACIONES',
  SUPERVISOR = 'SUPERVISOR',
  CONDUCTOR = 'CONDUCTOR',
  CLIENTE = 'CLIENTE',
}

export function esRolUsuario(v: unknown): v is RolUsuario {
  return typeof v === 'string' && (Object.values(RolUsuario) as string[]).includes(v);
}

export interface UsuarioProps {
  id: number;
  publicId: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  clienteId: number | null;
  personalId: number | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

// Solo el flujo de login necesita el hash; nunca sale del contexto auth.
export interface UsuarioConHash extends UsuarioProps {
  passwordHash: string;
}

export interface CrearUsuarioData {
  email: string;
  nombre: string;
  rol: RolUsuario;
  passwordHash: string;
  clienteId: number | null;
  personalId: number | null;
  usuarioCreacion: string;
}

export interface ActualizarUsuarioData {
  nombre?: string;
  rol?: RolUsuario;
  passwordHash?: string;
  clienteId?: number | null;
  personalId?: number | null;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarUsuariosFiltros {
  texto?: string;
  rol?: RolUsuario;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface UsuarioRepository {
  findById(id: number): Promise<UsuarioProps | null>;
  findByEmail(email: string): Promise<UsuarioConHash | null>;
  contarTotal(): Promise<number>;
  crear(data: CrearUsuarioData): Promise<UsuarioProps>;
  actualizar(id: number, data: ActualizarUsuarioData): Promise<UsuarioProps>;
  anular(id: number, usuarioModificacion: string): Promise<UsuarioProps>;
  buscar(
    filtros: BuscarUsuariosFiltros,
  ): Promise<{ datos: UsuarioProps[]; total: number }>;
}
