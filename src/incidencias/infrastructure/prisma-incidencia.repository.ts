import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarIncidenciaData,
  BuscarIncidenciasFiltros,
  CrearIncidenciaData,
  IncidenciaProps,
  IncidenciaRepository,
} from '../domain/incidencia.repository.js';

const INCLUDE = { evidencias: true } as const;

type Dec = { toNumber(): number } | null;
const dec = (v: Dec) => v?.toNumber() ?? null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aProps(f: any): IncidenciaProps {
  return {
    id: f.id,
    publicId: f.publicId,
    manifiestoId: f.manifiestoId,
    tipo: f.tipo,
    criticidad: f.criticidad,
    estado: f.estado,
    descripcion: f.descripcion,
    latitud: dec(f.latitud),
    longitud: dec(f.longitud),
    responsable: f.responsable,
    accionesTomadas: f.accionesTomadas,
    reportadoPor: f.reportadoPor,
    fechaReporte: f.fechaReporte,
    fechaResolucion: f.fechaResolucion,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evidencias: (f.evidencias ?? []).map((e: any) => ({
      id: e.id,
      tipo: e.tipo,
      url: e.url,
      descripcion: e.descripcion,
    })),
    estadoRegistro: f.estadoRegistro,
  };
}

@Injectable()
export class PrismaIncidenciaRepository implements IncidenciaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async manifiestoActivo(id: number): Promise<{ id: number } | null> {
    return this.prisma.manifiesto.findFirst({
      where: { id, estadoRegistro: EstadoRegistro.ACTIVO },
      select: { id: true },
    });
  }

  async findById(id: number): Promise<IncidenciaProps | null> {
    const row = await this.prisma.incidencia.findUnique({ where: { id }, include: INCLUDE });
    return row ? aProps(row) : null;
  }

  async crear(data: CrearIncidenciaData): Promise<IncidenciaProps> {
    const row = await this.prisma.incidencia.create({
      data: {
        publicId: uuidv7(),
        manifiestoId: data.manifiestoId,
        tipo: data.tipo,
        criticidad: data.criticidad,
        descripcion: data.descripcion,
        latitud: data.latitud,
        longitud: data.longitud,
        responsable: data.responsable,
        reportadoPor: data.reportadoPor,
        usuarioCreacion: data.usuarioCreacion,
        evidencias: { create: data.evidencias },
      },
      include: INCLUDE,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'incidencia',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return aProps(row);
  }

  async actualizar(
    id: number,
    data: ActualizarIncidenciaData,
  ): Promise<IncidenciaProps> {
    const row = await this.prisma.incidencia.update({
      where: { id },
      data: {
        criticidad: data.criticidad,
        estado: data.estado,
        descripcion: data.descripcion,
        responsable: data.responsable,
        accionesTomadas: data.accionesTomadas,
        fechaResolucion: data.fechaResolucion,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      include: INCLUDE,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'incidencia',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return aProps(row);
  }

  async agregarEvidencia(
    incidenciaId: number,
    data: { tipo: IncidenciaProps['evidencias'][number]['tipo']; url: string; descripcion: string | null },
  ): Promise<IncidenciaProps> {
    await this.prisma.evidenciaIncidencia.create({
      data: {
        incidenciaId,
        tipo: data.tipo,
        url: data.url,
        descripcion: data.descripcion,
      },
    });
    const row = await this.prisma.incidencia.findUnique({
      where: { id: incidenciaId },
      include: INCLUDE,
    });
    return aProps(row);
  }

  async buscar(
    filtros: BuscarIncidenciasFiltros,
  ): Promise<{ datos: IncidenciaProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      manifiestoId: filtros.manifiestoId ?? undefined,
      tipo: filtros.tipo ?? undefined,
      criticidad: filtros.criticidad ?? undefined,
      estado: filtros.estado ?? undefined,
    };
    const [rows, total] = await Promise.all([
      this.prisma.incidencia.findMany({
        where,
        include: INCLUDE,
        orderBy: { fechaReporte: 'desc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.incidencia.count({ where }),
    ]);
    return { datos: rows.map(aProps), total };
  }
}
