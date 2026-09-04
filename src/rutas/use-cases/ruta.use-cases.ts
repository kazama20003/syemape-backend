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
  aNumeroOpcional,
  aTextoOpcional,
} from '../../shared/dto/parseo.js';
import {
  RUTA_REPOSITORY,
  type RutaProps,
  type RutaRepository,
} from '../domain/repositories/ruta.repository.js';

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


export class RegistrarRutaDto {
  nombre: string;
  origen: string;
  destino: string;
  distanciaKm?: number;
  duracionEstimadaHoras?: number;
  descripcion?: string;
}

export class ActualizarRutaDto {
  nombre?: string;
  origen?: string;
  destino?: string;
  distanciaKm?: number;
  duracionEstimadaHoras?: number;
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

@Injectable()
export class RegistrarRutaUseCase {
  constructor(@Inject(RUTA_REPOSITORY) private readonly rutas: RutaRepository) {}

  async execute(dto: RegistrarRutaDto): Promise<RutaProps> {
    return this.rutas.crear({
      nombre: exigirTexto(dto.nombre, 'nombre'),
      origen: exigirTexto(dto.origen, 'origen'),
      destino: exigirTexto(dto.destino, 'destino'),
      distanciaKm: aNumeroOpcional(dto.distanciaKm),
      duracionEstimadaHoras: aNumeroOpcional(dto.duracionEstimadaHoras),
      descripcion: aTextoOpcional(dto.descripcion),
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class ListarRutasUseCase {
  constructor(@Inject(RUTA_REPOSITORY) private readonly rutas: RutaRepository) {}

  async execute(query: {
    texto?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<RutaProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );

    const { datos, total } = await this.rutas.buscar({
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
export class ObtenerRutaUseCase {
  constructor(@Inject(RUTA_REPOSITORY) private readonly rutas: RutaRepository) {}

  async execute(id: number): Promise<RutaProps> {
    const ruta = await this.rutas.findById(id);
    if (!ruta) {
      throw new RecursoNoEncontradoError('La ruta indicada no existe.', 'ruta', id);
    }
    return ruta;
  }
}

@Injectable()
export class ActualizarRutaUseCase {
  constructor(@Inject(RUTA_REPOSITORY) private readonly rutas: RutaRepository) {}

  async execute(id: number, dto: ActualizarRutaDto): Promise<RutaProps> {
    const ruta = await this.rutas.findById(id);
    if (!ruta) {
      throw new RecursoNoEncontradoError('La ruta indicada no existe.', 'ruta', id);
    }

    return this.rutas.actualizar(id, {
      nombre: dto.nombre !== undefined ? exigirTexto(dto.nombre, 'nombre') : undefined,
      origen: dto.origen !== undefined ? exigirTexto(dto.origen, 'origen') : undefined,
      destino:
        dto.destino !== undefined ? exigirTexto(dto.destino, 'destino') : undefined,
      distanciaKm:
        dto.distanciaKm !== undefined ? aNumeroOpcional(dto.distanciaKm) : undefined,
      duracionEstimadaHoras:
        dto.duracionEstimadaHoras !== undefined
          ? aNumeroOpcional(dto.duracionEstimadaHoras)
          : undefined,
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
export class AnularRutaUseCase {
  constructor(@Inject(RUTA_REPOSITORY) private readonly rutas: RutaRepository) {}

  async execute(id: number): Promise<RutaProps> {
    const ruta = await this.rutas.findById(id);
    if (!ruta) {
      throw new RecursoNoEncontradoError('La ruta indicada no existe.', 'ruta', id);
    }
    return this.rutas.anular(id, USUARIO_SISTEMA);
  }
}
