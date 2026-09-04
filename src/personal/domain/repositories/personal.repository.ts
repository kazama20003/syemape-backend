import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';
import { TipoPersonal } from '../value-objects/tipo-personal.enum.js';

export const PERSONAL_REPOSITORY = Symbol('PERSONAL_REPOSITORY');

export interface PersonalProps {
  id: number;
  publicId: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  tipo: TipoPersonal;
  apelativo: string | null;
  telefono: string | null;
  licenciaConducir: string | null;
  categoriaLicencia: string | null;
  licenciaVencimiento: Date | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

export interface CrearPersonalData {
  tipoDocumento: string;
  numeroDocumento: string;
  numeroDocumentoNormalizado: string;
  nombres: string;
  apellidos: string;
  tipo: TipoPersonal;
  apelativo: string | null;
  telefono: string | null;
  licenciaConducir: string | null;
  categoriaLicencia: string | null;
  licenciaVencimiento: Date | null;
  usuarioCreacion: string;
}

export interface ActualizarPersonalData {
  tipoDocumento?: string;
  numeroDocumento?: string;
  numeroDocumentoNormalizado?: string;
  nombres?: string;
  apellidos?: string;
  tipo?: TipoPersonal;
  apelativo?: string | null;
  telefono?: string | null;
  licenciaConducir?: string | null;
  categoriaLicencia?: string | null;
  licenciaVencimiento?: Date | null;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarPersonalFiltros {
  texto?: string;
  tipo?: TipoPersonal;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface PersonalRepository {
  findById(id: number): Promise<PersonalProps | null>;
  findByPublicId(publicId: string): Promise<PersonalProps | null>;
  findByDocumentoActivo(
    numeroDocumentoNormalizado: string,
  ): Promise<PersonalProps | null>;
  crear(data: CrearPersonalData): Promise<PersonalProps>;
  actualizar(id: number, data: ActualizarPersonalData): Promise<PersonalProps>;
  anular(id: number, usuarioModificacion: string): Promise<PersonalProps>;
  buscar(
    filtros: BuscarPersonalFiltros,
  ): Promise<{ datos: PersonalProps[]; total: number }>;
}
