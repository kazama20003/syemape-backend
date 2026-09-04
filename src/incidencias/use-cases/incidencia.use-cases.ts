import { Inject, Injectable } from '@nestjs/common';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import {
  construirPaginacion,
  type RespuestaPaginadaDto,
} from '../../shared/dto/respuesta.dto.js';
import { aEnteroPositivo, aTextoOpcional } from '../../shared/dto/parseo.js';
import {
  validarLatitud,
  validarLongitud,
} from '../../ubicaciones/domain/value-objects/coordenadas.vo.js';
import {
  Criticidad,
  EstadoIncidencia,
  INCIDENCIA_REPOSITORY,
  IncidenciaProps,
  TipoEvidencia,
  TipoIncidencia,
  esCriticidad,
  esEstadoIncidencia,
  esTipoEvidencia,
  esTipoIncidencia,
} from '../domain/incidencia.repository.js';
import type { IncidenciaRepository } from '../domain/incidencia.repository.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;
const USUARIO_SISTEMA = 'sistema';

export class EvidenciaDto {
  tipo?: string;
  url: string;
  descripcion?: string;
}
export class ReportarIncidenciaDto {
  tipo: string;
  criticidad?: string;
  descripcion: string;
  latitud?: number;
  longitud?: number;
  responsable?: string;
  reportadoPor?: string;
  evidencias?: EvidenciaDto[];
}
export class ActualizarIncidenciaDto {
  criticidad?: string;
  estado?: string;
  descripcion?: string;
  responsable?: string;
  accionesTomadas?: string;
}
export class AgregarEvidenciaDto {
  tipo?: string;
  url: string;
  descripcion?: string;
}

function exigirTexto(v: unknown, campo: string): string {
  const t = aTextoOpcional(v);
  if (!t) {
    throw new DomainValidationError(`El campo "${campo}" es obligatorio.`, campo, 'REQUERIDO', v ?? null);
  }
  return t;
}

@Injectable()
export class ReportarIncidenciaUseCase {
  constructor(
    @Inject(INCIDENCIA_REPOSITORY)
    private readonly incidencias: IncidenciaRepository,
  ) {}

  async execute(
    manifiestoId: number,
    dto: ReportarIncidenciaDto,
  ): Promise<IncidenciaProps> {
    const manifiesto = await this.incidencias.manifiestoActivo(manifiestoId);
    if (!manifiesto) {
      throw new RecursoNoEncontradoError(
        'El manifiesto indicado no existe.',
        'manifiesto',
        manifiestoId,
      );
    }
    if (!esTipoIncidencia(dto.tipo)) {
      throw new DomainValidationError(
        `El tipo de incidencia no es valido. Use uno de: ${Object.values(TipoIncidencia).join(', ')}.`,
        'tipo',
        'INVALIDO',
        dto.tipo ?? null,
      );
    }
    const evidencias = (dto.evidencias ?? []).map((e) => ({
      tipo: esTipoEvidencia(e.tipo) ? e.tipo : TipoEvidencia.FOTO,
      url: exigirTexto(e.url, 'evidencias.url'),
      descripcion: aTextoOpcional(e.descripcion),
    }));

    return this.incidencias.crear({
      manifiestoId,
      tipo: dto.tipo,
      criticidad: esCriticidad(dto.criticidad) ? dto.criticidad : Criticidad.MEDIA,
      descripcion: exigirTexto(dto.descripcion, 'descripcion'),
      latitud: validarLatitud(dto.latitud),
      longitud: validarLongitud(dto.longitud),
      responsable: aTextoOpcional(dto.responsable),
      reportadoPor: aTextoOpcional(dto.reportadoPor) ?? USUARIO_SISTEMA,
      evidencias,
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class ActualizarIncidenciaUseCase {
  constructor(
    @Inject(INCIDENCIA_REPOSITORY)
    private readonly incidencias: IncidenciaRepository,
  ) {}

  async execute(id: number, dto: ActualizarIncidenciaDto): Promise<IncidenciaProps> {
    const incidencia = await this.incidencias.findById(id);
    if (!incidencia) {
      throw new RecursoNoEncontradoError(
        'La incidencia indicada no existe.',
        'incidencia',
        id,
      );
    }
    let estado: EstadoIncidencia | undefined;
    let fechaResolucion: Date | null | undefined;
    if (dto.estado !== undefined) {
      if (!esEstadoIncidencia(dto.estado)) {
        throw new DomainValidationError(
          `El estado no es valido. Use uno de: ${Object.values(EstadoIncidencia).join(', ')}.`,
          'estado',
          'INVALIDO',
          dto.estado,
        );
      }
      estado = dto.estado;
      // Al resolver se sella la hora; al reabrir se limpia.
      fechaResolucion =
        estado === EstadoIncidencia.RESUELTA
          ? (incidencia.fechaResolucion ?? new Date())
          : null;
    }

    return this.incidencias.actualizar(id, {
      criticidad:
        dto.criticidad !== undefined
          ? esCriticidad(dto.criticidad)
            ? dto.criticidad
            : incidencia.criticidad
          : undefined,
      estado,
      descripcion:
        dto.descripcion !== undefined
          ? exigirTexto(dto.descripcion, 'descripcion')
          : undefined,
      responsable:
        dto.responsable !== undefined ? aTextoOpcional(dto.responsable) : undefined,
      accionesTomadas:
        dto.accionesTomadas !== undefined
          ? aTextoOpcional(dto.accionesTomadas)
          : undefined,
      fechaResolucion,
      usuarioModificacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class AgregarEvidenciaUseCase {
  constructor(
    @Inject(INCIDENCIA_REPOSITORY)
    private readonly incidencias: IncidenciaRepository,
  ) {}

  async execute(id: number, dto: AgregarEvidenciaDto): Promise<IncidenciaProps> {
    const incidencia = await this.incidencias.findById(id);
    if (!incidencia) {
      throw new RecursoNoEncontradoError(
        'La incidencia indicada no existe.',
        'incidencia',
        id,
      );
    }
    return this.incidencias.agregarEvidencia(id, {
      tipo: esTipoEvidencia(dto.tipo) ? dto.tipo : TipoEvidencia.FOTO,
      url: exigirTexto(dto.url, 'url'),
      descripcion: aTextoOpcional(dto.descripcion),
    });
  }
}

@Injectable()
export class ObtenerIncidenciaUseCase {
  constructor(
    @Inject(INCIDENCIA_REPOSITORY)
    private readonly incidencias: IncidenciaRepository,
  ) {}

  async execute(id: number): Promise<IncidenciaProps> {
    const incidencia = await this.incidencias.findById(id);
    if (!incidencia) {
      throw new RecursoNoEncontradoError(
        'La incidencia indicada no existe.',
        'incidencia',
        id,
      );
    }
    return incidencia;
  }
}

@Injectable()
export class ListarIncidenciasUseCase {
  constructor(
    @Inject(INCIDENCIA_REPOSITORY)
    private readonly incidencias: IncidenciaRepository,
  ) {}

  async execute(query: {
    manifiestoId?: string | number;
    tipo?: string;
    criticidad?: string;
    estado?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<IncidenciaProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );
    const { datos, total } = await this.incidencias.buscar({
      manifiestoId: query.manifiestoId
        ? aEnteroPositivo(query.manifiestoId, 0) || undefined
        : undefined,
      tipo: esTipoIncidencia(query.tipo) ? query.tipo : undefined,
      criticidad: esCriticidad(query.criticidad) ? query.criticidad : undefined,
      estado: esEstadoIncidencia(query.estado) ? query.estado : undefined,
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      page,
      pageSize,
    });
    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}
