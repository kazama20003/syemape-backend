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
  ClaseUnidad,
  esClaseUnidad,
} from '../../unidades/domain/value-objects/clase-unidad.enum.js';
import {
  TIPO_VEHICULO_REPOSITORY,
  type TipoVehiculoProps,
  type TipoVehiculoRepository,
} from '../domain/repositories/tipo-vehiculo.repository.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;
const USUARIO_SISTEMA = 'sistema';

export class RegistrarTipoVehiculoDto {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  claseSugerida?: string;
  categoriaSugerida?: string;
}

export class ActualizarTipoVehiculoDto {
  nombre?: string;
  descripcion?: string;
  claseSugerida?: string | null;
  categoriaSugerida?: string | null;
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

// Valida la clase sugerida opcional contra el enum ClaseUnidad.
function aClaseSugerida(valor: unknown): ClaseUnidad | null {
  const texto = aTextoOpcional(valor);
  if (!texto) return null;
  const clase = texto.toUpperCase();
  if (!esClaseUnidad(clase)) {
    throw new DomainValidationError(
      'La claseSugerida no es valida. Use LIVIANO, PESADO, REMOLQUE, SEMIRREMOLQUE u OTRO.',
      'claseSugerida',
      'INVALIDO',
      valor,
    );
  }
  return clase;
}

function throwEstadoActivoInvalido(valor: unknown): never {
  throw new DomainValidationError(
    'El estadoActivo no es valido. Use ACTIVO o INACTIVO.',
    'estadoActivo',
    'INVALIDO',
    valor,
  );
}

// Deriva un codigo estable a partir del nombre (MAYUSCULAS con guion bajo).
function codigoDesde(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

@Injectable()
export class RegistrarTipoVehiculoUseCase {
  constructor(
    @Inject(TIPO_VEHICULO_REPOSITORY)
    private readonly tipos: TipoVehiculoRepository,
  ) {}

  async execute(dto: RegistrarTipoVehiculoDto): Promise<TipoVehiculoProps> {
    const nombre = exigirTexto(dto.nombre, 'nombre');
    const codigo = (aTextoOpcional(dto.codigo) ?? codigoDesde(nombre)).toUpperCase();

    const existente = await this.tipos.findByCodigo(codigo);
    if (existente) {
      throw new DomainValidationError(
        `Ya existe un tipo de vehiculo con el codigo "${codigo}".`,
        'codigo',
        'DUPLICADO',
        codigo,
      );
    }

    return this.tipos.crear({
      codigo,
      nombre,
      descripcion: aTextoOpcional(dto.descripcion),
      claseSugerida: aClaseSugerida(dto.claseSugerida),
      categoriaSugerida: aTextoOpcional(dto.categoriaSugerida)?.toUpperCase() ?? null,
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class ListarTiposVehiculoUseCase {
  constructor(
    @Inject(TIPO_VEHICULO_REPOSITORY)
    private readonly tipos: TipoVehiculoRepository,
  ) {}

  async execute(query: {
    texto?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<TipoVehiculoProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );
    const { datos, total } = await this.tipos.buscar({
      texto: aTextoOpcional(query.texto) ?? undefined,
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      page,
      pageSize,
    });
    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}

@Injectable()
export class ObtenerTipoVehiculoUseCase {
  constructor(
    @Inject(TIPO_VEHICULO_REPOSITORY)
    private readonly tipos: TipoVehiculoRepository,
  ) {}

  async execute(id: number): Promise<TipoVehiculoProps> {
    const tipo = await this.tipos.findById(id);
    if (!tipo) {
      throw new RecursoNoEncontradoError(
        'El tipo de vehiculo indicado no existe.',
        'tipoVehiculo',
        id,
      );
    }
    return tipo;
  }
}

@Injectable()
export class ActualizarTipoVehiculoUseCase {
  constructor(
    @Inject(TIPO_VEHICULO_REPOSITORY)
    private readonly tipos: TipoVehiculoRepository,
  ) {}

  async execute(
    id: number,
    dto: ActualizarTipoVehiculoDto,
  ): Promise<TipoVehiculoProps> {
    const tipo = await this.tipos.findById(id);
    if (!tipo) {
      throw new RecursoNoEncontradoError(
        'El tipo de vehiculo indicado no existe.',
        'tipoVehiculo',
        id,
      );
    }
    return this.tipos.actualizar(id, {
      nombre: dto.nombre !== undefined ? exigirTexto(dto.nombre, 'nombre') : undefined,
      descripcion:
        dto.descripcion !== undefined ? aTextoOpcional(dto.descripcion) : undefined,
      claseSugerida:
        dto.claseSugerida !== undefined ? aClaseSugerida(dto.claseSugerida) : undefined,
      categoriaSugerida:
        dto.categoriaSugerida !== undefined
          ? aTextoOpcional(dto.categoriaSugerida)?.toUpperCase() ?? null
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
export class AnularTipoVehiculoUseCase {
  constructor(
    @Inject(TIPO_VEHICULO_REPOSITORY)
    private readonly tipos: TipoVehiculoRepository,
  ) {}

  async execute(id: number): Promise<TipoVehiculoProps> {
    const tipo = await this.tipos.findById(id);
    if (!tipo) {
      throw new RecursoNoEncontradoError(
        'El tipo de vehiculo indicado no existe.',
        'tipoVehiculo',
        id,
      );
    }
    return this.tipos.anular(id, USUARIO_SISTEMA);
  }
}
