import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarTipoServicioData,
  BuscarTiposServicioFiltros,
  CrearTipoServicioData,
  TipoServicioProps,
  TipoServicioRepository,
} from '../domain/repositories/tipo-servicio.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  codigo: true,
  nombre: true,
  descripcion: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

type FilaTipoServicio = TipoServicioProps;

@Injectable()
export class PrismaTipoServicioRepository implements TipoServicioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<TipoServicioProps | null> {
    const row = await this.prisma.tipoServicio.findUnique({ where: { id }, select: SELECT });
    return (row as FilaTipoServicio | null) ?? null;
  }

  async findByPublicId(publicId: string): Promise<TipoServicioProps | null> {
    const row = await this.prisma.tipoServicio.findUnique({
      where: { publicId },
      select: SELECT,
    });
    return (row as FilaTipoServicio | null) ?? null;
  }

  async findByCodigo(codigo: string): Promise<TipoServicioProps | null> {
    const row = await this.prisma.tipoServicio.findUnique({
      where: { codigo },
      select: SELECT,
    });
    return (row as FilaTipoServicio | null) ?? null;
  }

  async crear(data: CrearTipoServicioData): Promise<TipoServicioProps> {
    const row = await this.prisma.tipoServicio.create({
      data: {
        publicId: uuidv7(),
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        usuarioCreacion: data.usuarioCreacion,
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'tipoServicio',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return row as FilaTipoServicio;
  }

  async actualizar(
    id: number,
    data: ActualizarTipoServicioData,
  ): Promise<TipoServicioProps> {
    const row = await this.prisma.tipoServicio.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        estadoActivo: data.estadoActivo,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'tipoServicio',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return row as FilaTipoServicio;
  }

  async anular(
    id: number,
    usuarioModificacion: string,
  ): Promise<TipoServicioProps> {
    const row = await this.prisma.tipoServicio.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'tipoServicio',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return row as FilaTipoServicio;
  }

  async buscar(
    filtros: BuscarTiposServicioFiltros,
  ): Promise<{ datos: TipoServicioProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      ...(filtros.texto
        ? {
            OR: [
              { nombre: { contains: filtros.texto, mode: 'insensitive' as const } },
              { codigo: { contains: filtros.texto, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.tipoServicio.findMany({
        where,
        select: SELECT,
        orderBy: { nombre: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.tipoServicio.count({ where }),
    ]);
    return { datos: rows as FilaTipoServicio[], total };
  }
}
