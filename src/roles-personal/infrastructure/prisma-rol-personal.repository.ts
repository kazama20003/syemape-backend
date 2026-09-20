import { Injectable } from '@nestjs/common';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import {
  type ActualizarRolPersonalData,
  type BuscarRolesPersonalFiltros,
  type CrearRolPersonalData,
  type RolPersonalProps,
  type RolPersonalRepository,
} from '../domain/repositories/rol-personal.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  codigo: true,
  nombre: true,
  descripcion: true,
  puedeConducir: true,
  puedeSupervisar: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

@Injectable()
export class PrismaRolPersonalRepository implements RolPersonalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<RolPersonalProps | null> {
    const row = await this.prisma.rolPersonal.findUnique({
      where: { id },
      select: SELECT,
    });
    return row as unknown as RolPersonalProps | null;
  }

  async findByCodigo(codigo: string): Promise<RolPersonalProps | null> {
    const row = await this.prisma.rolPersonal.findUnique({
      where: { codigo },
      select: SELECT,
    });
    return row as unknown as RolPersonalProps | null;
  }

  async findActivosByIds(ids: number[]): Promise<RolPersonalProps[]> {
    if (!ids.length) return [];
    const rows = await this.prisma.rolPersonal.findMany({
      where: {
        id: { in: ids },
        estadoRegistro: EstadoRegistro.ACTIVO,
        estadoActivo: 'ACTIVO',
      },
      select: SELECT,
    });
    return rows as unknown as RolPersonalProps[];
  }

  async crear(data: CrearRolPersonalData): Promise<RolPersonalProps> {
    const row = await this.prisma.rolPersonal.create({
      data: { publicId: uuidv7(), ...data },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'rolPersonal',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return row as unknown as RolPersonalProps;
  }

  async actualizar(
    id: number,
    data: ActualizarRolPersonalData,
  ): Promise<RolPersonalProps> {
    const row = await this.prisma.rolPersonal.update({
      where: { id },
      data: { ...data, fechaModificacion: new Date() },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'rolPersonal',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return row as unknown as RolPersonalProps;
  }

  async anular(
    id: number,
    usuarioModificacion: string,
  ): Promise<RolPersonalProps> {
    const row = await this.prisma.rolPersonal.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'rolPersonal',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return row as unknown as RolPersonalProps;
  }

  async buscar(
    filtros: BuscarRolesPersonalFiltros,
  ): Promise<{ datos: RolPersonalProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      ...(filtros.texto
        ? {
            OR: [
              {
                nombre: {
                  contains: filtros.texto,
                  mode: 'insensitive' as const,
                },
              },
              {
                codigo: {
                  contains: filtros.texto,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
    const [datos, total] = await Promise.all([
      this.prisma.rolPersonal.findMany({
        where,
        select: SELECT,
        orderBy: { nombre: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.rolPersonal.count({ where }),
    ]);
    return { datos: datos as unknown as RolPersonalProps[], total };
  }
}
