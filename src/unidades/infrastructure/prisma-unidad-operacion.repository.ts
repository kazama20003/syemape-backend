import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { DomainValidationError } from '../../shared/errors/domain-validation.error.js';
import { TipoActivo } from '../../activos/domain/value-objects/activo.enum.js';
import {
  AsignacionGpsUnidadProps,
  LecturaKilometrajeUnidadProps,
  UnidadOperacionRepository,
} from '../domain/repositories/unidad-operacion.repository.js';

const SELECT_GPS = {
  id: true,
  publicId: true,
  unidadId: true,
  activoId: true,
  fechaInicio: true,
  fechaFin: true,
  observacion: true,
} as const;

const SELECT_LECTURA = {
  id: true,
  publicId: true,
  unidadId: true,
  valor: true,
  fecha: true,
  fuente: true,
  observacion: true,
  registradoPor: true,
} as const;

@Injectable()
export class PrismaUnidadOperacionRepository
  implements UnidadOperacionRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async listarAsignacionesGps(
    unidadId: number,
  ): Promise<AsignacionGpsUnidadProps[]> {
    return this.prisma.asignacionGpsUnidad.findMany({
      where: { unidadId },
      select: SELECT_GPS,
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async asignarGps(data: {
    unidadId: number;
    activoId: number;
    fechaInicio: Date;
    observacion: string | null;
    actor: string;
  }): Promise<AsignacionGpsUnidadProps> {
    const fila = await this.prisma.$transaction(
      async (tx) => {
        const [unidad, activo, asignacionUnidad, asignacionActivo] =
          await Promise.all([
            tx.unidad.findFirst({
              where: {
                id: data.unidadId,
                estadoRegistro: EstadoRegistro.ACTIVO,
                estadoActivo: 'ACTIVO',
              },
              select: { id: true },
            }),
            tx.activo.findFirst({
              where: {
                id: data.activoId,
                tipo: TipoActivo.EQUIPO,
                estadoRegistro: EstadoRegistro.ACTIVO,
                estadoOperativo: 'OPERATIVO',
              },
              select: { id: true },
            }),
            tx.asignacionGpsUnidad.findFirst({
              where: { unidadId: data.unidadId, fechaFin: null },
              select: { id: true },
            }),
            tx.asignacionGpsUnidad.findFirst({
              where: { activoId: data.activoId, fechaFin: null },
              select: { id: true },
            }),
          ]);
        if (!unidad)
          throw new DomainValidationError(
            'La unidad debe estar activa para asignar GPS.',
            'unidadId',
          );
        if (!activo)
          throw new DomainValidationError(
            'El activo GPS debe ser un equipo operativo y activo.',
            'activoId',
          );
        if (asignacionUnidad)
          throw new DomainValidationError(
            'La unidad ya tiene un GPS activo asignado.',
            'unidadId',
            'SOLAPAMIENTO',
          );
        if (asignacionActivo)
          throw new DomainValidationError(
            'El GPS ya esta asignado a otra unidad.',
            'activoId',
            'SOLAPAMIENTO',
          );
        return tx.asignacionGpsUnidad.create({
          data: {
            publicId: uuidv7(),
            unidadId: data.unidadId,
            activoId: data.activoId,
            fechaInicio: data.fechaInicio,
            observacion: data.observacion,
            usuarioCreacion: data.actor,
          },
          select: SELECT_GPS,
        });
      },
      { isolationLevel: 'Serializable' },
    );
    await registrarHistorial(this.prisma, {
      entidad: 'asignacion_gps_unidad',
      entidadId: fila.id,
      entidadPublicId: fila.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: data.actor,
      datos: fila,
    });
    return fila;
  }

  async liberarGps(data: {
    unidadId: number;
    asignacionId: number;
    fechaFin: Date;
    observacion: string | null | undefined;
    actor: string;
  }): Promise<AsignacionGpsUnidadProps | null> {
    const actual = await this.prisma.asignacionGpsUnidad.findFirst({
      where: { id: data.asignacionId, unidadId: data.unidadId, fechaFin: null },
      select: { id: true, fechaInicio: true },
    });
    if (!actual) return null;
    if (data.fechaFin < actual.fechaInicio) {
      throw new DomainValidationError(
        'La fecha de liberacion no puede ser anterior al inicio.',
        'fechaFin',
      );
    }
    const fila = await this.prisma.asignacionGpsUnidad.update({
      where: { id: actual.id },
      data: {
        fechaFin: data.fechaFin,
        observacion: data.observacion,
        usuarioModificacion: data.actor,
        fechaModificacion: new Date(),
      },
      select: SELECT_GPS,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'asignacion_gps_unidad',
      entidadId: fila.id,
      entidadPublicId: fila.publicId,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.actor,
      datos: fila,
    });
    return fila;
  }

  async listarLecturas(
    unidadId: number,
  ): Promise<LecturaKilometrajeUnidadProps[]> {
    return this.prisma.lecturaKilometrajeUnidad.findMany({
      where: { unidadId },
      select: SELECT_LECTURA,
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    });
  }

  async registrarLectura(data: {
    unidadId: number;
    valor: number;
    fecha: Date;
    fuente: string | null;
    observacion: string | null;
    actor: string;
  }): Promise<LecturaKilometrajeUnidadProps> {
    return this.registrarKilometraje(data);
  }

  private async registrarKilometraje(data: {
    unidadId: number;
    valor: number;
    fecha: Date;
    fuente: string | null;
    observacion: string | null;
    actor: string;
  }): Promise<LecturaKilometrajeUnidadProps> {
    const fila = await this.prisma.$transaction(
      async (tx) => {
        const unidad = await tx.unidad.findUnique({
          where: { id: data.unidadId },
          select: { id: true, kilometraje: true },
        });
        if (!unidad) return null;
        const ultima = await tx.lecturaKilometrajeUnidad.findFirst({
          where: { unidadId: data.unidadId },
          orderBy: [{ valor: 'desc' }, { id: 'desc' }],
          select: { valor: true },
        });
        const minimo = Math.max(unidad.kilometraje ?? 0, ultima?.valor ?? 0);
        if (data.valor < minimo) {
          throw new DomainValidationError(
            'El kilometraje no puede ser menor que la ultima lectura o el kilometraje actual.',
            'valor',
            'MENOR_AL_ACTUAL',
            data.valor,
          );
        }
        await tx.unidad.update({
          where: { id: data.unidadId },
          data: {
            kilometraje: data.valor,
            usuarioModificacion: data.actor,
            fechaModificacion: new Date(),
          },
        });
        return tx.lecturaKilometrajeUnidad.create({
          data: {
            publicId: uuidv7(),
            unidadId: data.unidadId,
            valor: data.valor,
            fecha: data.fecha,
            fuente: data.fuente,
            observacion: data.observacion,
            registradoPor: data.actor,
          },
          select: SELECT_LECTURA,
        });
      },
      { isolationLevel: 'Serializable' },
    );
    if (!fila) throw new DomainValidationError('La unidad no existe.', 'unidadId');
    await registrarHistorial(this.prisma, {
      entidad: 'lectura_kilometraje_unidad',
      entidadId: fila.id,
      entidadPublicId: fila.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: data.actor,
      datos: fila,
    });
    return fila;
  }

}
