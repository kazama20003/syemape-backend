import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';

export const CLIENTE_REPOSITORY = Symbol('CLIENTE_REPOSITORY');

export interface ClienteProps {
  id: number;
  publicId: string;
  razonSocial: string;
  tipoDocumento: string;
  numeroDocumento: string | null;
  cuenta: string | null;
  direccion: string | null;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  email: string | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

export interface CrearClienteData {
  razonSocial: string;
  tipoDocumento: string;
  numeroDocumento: string | null;
  numeroDocumentoNormalizado: string | null;
  cuenta: string | null;
  direccion: string | null;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  email: string | null;
  usuarioCreacion: string;
}

export interface ActualizarClienteData {
  razonSocial?: string;
  tipoDocumento?: string;
  numeroDocumento?: string | null;
  numeroDocumentoNormalizado?: string | null;
  cuenta?: string | null;
  direccion?: string | null;
  contactoNombre?: string | null;
  contactoTelefono?: string | null;
  email?: string | null;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarClientesFiltros {
  texto?: string;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface ClienteRepository {
  findById(id: number): Promise<ClienteProps | null>;
  findByPublicId(publicId: string): Promise<ClienteProps | null>;
  findByDocumentoActivo(
    numeroDocumentoNormalizado: string,
  ): Promise<ClienteProps | null>;
  crear(data: CrearClienteData): Promise<ClienteProps>;
  actualizar(id: number, data: ActualizarClienteData): Promise<ClienteProps>;
  anular(id: number, usuarioModificacion: string): Promise<ClienteProps>;
  buscar(
    filtros: BuscarClientesFiltros,
  ): Promise<{ datos: ClienteProps[]; total: number }>;
}
