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
import {
  aEnteroPositivo,
  aFechaOpcional,
  aNumeroOpcional,
  aTextoOpcional,
} from '../../shared/dto/parseo.js';
import {
  ACTIVO_REPOSITORY,
  type ActualizarActivoData,
  type ActivoProps,
  type CrearActivoData,
  type ActivoRepository,
} from '../domain/repositories/activo.repository.js';
import {
  EstadoOperativoActivo,
  TipoActivo,
  esEstadoOperativoActivo,
  esTipoActivo,
} from '../domain/value-objects/activo.enum.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;

export class RegistrarActivoDto {
  codigo: string;
  nombre: string;
  tipo: string;
  subtipo?: string;
  descripcion?: string;
  estadoOperativo?: string;
  fechaAdquisicion?: string;
  valorAdquisicion?: number;
  vidaUtilMeses?: number;
  proveedor?: string;
  numeroSerie?: string;
  responsableId?: number;
  ubicacionHabitualId?: number;
}

export class ActualizarActivoDto {
  codigo?: string;
  nombre?: string;
  tipo?: string;
  subtipo?: string;
  descripcion?: string;
  estadoOperativo?: string;
  fechaAdquisicion?: string;
  valorAdquisicion?: number;
  vidaUtilMeses?: number;
  proveedor?: string;
  numeroSerie?: string;
  responsableId?: number;
  ubicacionHabitualId?: number;
}

function exigirTexto(valor: unknown, campo: string): string {
  const texto = aTextoOpcional(valor);
  if (!texto) {
    throw new DomainValidationError(
      `El campo "${campo}" es obligatorio.`,
      campo,
      'REQUERIDO',
      valor ?? null,
    );
  }
  return texto;
}

function exigirTipo(valor: unknown): TipoActivo {
  if (!esTipoActivo(valor)) {
    throw new DomainValidationError(
      `El tipo de activo no es valido. Use uno de: ${Object.values(TipoActivo).join(', ')}.`,
      'tipo',
      'INVALIDO',
      valor ?? null,
    );
  }
  return valor;
}

function resolverEstado(
  valor: unknown,
  porDefecto: EstadoOperativoActivo,
): EstadoOperativoActivo {
  if (valor === undefined || valor === null || valor === '') return porDefecto;
  if (!esEstadoOperativoActivo(valor)) {
    throw new DomainValidationError(
      `El estado operativo no es valido. Use uno de: ${Object.values(EstadoOperativoActivo).join(', ')}.`,
      'estadoOperativo',
      'INVALIDO',
      valor,
    );
  }
  return valor;
}

function exigirActivoNoVehicular(activo: ActivoProps): void {
  if (activo.tipo === TipoActivo.UNIDAD) {
    throw new DomainValidationError(
      'Las unidades se administran desde el maestro de Unidades.',
      'tipo',
      'OPERACION_NO_PERMITIDA',
      activo.tipo,
    );
  }
}

function camposAdquisicion(
  dto: RegistrarActivoDto | ActualizarActivoDto,
  parcial: boolean,
) : Partial<
  Pick<
    CrearActivoData,
    | 'fechaAdquisicion'
    | 'valorAdquisicion'
    | 'vidaUtilMeses'
    | 'proveedor'
    | 'numeroSerie'
    | 'responsableId'
    | 'ubicacionHabitualId'
  >
> {
  const valor = <T>(campo: keyof ActualizarActivoDto, fn: () => T): T | undefined =>
    !parcial || dto[campo] !== undefined ? fn() : undefined;
  return {
    fechaAdquisicion: valor('fechaAdquisicion', () =>
      aFechaOpcional(dto.fechaAdquisicion),
    ),
    valorAdquisicion: valor('valorAdquisicion', () =>
      aNumeroOpcional(dto.valorAdquisicion),
    ),
    vidaUtilMeses: valor('vidaUtilMeses', () =>
      aNumeroOpcional(dto.vidaUtilMeses),
    ),
    proveedor: valor('proveedor', () => aTextoOpcional(dto.proveedor)),
    numeroSerie: valor('numeroSerie', () => aTextoOpcional(dto.numeroSerie)),
    responsableId: valor('responsableId', () =>
      aNumeroOpcional(dto.responsableId),
    ),
    ubicacionHabitualId: valor('ubicacionHabitualId', () =>
      aNumeroOpcional(dto.ubicacionHabitualId),
    ),
  };
}

@Injectable()
export class RegistrarActivoUseCase {
  constructor(
    @Inject(ACTIVO_REPOSITORY) private readonly activos: ActivoRepository,
  ) {}

  async execute(dto: RegistrarActivoDto, actor: string): Promise<ActivoProps> {
    const codigo = exigirTexto(dto.codigo, 'codigo');
    const tipo = exigirTipo(dto.tipo);
    if (tipo === TipoActivo.UNIDAD) {
      throw new DomainValidationError(
        'Las unidades deben registrarse desde el maestro de Unidades.',
        'tipo',
        'OPERACION_NO_PERMITIDA',
        tipo,
      );
    }
    const existente = await this.activos.findByCodigo(codigo);
    if (existente) {
      throw new DomainValidationError(
        `Ya existe un activo con el codigo "${codigo}".`,
        'codigo',
        'DUPLICADO',
        codigo,
      );
    }
    const adquisicion = camposAdquisicion(dto, false);
    return this.activos.crear({
      codigo,
      nombre: exigirTexto(dto.nombre, 'nombre'),
      tipo,
      subtipo: aTextoOpcional(dto.subtipo),
      descripcion: aTextoOpcional(dto.descripcion),
      estadoOperativo: resolverEstado(
        dto.estadoOperativo,
        EstadoOperativoActivo.OPERATIVO,
      ),
      fechaAdquisicion: adquisicion.fechaAdquisicion ?? null,
      valorAdquisicion: adquisicion.valorAdquisicion ?? null,
      vidaUtilMeses: adquisicion.vidaUtilMeses ?? null,
      proveedor: adquisicion.proveedor ?? null,
      numeroSerie: adquisicion.numeroSerie ?? null,
      responsableId: adquisicion.responsableId ?? null,
      ubicacionHabitualId: adquisicion.ubicacionHabitualId ?? null,
      usuarioCreacion: actor,
    });
  }
}

@Injectable()
export class ListarActivosUseCase {
  constructor(
    @Inject(ACTIVO_REPOSITORY) private readonly activos: ActivoRepository,
  ) {}

  async execute(query: {
    codigo?: string;
    texto?: string;
    tipo?: string;
    estadoOperativo?: string;
      estadoRegistro?: string;
      responsableId?: string;
      ubicacionHabitualId?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<ActivoProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );
    const { datos, total } = await this.activos.buscar({
      codigo: aTextoOpcional(query.codigo) ?? undefined,
      texto: aTextoOpcional(query.texto) ?? undefined,
      tipo: esTipoActivo(query.tipo) ? query.tipo : undefined,
      estadoOperativo: esEstadoOperativoActivo(query.estadoOperativo)
        ? query.estadoOperativo
        : undefined,
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      responsableId: aNumeroOpcional(query.responsableId) ?? undefined,
      ubicacionHabitualId:
        aNumeroOpcional(query.ubicacionHabitualId) ?? undefined,
      page,
      pageSize,
    });
    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}

@Injectable()
export class ObtenerActivoUseCase {
  constructor(
    @Inject(ACTIVO_REPOSITORY) private readonly activos: ActivoRepository,
  ) {}

  async execute(id: number): Promise<ActivoProps> {
    const activo = await this.activos.findById(id);
    if (!activo)
      throw new RecursoNoEncontradoError(
        'El activo indicado no existe.',
        'activo',
        id,
      );
    return activo;
  }
}

@Injectable()
export class ActualizarActivoUseCase {
  constructor(
    @Inject(ACTIVO_REPOSITORY) private readonly activos: ActivoRepository,
  ) {}

  async execute(
    id: number,
    dto: ActualizarActivoDto,
    actor: string,
  ): Promise<ActivoProps> {
    const activo = await this.activos.findById(id);
    if (!activo)
      throw new RecursoNoEncontradoError(
        'El activo indicado no existe.',
        'activo',
        id,
      );
    exigirActivoNoVehicular(activo);
    const codigo =
      dto.codigo === undefined ? undefined : exigirTexto(dto.codigo, 'codigo');
    if (codigo) {
      const otro = await this.activos.findByCodigo(codigo);
      if (otro && otro.id !== id) {
        throw new DomainValidationError(
          `Ya existe otro activo con el codigo "${codigo}".`,
          'codigo',
          'DUPLICADO',
          codigo,
        );
      }
    }
    const tipo = dto.tipo === undefined ? undefined : exigirTipo(dto.tipo);
    if (tipo === TipoActivo.UNIDAD) {
      throw new DomainValidationError(
        'Las unidades se administran desde el maestro de Unidades.',
        'tipo',
        'OPERACION_NO_PERMITIDA',
        tipo,
      );
    }
    return this.activos.actualizar(id, {
      codigo,
      nombre:
        dto.nombre === undefined
          ? undefined
          : exigirTexto(dto.nombre, 'nombre'),
      tipo,
      subtipo: dto.subtipo === undefined ? undefined : aTextoOpcional(dto.subtipo),
      descripcion:
        dto.descripcion === undefined
          ? undefined
          : aTextoOpcional(dto.descripcion),
      estadoOperativo:
        dto.estadoOperativo === undefined
          ? undefined
          : resolverEstado(dto.estadoOperativo, activo.estadoOperativo),
      ...camposAdquisicion(dto, true),
      usuarioModificacion: actor,
    });
  }
}

@Injectable()
export class AnularActivoUseCase {
  constructor(
    @Inject(ACTIVO_REPOSITORY) private readonly activos: ActivoRepository,
  ) {}

  async execute(id: number, actor: string): Promise<ActivoProps> {
    const activo = await this.activos.findById(id);
    if (!activo)
      throw new RecursoNoEncontradoError(
        'El activo indicado no existe.',
        'activo',
        id,
      );
    exigirActivoNoVehicular(activo);
    return this.activos.anular(id, actor);
  }
}
