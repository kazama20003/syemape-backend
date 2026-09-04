import { Inject, Injectable } from '@nestjs/common';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import { aTextoOpcional } from '../../shared/dto/parseo.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import {
  validarLatitud,
  validarLongitud,
} from '../../ubicaciones/domain/value-objects/coordenadas.vo.js';
import {
  EstadoSeguimiento,
  SEGUIMIENTO_REPOSITORY,
  SeguimientoProps,
  TipoCheckin,
  esEstadoSeguimiento,
  esTipoCheckin,
} from '../domain/seguimiento.repository.js';
import type { SeguimientoRepository } from '../domain/seguimiento.repository.js';

const USUARIO_SISTEMA = 'sistema';

// El tipo de check-in implica un estado de seguimiento por defecto.
const ESTADO_POR_CHECKIN: Record<TipoCheckin, EstadoSeguimiento | null> = {
  [TipoCheckin.SALIDA]: EstadoSeguimiento.EN_RUTA,
  [TipoCheckin.PUNTO_CONTROL]: EstadoSeguimiento.EN_RUTA,
  [TipoCheckin.UBICACION]: null,
  [TipoCheckin.INCIDENCIA]: EstadoSeguimiento.DETENIDO,
  [TipoCheckin.CIERRE]: EstadoSeguimiento.FINALIZADO,
};

export class RegistrarSeguimientoDto {
  tipo: string;
  rutaPuntoId?: number;
  estado?: string;
  latitud?: number;
  longitud?: number;
  fotoUrl?: string;
  observacion?: string;
  registradoPor?: string;
}

@Injectable()
export class RegistrarSeguimientoUseCase {
  constructor(
    @Inject(SEGUIMIENTO_REPOSITORY)
    private readonly seguimiento: SeguimientoRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    manifiestoId: number,
    dto: RegistrarSeguimientoDto,
  ): Promise<SeguimientoProps> {
    const manifiesto = await this.seguimiento.manifiestoActivo(manifiestoId);
    if (!manifiesto) {
      throw new RecursoNoEncontradoError(
        'El manifiesto indicado no existe.',
        'manifiesto',
        manifiestoId,
      );
    }
    if (!esTipoCheckin(dto.tipo)) {
      throw new DomainValidationError(
        `El tipo de check-in no es valido. Use uno de: ${Object.values(TipoCheckin).join(', ')}.`,
        'tipo',
        'INVALIDO',
        dto.tipo ?? null,
      );
    }

    const estado: EstadoSeguimiento | null = esEstadoSeguimiento(dto.estado)
      ? dto.estado
      : ESTADO_POR_CHECKIN[dto.tipo];

    const creado = await this.seguimiento.crear({
      manifiestoId,
      tipo: dto.tipo,
      rutaPuntoId:
        dto.rutaPuntoId && dto.rutaPuntoId > 0 ? Number(dto.rutaPuntoId) : null,
      estado,
      latitud: validarLatitud(dto.latitud),
      longitud: validarLongitud(dto.longitud),
      fotoUrl: aTextoOpcional(dto.fotoUrl),
      observacion: aTextoOpcional(dto.observacion),
      registradoPor: aTextoOpcional(dto.registradoPor) ?? USUARIO_SISTEMA,
    });

    // El check-in mueve el estado operativo del manifiesto (bitacora en ruta).
    if (estado) {
      await this.seguimiento.actualizarEstadoManifiesto(manifiestoId, estado);
    }

    await registrarHistorial(this.prisma, {
      entidad: 'seguimiento_manifiesto',
      entidadId: creado.id,
      entidadPublicId: creado.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: creado.registradoPor,
      datos: creado,
    });

    return creado;
  }
}

@Injectable()
export class ListarSeguimientosUseCase {
  constructor(
    @Inject(SEGUIMIENTO_REPOSITORY)
    private readonly seguimiento: SeguimientoRepository,
  ) {}

  async execute(manifiestoId: number): Promise<RespuestaDto<SeguimientoProps[]>> {
    const manifiesto = await this.seguimiento.manifiestoActivo(manifiestoId);
    if (!manifiesto) {
      throw new RecursoNoEncontradoError(
        'El manifiesto indicado no existe.',
        'manifiesto',
        manifiestoId,
      );
    }
    return { datos: await this.seguimiento.listarPorManifiesto(manifiestoId) };
  }
}
