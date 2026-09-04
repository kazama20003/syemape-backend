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
import { aEnteroPositivo, aTextoOpcional } from '../../shared/dto/parseo.js';
import {
  UBICACION_REPOSITORY,
  type UbicacionProps,
  type UbicacionRepository,
} from '../domain/repositories/ubicacion.repository.js';
import {
  TipoUbicacion,
  esTipoUbicacion,
} from '../domain/value-objects/tipo-ubicacion.enum.js';
import {
  validarLatitud,
  validarLongitud,
} from '../domain/value-objects/coordenadas.vo.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;
const USUARIO_SISTEMA = 'sistema';

function throwEstadoActivoInvalido(valor: unknown): never {
  throw new DomainValidationError(
    'El estadoActivo no es valido. Use ACTIVO o INACTIVO.',
    'estadoActivo',
    'INVALIDO',
    valor,
  );
}


export class RegistrarUbicacionDto {
  nombre: string;
  tipo?: string;
  direccion?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  distrito?: string;
  provincia?: string;
  departamento?: string;
}

export class ActualizarUbicacionDto {
  nombre?: string;
  tipo?: string;
  direccion?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  estadoActivo?: string;
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

function resolverTipo(valor: unknown, porDefecto: TipoUbicacion): TipoUbicacion {
  if (valor === undefined || valor === null || valor === '') {
    return porDefecto;
  }
  if (!esTipoUbicacion(valor)) {
    throw new DomainValidationError(
      `El tipo de ubicacion no es valido. Use uno de: ${Object.values(TipoUbicacion).join(', ')}.`,
      'tipo',
      'INVALIDO',
      valor,
    );
  }
  return valor;
}

@Injectable()
export class RegistrarUbicacionUseCase {
  constructor(
    @Inject(UBICACION_REPOSITORY)
    private readonly ubicaciones: UbicacionRepository,
  ) {}

  async execute(dto: RegistrarUbicacionDto): Promise<UbicacionProps> {
    return this.ubicaciones.crear({
      nombre: exigirTexto(dto.nombre, 'nombre'),
      tipo: resolverTipo(dto.tipo, TipoUbicacion.GENERAL),
      direccion: aTextoOpcional(dto.direccion),
      referencia: aTextoOpcional(dto.referencia),
      latitud: validarLatitud(dto.latitud),
      longitud: validarLongitud(dto.longitud),
      distrito: aTextoOpcional(dto.distrito),
      provincia: aTextoOpcional(dto.provincia),
      departamento: aTextoOpcional(dto.departamento),
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class ListarUbicacionesUseCase {
  constructor(
    @Inject(UBICACION_REPOSITORY)
    private readonly ubicaciones: UbicacionRepository,
  ) {}

  async execute(query: {
    texto?: string;
    tipo?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<UbicacionProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );
    const { datos, total } = await this.ubicaciones.buscar({
      texto: aTextoOpcional(query.texto) ?? undefined,
      tipo: esTipoUbicacion(query.tipo) ? query.tipo : undefined,
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      page,
      pageSize,
    });
    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}

@Injectable()
export class ObtenerUbicacionUseCase {
  constructor(
    @Inject(UBICACION_REPOSITORY)
    private readonly ubicaciones: UbicacionRepository,
  ) {}

  async execute(id: number): Promise<UbicacionProps> {
    const ubicacion = await this.ubicaciones.findById(id);
    if (!ubicacion) {
      throw new RecursoNoEncontradoError(
        'La ubicacion indicada no existe.',
        'ubicacion',
        id,
      );
    }
    return ubicacion;
  }
}

@Injectable()
export class ActualizarUbicacionUseCase {
  constructor(
    @Inject(UBICACION_REPOSITORY)
    private readonly ubicaciones: UbicacionRepository,
  ) {}

  async execute(
    id: number,
    dto: ActualizarUbicacionDto,
  ): Promise<UbicacionProps> {
    const ubicacion = await this.ubicaciones.findById(id);
    if (!ubicacion) {
      throw new RecursoNoEncontradoError(
        'La ubicacion indicada no existe.',
        'ubicacion',
        id,
      );
    }
    return this.ubicaciones.actualizar(id, {
      nombre: dto.nombre !== undefined ? exigirTexto(dto.nombre, 'nombre') : undefined,
      tipo: dto.tipo !== undefined ? resolverTipo(dto.tipo, ubicacion.tipo) : undefined,
      direccion:
        dto.direccion !== undefined ? aTextoOpcional(dto.direccion) : undefined,
      referencia:
        dto.referencia !== undefined ? aTextoOpcional(dto.referencia) : undefined,
      latitud: dto.latitud !== undefined ? validarLatitud(dto.latitud) : undefined,
      longitud: dto.longitud !== undefined ? validarLongitud(dto.longitud) : undefined,
      distrito: dto.distrito !== undefined ? aTextoOpcional(dto.distrito) : undefined,
      provincia:
        dto.provincia !== undefined ? aTextoOpcional(dto.provincia) : undefined,
      departamento:
        dto.departamento !== undefined
          ? aTextoOpcional(dto.departamento)
          : undefined,
      estadoActivo:
        dto.estadoActivo === undefined
          ? undefined
          : esEstadoActivo(dto.estadoActivo)
            ? dto.estadoActivo
            : throwEstadoActivoInvalido(dto.estadoActivo),
      usuarioModificacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class AnularUbicacionUseCase {
  constructor(
    @Inject(UBICACION_REPOSITORY)
    private readonly ubicaciones: UbicacionRepository,
  ) {}

  async execute(id: number): Promise<UbicacionProps> {
    const ubicacion = await this.ubicaciones.findById(id);
    if (!ubicacion) {
      throw new RecursoNoEncontradoError(
        'La ubicacion indicada no existe.',
        'ubicacion',
        id,
      );
    }
    return this.ubicaciones.anular(id, USUARIO_SISTEMA);
  }
}
