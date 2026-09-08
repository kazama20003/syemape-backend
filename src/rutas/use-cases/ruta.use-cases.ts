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
import {
  UBICACION_REPOSITORY,
  type UbicacionRepository,
} from '../../ubicaciones/domain/repositories/ubicacion.repository.js';

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
  // Referencias al maestro de ubicaciones (preferidas). El texto libre de
  // origen/destino se mantiene por compatibilidad.
  ubicacionOrigenId?: number;
  ubicacionDestinoId?: number;
  origen?: string;
  destino?: string;
  distanciaKm?: number;
  duracionEstimadaHoras?: number;
  descripcion?: string;
}

export class ActualizarRutaDto {
  nombre?: string;
  ubicacionOrigenId?: number | null;
  ubicacionDestinoId?: number | null;
  origen?: string;
  destino?: string;
  distanciaKm?: number;
  duracionEstimadaHoras?: number;
  descripcion?: string;
  estadoActivo?: string;
}

function idOpcional(valor: unknown, campo: string): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new DomainValidationError(
      `El campo "${campo}" debe ser un id valido.`,
      campo,
      'INVALIDO',
      valor,
    );
  }
  return n;
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
  constructor(
    @Inject(RUTA_REPOSITORY) private readonly rutas: RutaRepository,
    @Inject(UBICACION_REPOSITORY)
    private readonly ubicaciones: UbicacionRepository,
  ) {}

  async execute(dto: RegistrarRutaDto): Promise<RutaProps> {
    // Origen/destino referencian el maestro de ubicaciones; el nombre visible
    // se deriva de la ubicacion. Texto libre solo si no se envia el id.
    const origen = await this.resolverExtremo(
      dto.ubicacionOrigenId,
      dto.origen,
      'origen',
    );
    const destino = await this.resolverExtremo(
      dto.ubicacionDestinoId,
      dto.destino,
      'destino',
    );

    return this.rutas.crear({
      nombre: exigirTexto(dto.nombre, 'nombre'),
      origen: origen.nombre,
      destino: destino.nombre,
      ubicacionOrigenId: origen.id,
      ubicacionDestinoId: destino.id,
      distanciaKm: aNumeroOpcional(dto.distanciaKm),
      duracionEstimadaHoras: aNumeroOpcional(dto.duracionEstimadaHoras),
      descripcion: aTextoOpcional(dto.descripcion),
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }

  private async resolverExtremo(
    ubicacionId: unknown,
    texto: unknown,
    campo: string,
  ): Promise<{ id: number | null; nombre: string }> {
    const id = idOpcional(ubicacionId, `ubicacion${campo === 'origen' ? 'Origen' : 'Destino'}Id`);
    if (id !== null) {
      const ubicacion = await this.ubicaciones.findById(id);
      if (!ubicacion) {
        throw new RecursoNoEncontradoError(
          `La ubicacion de ${campo} indicada no existe.`,
          'ubicacion',
          id,
        );
      }
      return { id, nombre: ubicacion.nombre };
    }
    return { id: null, nombre: exigirTexto(texto, campo) };
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
  constructor(
    @Inject(RUTA_REPOSITORY) private readonly rutas: RutaRepository,
    @Inject(UBICACION_REPOSITORY)
    private readonly ubicaciones: UbicacionRepository,
  ) {}

  async execute(id: number, dto: ActualizarRutaDto): Promise<RutaProps> {
    const ruta = await this.rutas.findById(id);
    if (!ruta) {
      throw new RecursoNoEncontradoError('La ruta indicada no existe.', 'ruta', id);
    }

    // Si se envia el id de ubicacion, manda sobre el texto libre: se valida y
    // el nombre visible se toma del maestro.
    let origen = dto.origen !== undefined ? exigirTexto(dto.origen, 'origen') : undefined;
    let ubicacionOrigenId: number | null | undefined;
    if (dto.ubicacionOrigenId !== undefined) {
      ubicacionOrigenId = idOpcional(dto.ubicacionOrigenId, 'ubicacionOrigenId');
      if (ubicacionOrigenId !== null) {
        const u = await this.ubicaciones.findById(ubicacionOrigenId);
        if (!u) {
          throw new RecursoNoEncontradoError(
            'La ubicacion de origen indicada no existe.',
            'ubicacion',
            ubicacionOrigenId,
          );
        }
        origen = u.nombre;
      }
    }
    let destino =
      dto.destino !== undefined ? exigirTexto(dto.destino, 'destino') : undefined;
    let ubicacionDestinoId: number | null | undefined;
    if (dto.ubicacionDestinoId !== undefined) {
      ubicacionDestinoId = idOpcional(dto.ubicacionDestinoId, 'ubicacionDestinoId');
      if (ubicacionDestinoId !== null) {
        const u = await this.ubicaciones.findById(ubicacionDestinoId);
        if (!u) {
          throw new RecursoNoEncontradoError(
            'La ubicacion de destino indicada no existe.',
            'ubicacion',
            ubicacionDestinoId,
          );
        }
        destino = u.nombre;
      }
    }

    return this.rutas.actualizar(id, {
      nombre: dto.nombre !== undefined ? exigirTexto(dto.nombre, 'nombre') : undefined,
      origen,
      destino,
      ubicacionOrigenId,
      ubicacionDestinoId,
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
