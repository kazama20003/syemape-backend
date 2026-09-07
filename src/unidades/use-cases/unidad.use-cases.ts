import { Inject, Injectable } from '@nestjs/common';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { esEstadoActivo } from '../../shared/enums/estado-activo.enum.js';
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
  UNIDAD_REPOSITORY,
  type ActualizarUnidadData,
  type CrearUnidadData,
  type UnidadProps,
  type UnidadRepository,
} from '../domain/repositories/unidad.repository.js';
import {
  ClaseUnidad,
  EstadoUnidad,
  esClaseUnidad,
  esEstadoUnidad,
} from '../domain/value-objects/clase-unidad.enum.js';
import {
  exigirPlaca,
  normalizarPlaca,
} from '../domain/value-objects/placa.vo.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;

// Solo URLs http(s) no vacias; el maestro guarda referencias, no binarios.
function limpiarFotos(fotos: unknown): string[] {
  if (!Array.isArray(fotos)) return [];
  return fotos
    .filter((f): f is string => typeof f === 'string')
    .map((f) => f.trim())
    .filter((f) => /^https?:\/\//.test(f))
    .slice(0, 20);
}

function throwEstadoActivoInvalido(valor: unknown): never {
  throw new DomainValidationError(
    'El estadoActivo no es valido. Use ACTIVO o INACTIVO.',
    'estadoActivo',
    'INVALIDO',
    valor,
  );
}

function numeroNoNegativo(valor: unknown, campo: string, entero = false): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = aNumeroOpcional(valor);
  if (numero === null || numero < 0 || (entero && !Number.isInteger(numero))) throw new DomainValidationError(`El campo "${campo}" debe ser ${entero ? 'un entero' : 'un numero'} no negativo.`, campo, 'INVALIDO', valor);
  return numero;
}

function anioRazonable(valor: unknown, campo: string): number | null {
  const anio = numeroNoNegativo(valor, campo, true);
  if (anio !== null && (anio < 1900 || anio > new Date().getFullYear() + 1)) throw new DomainValidationError(`El campo "${campo}" debe estar entre 1900 y el proximo año.`, campo, 'INVALIDO', valor);
  return anio;
}

function fechaValida(valor: unknown, campo: string): Date | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const fecha = aFechaOpcional(valor);
  if (!fecha) throw new DomainValidationError(`El campo "${campo}" contiene una fecha invalida.`, campo, 'INVALIDO', valor);
  return fecha;
}

export class RegistrarUnidadDto {
  placa: string;
  clase: string;
  tipoVehiculo?: string;
  categoriaVehicular?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  anioFabricacion?: number;
  color?: string;
  numeroEjes?: number;
  numeroMotor?: string;
  numeroVin?: string;
  registroMtc?: string;
  mtcVigencia?: string;
  materialesPeligrosos?: string;
  cuenta?: string;
  clienteAsociado?: string;
  capacidadCarga?: number;
  pesoBrutoVehicular?: number;
  tara?: number;
  capacidadPasajeros?: number;
  volumenCarga?: number;
  tipoCarroceria?: string;
  numeroSerieCarroceria?: string;
  tipoCombustible?: string;
  kilometraje?: number;
  ultimoMantenimientoFecha?: string;
  ultimoMantenimientoKilometraje?: number;
  proximoMantenimientoFecha?: string;
  proximoMantenimientoKilometraje?: number;
  mantenimientoObservacion?: string;
  fotos?: string[];
  estadoUnidad?: string;
}

export class ActualizarUnidadDto {
  placa?: string;
  clase?: string;
  tipoVehiculo?: string;
  categoriaVehicular?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  anioFabricacion?: number;
  color?: string;
  numeroEjes?: number;
  numeroMotor?: string;
  numeroVin?: string;
  registroMtc?: string;
  mtcVigencia?: string;
  materialesPeligrosos?: string;
  cuenta?: string;
  clienteAsociado?: string;
  capacidadCarga?: number;
  pesoBrutoVehicular?: number;
  tara?: number;
  capacidadPasajeros?: number;
  volumenCarga?: number;
  tipoCarroceria?: string;
  numeroSerieCarroceria?: string;
  tipoCombustible?: string;
  ultimoMantenimientoFecha?: string;
  ultimoMantenimientoKilometraje?: number;
  proximoMantenimientoFecha?: string;
  proximoMantenimientoKilometraje?: number;
  mantenimientoObservacion?: string;
  fotos?: string[];
  estadoUnidad?: string;
  estadoActivo?: string;
}

function exigirClase(valor: unknown): ClaseUnidad {
  if (!esClaseUnidad(valor)) {
    throw new DomainValidationError(
      `La clase de unidad no es valida. Use una de: ${Object.values(ClaseUnidad).join(', ')}.`,
      'clase',
      'INVALIDO',
      valor ?? null,
    );
  }
  return valor;
}

function resolverEstado(
  valor: unknown,
  porDefecto: EstadoUnidad,
): EstadoUnidad {
  if (valor === undefined || valor === null || valor === '') {
    return porDefecto;
  }
  if (!esEstadoUnidad(valor)) {
    throw new DomainValidationError(
      `El estado de la unidad no es valido. Use una de: ${Object.values(EstadoUnidad).join(', ')}.`,
      'estadoUnidad',
      'INVALIDO',
      valor,
    );
  }
  return valor;
}

// Campos descriptivos compartidos por crear/actualizar. Cada uno se aplica solo
// si venia en el DTO (para el PATCH parcial) — el llamador decide.
function camposComunes(
  dto: RegistrarUnidadDto | ActualizarUnidadDto,
  parcial: boolean,
): Partial<CrearUnidadData & ActualizarUnidadData> {
  const val = <T>(
    clave: keyof (RegistrarUnidadDto & ActualizarUnidadDto),
    fn: () => T,
  ) =>
    !parcial || (dto as Record<string, unknown>)[clave] !== undefined
      ? fn()
      : undefined;

  return {
    tipoVehiculo: val('tipoVehiculo', () => aTextoOpcional(dto.tipoVehiculo)),
    categoriaVehicular: val('categoriaVehicular', () =>
      aTextoOpcional(dto.categoriaVehicular),
    ),
    marca: val('marca', () => aTextoOpcional(dto.marca)),
    modelo: val('modelo', () => aTextoOpcional(dto.modelo)),
    anio: val('anio', () => anioRazonable(dto.anio, 'anio')),
    anioFabricacion: val('anioFabricacion', () =>
      anioRazonable(dto.anioFabricacion, 'anioFabricacion'),
    ),
    color: val('color', () => aTextoOpcional(dto.color)),
    numeroEjes: val('numeroEjes', () => numeroNoNegativo(dto.numeroEjes, 'numeroEjes', true)),
    numeroMotor: val('numeroMotor', () => aTextoOpcional(dto.numeroMotor)),
    numeroVin: val('numeroVin', () => aTextoOpcional(dto.numeroVin)),
    registroMtc: val('registroMtc', () => aTextoOpcional(dto.registroMtc)),
    mtcVigencia: val('mtcVigencia', () => fechaValida(dto.mtcVigencia, 'mtcVigencia')),
    materialesPeligrosos: val('materialesPeligrosos', () =>
      aTextoOpcional(dto.materialesPeligrosos),
    ),
    cuenta: val('cuenta', () => aTextoOpcional(dto.cuenta)),
    clienteAsociado: val('clienteAsociado', () =>
      aTextoOpcional(dto.clienteAsociado),
    ),
    capacidadCarga: val('capacidadCarga', () =>
      numeroNoNegativo(dto.capacidadCarga, 'capacidadCarga'),
    ),
    pesoBrutoVehicular: val('pesoBrutoVehicular', () =>
      numeroNoNegativo(dto.pesoBrutoVehicular, 'pesoBrutoVehicular'),
    ),
    tara: val('tara', () => numeroNoNegativo(dto.tara, 'tara')),
    capacidadPasajeros: val('capacidadPasajeros', () =>
      numeroNoNegativo(dto.capacidadPasajeros, 'capacidadPasajeros', true),
    ),
    volumenCarga: val('volumenCarga', () =>
      numeroNoNegativo(dto.volumenCarga, 'volumenCarga'),
    ),
    tipoCarroceria: val('tipoCarroceria', () =>
      aTextoOpcional(dto.tipoCarroceria),
    ),
    numeroSerieCarroceria: val('numeroSerieCarroceria', () =>
      aTextoOpcional(dto.numeroSerieCarroceria),
    ),
    tipoCombustible: val('tipoCombustible', () =>
      aTextoOpcional(dto.tipoCombustible),
    ),
    ultimoMantenimientoFecha: val('ultimoMantenimientoFecha', () =>
      fechaValida(dto.ultimoMantenimientoFecha, 'ultimoMantenimientoFecha'),
    ),
    ultimoMantenimientoKilometraje: val('ultimoMantenimientoKilometraje', () =>
      numeroNoNegativo(dto.ultimoMantenimientoKilometraje, 'ultimoMantenimientoKilometraje', true),
    ),
    proximoMantenimientoFecha: val('proximoMantenimientoFecha', () =>
      fechaValida(dto.proximoMantenimientoFecha, 'proximoMantenimientoFecha'),
    ),
    proximoMantenimientoKilometraje: val('proximoMantenimientoKilometraje', () =>
      numeroNoNegativo(dto.proximoMantenimientoKilometraje, 'proximoMantenimientoKilometraje', true),
    ),
    mantenimientoObservacion: val('mantenimientoObservacion', () =>
      aTextoOpcional(dto.mantenimientoObservacion),
    ),
    fotos: val('fotos', () => limpiarFotos(dto.fotos)),
  };
}

function validarMantenimiento(data: Pick<UnidadProps, 'kilometraje' | 'ultimoMantenimientoFecha' | 'ultimoMantenimientoKilometraje' | 'proximoMantenimientoFecha' | 'proximoMantenimientoKilometraje'>): void {
  if (data.ultimoMantenimientoFecha && data.proximoMantenimientoFecha && data.ultimoMantenimientoFecha > data.proximoMantenimientoFecha) throw new DomainValidationError('El proximo mantenimiento no puede ser anterior al ultimo.', 'proximoMantenimientoFecha', 'ORDEN_INVALIDO');
  const minimo = Math.max(data.kilometraje ?? 0, data.ultimoMantenimientoKilometraje ?? 0);
  if (data.proximoMantenimientoKilometraje !== null && data.proximoMantenimientoKilometraje < minimo) throw new DomainValidationError('El proximo kilometraje de mantenimiento no puede ser menor al kilometraje actual o ultimo mantenimiento.', 'proximoMantenimientoKilometraje', 'MENOR_AL_ACTUAL');
}

@Injectable()
export class RegistrarUnidadUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
  ) {}

  async execute(dto: RegistrarUnidadDto, actor: string): Promise<UnidadProps> {
    const placa = exigirPlaca(dto.placa);
    const clase = exigirClase(dto.clase);
    const estadoUnidad = resolverEstado(
      dto.estadoUnidad,
      EstadoUnidad.OPERATIVA,
    );
    const kilometrajeInicial = numeroNoNegativo(dto.kilometraje, 'kilometraje', true);

    const existente = await this.unidades.findByPlacaActiva(placa);
    if (existente) {
      throw new DomainValidationError(
        `Ya existe una unidad activa con la placa "${dto.placa}".`,
        'placa',
        'DUPLICADO',
        dto.placa,
      );
    }

    const comunes = camposComunes(dto, false) as Omit<CrearUnidadData, 'placa' | 'placaNormalizada' | 'clase' | 'estadoUnidad' | 'usuarioCreacion'>;
    validarMantenimiento({ ...(comunes as UnidadProps), kilometraje: kilometrajeInicial });
    return this.unidades.crear({
      placa: dto.placa.trim(),
      placaNormalizada: placa,
      clase,
      estadoUnidad,
      ...comunes,
      kilometraje: kilometrajeInicial,
      usuarioCreacion: actor,
    });
  }
}

@Injectable()
export class ListarUnidadesUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
  ) {}

  async execute(query: {
    placa?: string;
    clase?: string;
    estadoUnidad?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<UnidadProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );

    const { datos, total } = await this.unidades.buscar({
      placa: query.placa ? normalizarPlaca(query.placa) : undefined,
      clase: esClaseUnidad(query.clase) ? query.clase : undefined,
      estadoUnidad: esEstadoUnidad(query.estadoUnidad)
        ? query.estadoUnidad
        : undefined,
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      page,
      pageSize,
    });

    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}

@Injectable()
export class ObtenerUnidadUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
  ) {}

  async execute(id: number): Promise<UnidadProps> {
    const unidad = await this.unidades.findById(id);
    if (!unidad) {
      throw new RecursoNoEncontradoError(
        'La unidad indicada no existe.',
        'unidad',
        id,
      );
    }
    return unidad;
  }
}

@Injectable()
export class ActualizarUnidadUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
  ) {}

  async execute(
    id: number,
    dto: ActualizarUnidadDto,
    actor: string,
  ): Promise<UnidadProps> {
    const unidad = await this.unidades.findById(id);
    if (!unidad) {
      throw new RecursoNoEncontradoError(
        'La unidad indicada no existe.',
        'unidad',
        id,
      );
    }

    let placa: string | undefined;
    let placaNormalizada: string | undefined;
    if (dto.placa !== undefined) {
      placaNormalizada = exigirPlaca(dto.placa);
      placa = dto.placa.trim();
      const otra = await this.unidades.findByPlacaActiva(placaNormalizada);
      if (otra && otra.id !== id) {
        throw new DomainValidationError(
          `Ya existe otra unidad activa con la placa "${dto.placa}".`,
          'placa',
          'DUPLICADO',
          dto.placa,
        );
      }
    }

    const data: ActualizarUnidadData = {
      placa,
      placaNormalizada,
      clase: dto.clase !== undefined ? exigirClase(dto.clase) : undefined,
      estadoUnidad:
        dto.estadoUnidad !== undefined
          ? resolverEstado(dto.estadoUnidad, unidad.estadoUnidad)
          : undefined,
      estadoActivo:
        dto.estadoActivo === undefined
          ? undefined
          : esEstadoActivo(dto.estadoActivo)
            ? dto.estadoActivo
            : throwEstadoActivoInvalido(dto.estadoActivo),
      usuarioModificacion: actor,
      ...camposComunes(dto, true),
    };
    validarMantenimiento({
      kilometraje: unidad.kilometraje,
      ultimoMantenimientoFecha: data.ultimoMantenimientoFecha === undefined ? unidad.ultimoMantenimientoFecha : data.ultimoMantenimientoFecha,
      ultimoMantenimientoKilometraje: data.ultimoMantenimientoKilometraje === undefined ? unidad.ultimoMantenimientoKilometraje : data.ultimoMantenimientoKilometraje,
      proximoMantenimientoFecha: data.proximoMantenimientoFecha === undefined ? unidad.proximoMantenimientoFecha : data.proximoMantenimientoFecha,
      proximoMantenimientoKilometraje: data.proximoMantenimientoKilometraje === undefined ? unidad.proximoMantenimientoKilometraje : data.proximoMantenimientoKilometraje,
    });

    return this.unidades.actualizar(id, data);
  }
}

@Injectable()
export class AnularUnidadUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
  ) {}

  async execute(id: number, actor: string): Promise<UnidadProps> {
    const unidad = await this.unidades.findById(id);
    if (!unidad) {
      throw new RecursoNoEncontradoError(
        'La unidad indicada no existe.',
        'unidad',
        id,
      );
    }
    return this.unidades.anular(id, actor);
  }
}
