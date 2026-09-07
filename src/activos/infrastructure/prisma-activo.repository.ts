import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import {
  ActualizarActivoData,
  ActivoProps,
  ActivoRepository,
  BuscarActivosFiltros,
  CrearActivoData,
} from '../domain/repositories/activo.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  codigo: true,
  nombre: true,
  tipo: true,
  subtipo: true,
  descripcion: true,
  estadoOperativo: true,
  fechaAdquisicion: true,
  valorAdquisicion: true,
  vidaUtilMeses: true,
  proveedor: true,
  numeroSerie: true,
  responsableId: true,
  ubicacionHabitualId: true,
  estadoRegistro: true,
} as const;

type FilaActivo = Omit<ActivoProps, 'valorAdquisicion'> & {
  valorAdquisicion: { toNumber(): number } | null;
};

function aProps(fila: FilaActivo): ActivoProps {
  return {
    ...fila,
    valorAdquisicion: fila.valorAdquisicion?.toNumber() ?? null,
  };
}

@Injectable()
export class PrismaActivoRepository implements ActivoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<ActivoProps | null> {
    const row = await this.prisma.activo.findUnique({
      where: { id },
      select: SELECT,
    });
    return row ? aProps(row as FilaActivo) : null;
  }

  async findByCodigo(codigo: string): Promise<ActivoProps | null> {
    const row = await this.prisma.activo.findUnique({
      where: { codigo },
      select: SELECT,
    });
    return row ? aProps(row as FilaActivo) : null;
  }

  async crear(data: CrearActivoData): Promise<ActivoProps> {
    const row = await this.prisma.activo.create({
      data: { publicId: uuidv7(), ...data },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'activo',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return aProps(row as FilaActivo);
  }

  async actualizar(
    id: number,
    data: ActualizarActivoData,
  ): Promise<ActivoProps> {
    const row = await this.prisma.activo.update({
      where: { id },
      data: { ...data, fechaModificacion: new Date() },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'activo',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaActivo);
  }

  async anular(id: number, usuarioModificacion: string): Promise<ActivoProps> {
    const row = await this.prisma.activo.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'activo',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaActivo);
  }

  async buscar(
    filtros: BuscarActivosFiltros,
  ): Promise<{ datos: ActivoProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      tipo: filtros.tipo ?? undefined,
      estadoOperativo: filtros.estadoOperativo ?? undefined,
      responsableId: filtros.responsableId ?? undefined,
      ubicacionHabitualId: filtros.ubicacionHabitualId ?? undefined,
      ...(filtros.codigo
        ? { codigo: { contains: filtros.codigo, mode: 'insensitive' as const } }
        : {}),
      ...(filtros.texto
        ? {
            OR: [
              {
                codigo: {
                  contains: filtros.texto,
                  mode: 'insensitive' as const,
                },
              },
              {
                nombre: {
                  contains: filtros.texto,
                  mode: 'insensitive' as const,
                },
              },
              {
                descripcion: {
                  contains: filtros.texto,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.activo.findMany({
        where,
        select: SELECT,
        orderBy: { codigo: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.activo.count({ where }),
    ]);
    return { datos: (rows as FilaActivo[]).map(aProps), total };
  }
}
