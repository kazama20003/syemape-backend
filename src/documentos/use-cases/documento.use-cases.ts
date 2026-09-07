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

function fecha(valor: unknown, campo: string): Date | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const resultado = aFechaOpcional(valor);
  if (!resultado) throw new DomainValidationError(`El campo "${campo}" contiene una fecha invalida.`, campo, 'INVALIDO', valor);
  return resultado;
}

function archivoUrl(valor: unknown): string | null {
  const url = aTextoOpcional(valor);
  if (url && !/^https?:\/\//i.test(url)) throw new DomainValidationError('El archivo debe ser una URL http(s).', 'archivoUrl', 'INVALIDO', valor);
  return url;
}

function validarFechas(emision: Date | null, vencimiento: Date | null): void {
  if (emision && vencimiento && emision > vencimiento) throw new DomainValidationError('La fecha de emision no puede ser posterior al vencimiento.', 'fechaVencimiento', 'ORDEN_INVALIDO', vencimiento);
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
    dto: RegistrarDocumentoDto, actor: string,
  ): Promise<DocumentoProps> {
    await this.exigirPadre(padreId);
    const fechaEmision = fecha(dto.fechaEmision, 'fechaEmision');
    const fechaVencimiento = fecha(dto.fechaVencimiento, 'fechaVencimiento');
    validarFechas(fechaEmision, fechaVencimiento);
    return this.repo.crear({
      padreId,
      tipo: exigirTexto(dto.tipo, 'tipo'),
      nombre: exigirTexto(dto.nombre, 'nombre'),
      numero: aTextoOpcional(dto.numero),
      fechaEmision,
      fechaVencimiento,
      archivoUrl: archivoUrl(dto.archivoUrl),
      observacion: aTextoOpcional(dto.observacion),
      usuarioCreacion: actor,
    });
  }

  async actualizar(
    padreId: number, id: number, dto: ActualizarDocumentoDto, actor: string,
  ): Promise<DocumentoProps> {
    const doc = await this.repo.findById(id);
    if (!doc) {
      throw new RecursoNoEncontradoError('El documento no existe.', this.repo.entidad, id);
    }
    if (doc.padreId !== padreId) throw new RecursoNoEncontradoError('El documento no existe.', this.repo.entidad, id);
    const fechaEmision = dto.fechaEmision === undefined ? doc.fechaEmision : fecha(dto.fechaEmision, 'fechaEmision');
    const fechaVencimiento = dto.fechaVencimiento === undefined ? doc.fechaVencimiento : fecha(dto.fechaVencimiento, 'fechaVencimiento');
    validarFechas(fechaEmision, fechaVencimiento);
    const actualizado = await this.repo.actualizar(padreId, id, {
      tipo: dto.tipo !== undefined ? exigirTexto(dto.tipo, 'tipo') : undefined,
      nombre: dto.nombre !== undefined ? exigirTexto(dto.nombre, 'nombre') : undefined,
      numero: dto.numero !== undefined ? aTextoOpcional(dto.numero) : undefined,
      fechaEmision:
        dto.fechaEmision !== undefined ? fechaEmision : undefined,
      fechaVencimiento:
        dto.fechaVencimiento !== undefined
          ? fechaVencimiento
          : undefined,
      archivoUrl:
        dto.archivoUrl !== undefined ? archivoUrl(dto.archivoUrl) : undefined,
      observacion:
        dto.observacion !== undefined ? aTextoOpcional(dto.observacion) : undefined,
      usuarioModificacion: actor,
    });
    if (!actualizado) throw new RecursoNoEncontradoError('El documento no existe.', this.repo.entidad, id);
    return actualizado;
  }

  async anular(padreId: number, id: number, actor: string): Promise<DocumentoProps> {
    const doc = await this.repo.findById(id);
    if (!doc) {
      throw new RecursoNoEncontradoError('El documento no existe.', this.repo.entidad, id);
    }
    if (doc.padreId !== padreId) throw new RecursoNoEncontradoError('El documento no existe.', this.repo.entidad, id);
    const anulado = await this.repo.anular(padreId, id, actor);
    if (!anulado) throw new RecursoNoEncontradoError('El documento no existe.', this.repo.entidad, id);
    return anulado;
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
