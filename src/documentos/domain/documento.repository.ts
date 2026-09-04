import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';

// Puertos separados por padre (unidad / personal) pero con el mismo contrato.
export const DOCUMENTO_UNIDAD_REPOSITORY = Symbol('DOCUMENTO_UNIDAD_REPOSITORY');
export const DOCUMENTO_PERSONAL_REPOSITORY = Symbol(
  'DOCUMENTO_PERSONAL_REPOSITORY',
);

export interface DocumentoProps {
  id: number;
  publicId: string;
  padreId: number;
  tipo: string;
  nombre: string;
  numero: string | null;
  fechaEmision: Date | null;
  fechaVencimiento: Date | null;
  archivoUrl: string | null;
  observacion: string | null;
  estadoRegistro: EstadoRegistro;
}

export interface CrearDocumentoData {
  padreId: number;
  tipo: string;
  nombre: string;
  numero: string | null;
  fechaEmision: Date | null;
  fechaVencimiento: Date | null;
  archivoUrl: string | null;
  observacion: string | null;
  usuarioCreacion: string;
}

export interface ActualizarDocumentoData {
  tipo?: string;
  nombre?: string;
  numero?: string | null;
  fechaEmision?: Date | null;
  fechaVencimiento?: Date | null;
  archivoUrl?: string | null;
  observacion?: string | null;
  usuarioModificacion: string;
}

export interface DocumentoRepository {
  // Nombre de la entidad para el historial (documento_unidad / documento_personal).
  readonly entidad: string;
  padreActivo(padreId: number): Promise<{ id: number } | null>;
  findById(id: number): Promise<DocumentoProps | null>;
  listarPorPadre(padreId: number): Promise<DocumentoProps[]>;
  crear(data: CrearDocumentoData): Promise<DocumentoProps>;
  actualizar(id: number, data: ActualizarDocumentoData): Promise<DocumentoProps>;
  anular(id: number, usuarioModificacion: string): Promise<DocumentoProps>;
}
