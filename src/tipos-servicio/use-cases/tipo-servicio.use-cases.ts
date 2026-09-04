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
  TIPO_SERVICIO_REPOSITORY,
  type TipoServicioProps,
  type TipoServicioRepository,
} from '../domain/repositories/tipo-servicio.repository.js';

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


export class RegistrarTipoServicioDto {
  codigo?: string;
  nombre: string;
  descripcion?: string;
}

export class ActualizarTipoServicioDto {
  nombre?: string;
  descripcion?: string;
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
export class RegistrarTipoServicioUseCase {
  constructor(
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tipos: TipoServicioRepository,
  ) {}

  async execute(dto: RegistrarTipoServicioDto): Promise<TipoServicioProps> {
    const nombre = exigirTexto(dto.nombre, 'nombre');
    const codigo = (aTextoOpcional(dto.codigo) ?? codigoDesde(nombre)).toUpperCase();

    const existente = await this.tipos.findByCodigo(codigo);
    if (existente) {
      throw new DomainValidationError(
        `Ya existe un tipo de servicio con el codigo "${codigo}".`,
        'codigo',
        'DUPLICADO',
        codigo,
      );
    }

    return this.tipos.crear({
      codigo,
      nombre,
      descripcion: aTextoOpcional(dto.descripcion),
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class ListarTiposServicioUseCase {
  constructor(
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tipos: TipoServicioRepository,
  ) {}

  async execute(query: {
    texto?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<TipoServicioProps>> {
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
export class ObtenerTipoServicioUseCase {
  constructor(
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tipos: TipoServicioRepository,
  ) {}

  async execute(id: number): Promise<TipoServicioProps> {
    const tipo = await this.tipos.findById(id);
    if (!tipo) {
      throw new RecursoNoEncontradoError(
        'El tipo de servicio indicado no existe.',
        'tipoServicio',
        id,
      );
    }
    return tipo;
  }
}

@Injectable()
export class ActualizarTipoServicioUseCase {
  constructor(
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tipos: TipoServicioRepository,
  ) {}

  async execute(
    id: number,
    dto: ActualizarTipoServicioDto,
  ): Promise<TipoServicioProps> {
    const tipo = await this.tipos.findById(id);
    if (!tipo) {
      throw new RecursoNoEncontradoError(
        'El tipo de servicio indicado no existe.',
        'tipoServicio',
        id,
      );
    }
    return this.tipos.actualizar(id, {
      nombre: dto.nombre !== undefined ? exigirTexto(dto.nombre, 'nombre') : undefined,
      descripcion:
        dto.descripcion !== undefined ? aTextoOpcional(dto.descripcion) : undefined,
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
export class AnularTipoServicioUseCase {
  constructor(
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tipos: TipoServicioRepository,
  ) {}

  async execute(id: number): Promise<TipoServicioProps> {
    const tipo = await this.tipos.findById(id);
    if (!tipo) {
      throw new RecursoNoEncontradoError(
        'El tipo de servicio indicado no existe.',
        'tipoServicio',
        id,
      );
    }
    return this.tipos.anular(id, USUARIO_SISTEMA);
  }
}
