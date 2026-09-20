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
import { CloudinaryService } from '../infrastructure/cloudinary.service.js';
import {
  TIPO_VEHICULO_REPOSITORY,
  type TipoVehiculoRepository,
} from '../../tipos-vehiculo/domain/repositories/tipo-vehiculo.repository.js';
import { CUENTA_REPOSITORY, type CuentaRepository } from '../../cuentas/domain/repositories/cuenta.repository.js';
import { PROYECTO_REPOSITORY, type ProyectoRepository } from '../../proyectos/domain/repositories/proyecto.repository.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;

export interface ArchivoImagenSubida {
  buffer: Buffer;
  mimetype: string;
}

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

function numeroNoNegativo(
  valor: unknown,
  campo: string,
  entero = false,
): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = aNumeroOpcional(valor);
  if (numero === null || numero < 0 || (entero && !Number.isInteger(numero)))
    throw new DomainValidationError(
      `El campo "${campo}" debe ser ${entero ? 'un entero' : 'un numero'} no negativo.`,
      campo,
      'INVALIDO',
      valor,
    );
  return numero;
}

function anioRazonable(valor: unknown, campo: string): number | null {
  const anio = numeroNoNegativo(valor, campo, true);
  if (anio !== null && (anio < 1900 || anio > new Date().getFullYear() + 1))
    throw new DomainValidationError(
      `El campo "${campo}" debe estar entre 1900 y el proximo año.`,
      campo,
      'INVALIDO',
      valor,
    );
  return anio;
}

function fechaValida(valor: unknown, campo: string): Date | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const fecha = aFechaOpcional(valor);
  if (!fecha)
    throw new DomainValidationError(
      `El campo "${campo}" contiene una fecha invalida.`,
      campo,
      'INVALIDO',
      valor,
    );
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
  cuentaId?: number;
  proyectoId?: number;
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
  cuentaId?: number | null;
  proyectoId?: number | null;
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
    numeroEjes: val('numeroEjes', () =>
      numeroNoNegativo(dto.numeroEjes, 'numeroEjes', true),
    ),
    numeroMotor: val('numeroMotor', () => aTextoOpcional(dto.numeroMotor)),
    numeroVin: val('numeroVin', () => aTextoOpcional(dto.numeroVin)),
    registroMtc: val('registroMtc', () => aTextoOpcional(dto.registroMtc)),
    mtcVigencia: val('mtcVigencia', () =>
      fechaValida(dto.mtcVigencia, 'mtcVigencia'),
    ),
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
      numeroNoNegativo(
        dto.ultimoMantenimientoKilometraje,
        'ultimoMantenimientoKilometraje',
        true,
      ),
    ),
    proximoMantenimientoFecha: val('proximoMantenimientoFecha', () =>
      fechaValida(dto.proximoMantenimientoFecha, 'proximoMantenimientoFecha'),
    ),
    proximoMantenimientoKilometraje: val(
      'proximoMantenimientoKilometraje',
      () =>
        numeroNoNegativo(
          dto.proximoMantenimientoKilometraje,
          'proximoMantenimientoKilometraje',
          true,
        ),
    ),
    mantenimientoObservacion: val('mantenimientoObservacion', () =>
      aTextoOpcional(dto.mantenimientoObservacion),
    ),
    fotos: val('fotos', () => limpiarFotos(dto.fotos)),
  };
}

function validarMantenimiento(
  data: Pick<
    UnidadProps,
    | 'kilometraje'
    | 'ultimoMantenimientoFecha'
    | 'ultimoMantenimientoKilometraje'
    | 'proximoMantenimientoFecha'
    | 'proximoMantenimientoKilometraje'
  >,
): void {
  if (
    data.ultimoMantenimientoFecha &&
    data.proximoMantenimientoFecha &&
    data.ultimoMantenimientoFecha > data.proximoMantenimientoFecha
  )
    throw new DomainValidationError(
      'El proximo mantenimiento no puede ser anterior al ultimo.',
      'proximoMantenimientoFecha',
      'ORDEN_INVALIDO',
    );
  const minimo = Math.max(
    data.kilometraje ?? 0,
    data.ultimoMantenimientoKilometraje ?? 0,
  );
  if (
    data.proximoMantenimientoKilometraje !== null &&
    data.proximoMantenimientoKilometraje < minimo
  )
    throw new DomainValidationError(
      'El proximo kilometraje de mantenimiento no puede ser menor al kilometraje actual o ultimo mantenimiento.',
      'proximoMantenimientoKilometraje',
      'MENOR_AL_ACTUAL',
    );
}

@Injectable()
export class RegistrarUnidadUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
    @Inject(TIPO_VEHICULO_REPOSITORY)
    private readonly tiposVehiculo: TipoVehiculoRepository,
    @Inject(CUENTA_REPOSITORY) private readonly cuentas: CuentaRepository,
    @Inject(PROYECTO_REPOSITORY) private readonly proyectos: ProyectoRepository,
  ) {}

  async execute(dto: RegistrarUnidadDto, actor: string): Promise<UnidadProps> {
    const placa = exigirPlaca(dto.placa);
    const clasificacion = await this.resolverClasificacion(dto);
    const estadoUnidad = resolverEstado(
      dto.estadoUnidad,
      EstadoUnidad.OPERATIVA,
    );
    const kilometrajeInicial = numeroNoNegativo(
      dto.kilometraje,
      'kilometraje',
      true,
    );

    const existente = await this.unidades.findByPlacaActiva(placa);
    if (existente) {
      throw new DomainValidationError(
        `Ya existe una unidad activa con la placa "${dto.placa}".`,
        'placa',
        'DUPLICADO',
        dto.placa,
      );
    }

    const comunes = { ...(camposComunes(dto, false) as Omit<
      CrearUnidadData,
      | 'placa'
      | 'placaNormalizada'
      | 'clase'
      | 'estadoUnidad'
      | 'usuarioCreacion'
    >), ...(await this.resolverAsignacion(dto)) };
    validarMantenimiento({
      ...(comunes as UnidadProps),
      kilometraje: kilometrajeInicial,
    });
    return this.unidades.crear({
      placa: dto.placa.trim(),
      placaNormalizada: placa,
      estadoUnidad,
      ...comunes,
      ...clasificacion,
      kilometraje: kilometrajeInicial,
      usuarioCreacion: actor,
    });
  }

  async resolverAsignacion(dto: Pick<RegistrarUnidadDto | ActualizarUnidadDto, 'cuentaId' | 'proyectoId'>) {
    const cuentaId = dto.cuentaId === undefined || dto.cuentaId === null ? null : Number(dto.cuentaId);
    const proyectoId = dto.proyectoId === undefined || dto.proyectoId === null ? null : Number(dto.proyectoId);
    if (cuentaId !== null && (!Number.isInteger(cuentaId) || cuentaId <= 0)) throw new DomainValidationError('La cuenta debe ser válida.', 'cuentaId', 'INVALIDO');
    if (proyectoId !== null && (!Number.isInteger(proyectoId) || proyectoId <= 0)) throw new DomainValidationError('El proyecto debe ser válido.', 'proyectoId', 'INVALIDO');
    if (cuentaId === null && proyectoId === null) return { cuentaId: null, proyectoId: null, cuenta: null };
    const cuenta = cuentaId === null ? null : await this.cuentas.findById(cuentaId);
    if (cuentaId !== null && (!cuenta || cuenta.estadoRegistro !== EstadoRegistro.ACTIVO || cuenta.estadoActivo !== 'ACTIVO')) throw new RecursoNoEncontradoError('La cuenta indicada no existe o está inactiva.', 'cuentaId', cuentaId);
    const proyecto = proyectoId === null ? null : await this.proyectos.findById(proyectoId);
    if (proyectoId !== null && (!proyecto || proyecto.estadoRegistro !== EstadoRegistro.ACTIVO || proyecto.estadoActivo !== 'ACTIVO' || (cuentaId !== null && proyecto.cuentaId !== cuentaId))) throw new RecursoNoEncontradoError('El proyecto indicado no existe, está inactivo o no pertenece a la cuenta.', 'proyectoId', proyectoId);
    return { cuentaId: cuentaId ?? proyecto!.cuentaId, proyectoId, cuenta: proyecto?.nombre ?? cuenta!.nombre };
  }

  private async resolverClasificacion(
    dto: Pick<
      RegistrarUnidadDto | ActualizarUnidadDto,
      'tipoVehiculo' | 'clase' | 'categoriaVehicular'
    >,
  ): Promise<{
    tipoVehiculo: string | null;
    clase: ClaseUnidad;
    categoriaVehicular: string | null;
  }> {
    const codigo = aTextoOpcional(dto.tipoVehiculo)?.toUpperCase() ?? null;
    if (!codigo) {
      return {
        tipoVehiculo: null,
        clase: exigirClase(dto.clase),
        categoriaVehicular:
          aTextoOpcional(dto.categoriaVehicular)?.toUpperCase() ?? null,
      };
    }
    const tipo = await this.tiposVehiculo.findByCodigo(codigo);
    if (
      !tipo ||
      tipo.estadoRegistro !== EstadoRegistro.ACTIVO ||
      tipo.estadoActivo !== 'ACTIVO'
    ) {
      throw new RecursoNoEncontradoError(
        'El tipo de vehiculo indicado no existe o esta inactivo.',
        'tipoVehiculo',
        codigo,
      );
    }
    return {
      tipoVehiculo: tipo.codigo,
      clase: tipo.claseSugerida ?? exigirClase(dto.clase),
      categoriaVehicular: tipo.categoriaSugerida,
    };
  }
}

@Injectable()
export class ListarUnidadesUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
  ) {}

  async execute(query: {
    placa?: string;
    color?: string;
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
      color: aTextoOpcional(query.color) ?? undefined,
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
    @Inject(TIPO_VEHICULO_REPOSITORY)
    private readonly tiposVehiculo: TipoVehiculoRepository,
    @Inject(CUENTA_REPOSITORY) private readonly cuentas: CuentaRepository,
    @Inject(PROYECTO_REPOSITORY) private readonly proyectos: ProyectoRepository,
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

    const modificarClasificacion =
      dto.tipoVehiculo !== undefined ||
      dto.clase !== undefined ||
      dto.categoriaVehicular !== undefined;
    const clasificacion = modificarClasificacion
      ? await this.resolverClasificacion({
          tipoVehiculo: dto.tipoVehiculo ?? unidad.tipoVehiculo ?? undefined,
          clase: dto.clase ?? unidad.clase,
          categoriaVehicular:
            dto.categoriaVehicular ?? unidad.categoriaVehicular ?? undefined,
        })
      : undefined;
    const modificarAsignacion = dto.cuentaId !== undefined || dto.proyectoId !== undefined;
    const asignacion = modificarAsignacion ? await new RegistrarUnidadUseCase(this.unidades, this.tiposVehiculo, this.cuentas, this.proyectos).resolverAsignacion(dto) : undefined;
    const data: ActualizarUnidadData = {
      placa,
      placaNormalizada,
      clase: clasificacion?.clase,
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
      ...asignacion,
      ...(clasificacion
        ? {
            tipoVehiculo: clasificacion.tipoVehiculo,
            categoriaVehicular: clasificacion.categoriaVehicular,
          }
        : {}),
    };
    validarMantenimiento({
      kilometraje: unidad.kilometraje,
      ultimoMantenimientoFecha:
        data.ultimoMantenimientoFecha === undefined
          ? unidad.ultimoMantenimientoFecha
          : data.ultimoMantenimientoFecha,
      ultimoMantenimientoKilometraje:
        data.ultimoMantenimientoKilometraje === undefined
          ? unidad.ultimoMantenimientoKilometraje
          : data.ultimoMantenimientoKilometraje,
      proximoMantenimientoFecha:
        data.proximoMantenimientoFecha === undefined
          ? unidad.proximoMantenimientoFecha
          : data.proximoMantenimientoFecha,
      proximoMantenimientoKilometraje:
        data.proximoMantenimientoKilometraje === undefined
          ? unidad.proximoMantenimientoKilometraje
          : data.proximoMantenimientoKilometraje,
    });

    return this.unidades.actualizar(id, data);
  }

  private async resolverClasificacion(
    dto: Pick<
      RegistrarUnidadDto | ActualizarUnidadDto,
      'tipoVehiculo' | 'clase' | 'categoriaVehicular'
    >,
  ): Promise<{
    tipoVehiculo: string | null;
    clase: ClaseUnidad;
    categoriaVehicular: string | null;
  }> {
    const codigo = aTextoOpcional(dto.tipoVehiculo)?.toUpperCase() ?? null;
    if (!codigo) {
      return {
        tipoVehiculo: null,
        clase: exigirClase(dto.clase),
        categoriaVehicular:
          aTextoOpcional(dto.categoriaVehicular)?.toUpperCase() ?? null,
      };
    }
    const tipo = await this.tiposVehiculo.findByCodigo(codigo);
    if (!tipo || tipo.estadoRegistro !== EstadoRegistro.ACTIVO) {
      throw new RecursoNoEncontradoError(
        'El tipo de vehiculo indicado no existe.',
        'tipoVehiculo',
        codigo,
      );
    }
    return {
      tipoVehiculo: tipo.codigo,
      clase: tipo.claseSugerida ?? exigirClase(dto.clase),
      categoriaVehicular: tipo.categoriaSugerida,
    };
  }
}

@Injectable()
export class SubirFotosUnidadUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(
    id: number,
    archivos: ArchivoImagenSubida[],
    actor: string,
  ): Promise<UnidadProps> {
    if (archivos.length === 0) {
      throw new DomainValidationError(
        'Seleccione al menos una imagen.',
        'files',
      );
    }
    if (archivos.some((archivo) => !archivo.mimetype.startsWith('image/'))) {
      throw new DomainValidationError(
        'Solo se permiten archivos de imagen.',
        'files',
      );
    }

    const unidad = await this.unidades.findById(id);
    if (!unidad) {
      throw new RecursoNoEncontradoError(
        'La unidad indicada no existe.',
        'unidad',
        id,
      );
    }
    if (unidad.fotos.length + archivos.length > 20) {
      throw new DomainValidationError(
        'Una unidad admite como maximo 20 fotos.',
        'files',
      );
    }

    const fotos = await this.cloudinary.subirFotosUnidad(
      id,
      archivos.map((archivo) => archivo.buffer),
    );
    return this.unidades.actualizar(id, {
      fotos: [...unidad.fotos, ...fotos],
      usuarioModificacion: actor,
    });
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
