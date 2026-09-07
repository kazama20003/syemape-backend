import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarDocumentoData,
  CrearDocumentoData,
  DocumentoProps,
  DocumentoRepository,
} from '../domain/documento.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  personalId: true,
  tipo: true,
  nombre: true,
  numero: true,
  fechaEmision: true,
  fechaVencimiento: true,
  archivoUrl: true,
  observacion: true,
  estadoRegistro: true,
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aProps(f: any): DocumentoProps {
  return {
    id: f.id,
    publicId: f.publicId,
    padreId: f.personalId,
    tipo: f.tipo,
    nombre: f.nombre,
    numero: f.numero,
    fechaEmision: f.fechaEmision,
    fechaVencimiento: f.fechaVencimiento,
    archivoUrl: f.archivoUrl,
    observacion: f.observacion,
    estadoRegistro: f.estadoRegistro,
  };
}

@Injectable()
export class PrismaDocumentoPersonalRepository implements DocumentoRepository {
  readonly entidad = 'documento_personal';
  constructor(private readonly prisma: PrismaService) {}

  async padreActivo(padreId: number): Promise<{ id: number } | null> {
    return this.prisma.personal.findFirst({
      where: { id: padreId, estadoRegistro: EstadoRegistro.ACTIVO },
      select: { id: true },
    });
  }

  async findById(id: number): Promise<DocumentoProps | null> {
    const row = await this.prisma.documentoPersonal.findUnique({ where: { id }, select: SELECT });
    return row ? aProps(row) : null;
  }

  async listarPorPadre(padreId: number): Promise<DocumentoProps[]> {
    const rows = await this.prisma.documentoPersonal.findMany({
      where: { personalId: padreId, estadoRegistro: EstadoRegistro.ACTIVO },
      select: SELECT,
      orderBy: { fechaVencimiento: 'asc' },
    });
    return rows.map(aProps);
  }

  async crear(data: CrearDocumentoData): Promise<DocumentoProps> {
    const row = await this.prisma.documentoPersonal.create({
      data: {
        publicId: uuidv7(),
        personalId: data.padreId,
        tipo: data.tipo,
        nombre: data.nombre,
        numero: data.numero,
        fechaEmision: data.fechaEmision,
        fechaVencimiento: data.fechaVencimiento,
        archivoUrl: data.archivoUrl,
        observacion: data.observacion,
        usuarioCreacion: data.usuarioCreacion,
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: this.entidad,
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return aProps(row);
  }

  async actualizar(
    padreId: number, id: number,
    data: ActualizarDocumentoData,
  ): Promise<DocumentoProps | null> {
    const actualizado = await this.prisma.documentoPersonal.updateMany({
      where: { id, personalId: padreId },
      data: {
        tipo: data.tipo,
        nombre: data.nombre,
        numero: data.numero,
        fechaEmision: data.fechaEmision,
        fechaVencimiento: data.fechaVencimiento,
        archivoUrl: data.archivoUrl,
        observacion: data.observacion,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
    });
    if (!actualizado.count) return null;
    const row = await this.prisma.documentoPersonal.findUniqueOrThrow({ where: { id }, select: SELECT });
    await registrarHistorial(this.prisma, {
      entidad: this.entidad,
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return aProps(row);
  }

  async anular(padreId: number, id: number, usuarioModificacion: string): Promise<DocumentoProps | null> {
    const actualizado = await this.prisma.documentoPersonal.updateMany({
      where: { id, personalId: padreId },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
    });
    if (!actualizado.count) return null;
    const row = await this.prisma.documentoPersonal.findUniqueOrThrow({ where: { id }, select: SELECT });
    await registrarHistorial(this.prisma, {
      entidad: this.entidad,
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return aProps(row);
  }
}
