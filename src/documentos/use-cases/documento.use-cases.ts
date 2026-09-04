import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import { aFechaOpcional, aTextoOpcional } from '../../shared/dto/parseo.js';
import {
  DocumentoProps,
  DocumentoRepository,
} from '../domain/documento.repository.js';

const USUARIO_SISTEMA = 'sistema';

export class RegistrarDocumentoDto {
  tipo: string;
  nombre: string;
  numero?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  archivoUrl?: string;
  observacion?: string;
}
export class ActualizarDocumentoDto {
  tipo?: string;
  nombre?: string;
  numero?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  archivoUrl?: string;
  observacion?: string;
}

function exigirTexto(v: unknown, campo: string): string {
  const t = aTextoOpcional(v);
  if (!t) {
    throw new DomainValidationError(`El campo "${campo}" es obligatorio.`, campo, 'REQUERIDO', v ?? null);
  }
  return t;
}

// Gestion de documentos generica; se instancia una vez por padre (unidad /
// personal) con su repositorio concreto.
export class GestionDocumentosUseCase {
  constructor(private readonly repo: DocumentoRepository) {}

  async listar(padreId: number): Promise<RespuestaDto<DocumentoProps[]>> {
    await this.exigirPadre(padreId);
    return { datos: await this.repo.listarPorPadre(padreId) };
  }

  async registrar(
    padreId: number,
    dto: RegistrarDocumentoDto,
  ): Promise<DocumentoProps> {
    await this.exigirPadre(padreId);
    return this.repo.crear({
      padreId,
      tipo: exigirTexto(dto.tipo, 'tipo'),
      nombre: exigirTexto(dto.nombre, 'nombre'),
      numero: aTextoOpcional(dto.numero),
      fechaEmision: aFechaOpcional(dto.fechaEmision),
      fechaVencimiento: aFechaOpcional(dto.fechaVencimiento),
      archivoUrl: aTextoOpcional(dto.archivoUrl),
      observacion: aTextoOpcional(dto.observacion),
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }

  async actualizar(
    id: number,
    dto: ActualizarDocumentoDto,
  ): Promise<DocumentoProps> {
    const doc = await this.repo.findById(id);
    if (!doc) {
      throw new RecursoNoEncontradoError('El documento no existe.', this.repo.entidad, id);
    }
    return this.repo.actualizar(id, {
      tipo: dto.tipo !== undefined ? exigirTexto(dto.tipo, 'tipo') : undefined,
      nombre: dto.nombre !== undefined ? exigirTexto(dto.nombre, 'nombre') : undefined,
      numero: dto.numero !== undefined ? aTextoOpcional(dto.numero) : undefined,
      fechaEmision:
        dto.fechaEmision !== undefined ? aFechaOpcional(dto.fechaEmision) : undefined,
      fechaVencimiento:
        dto.fechaVencimiento !== undefined
          ? aFechaOpcional(dto.fechaVencimiento)
          : undefined,
      archivoUrl:
        dto.archivoUrl !== undefined ? aTextoOpcional(dto.archivoUrl) : undefined,
      observacion:
        dto.observacion !== undefined ? aTextoOpcional(dto.observacion) : undefined,
      usuarioModificacion: USUARIO_SISTEMA,
    });
  }

  async anular(id: number): Promise<DocumentoProps> {
    const doc = await this.repo.findById(id);
    if (!doc) {
      throw new RecursoNoEncontradoError('El documento no existe.', this.repo.entidad, id);
    }
    return this.repo.anular(id, USUARIO_SISTEMA);
  }

  private async exigirPadre(padreId: number): Promise<void> {
    const padre = await this.repo.padreActivo(padreId);
    if (!padre) {
      throw new RecursoNoEncontradoError(
        'El registro asociado al documento no existe.',
        this.repo.entidad,
        padreId,
      );
    }
  }
}

export const GESTION_DOCUMENTOS_UNIDAD = Symbol('GESTION_DOCUMENTOS_UNIDAD');
export const GESTION_DOCUMENTOS_PERSONAL = Symbol('GESTION_DOCUMENTOS_PERSONAL');
