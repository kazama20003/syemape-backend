import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarTipoVehiculoData,
  BuscarTiposVehiculoFiltros,
  CrearTipoVehiculoData,
  TipoVehiculoProps,
  TipoVehiculoRepository,
} from '../domain/repositories/tipo-vehiculo.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  codigo: true,
  nombre: true,
  descripcion: true,
  claseSugerida: true,
  categoriaSugerida: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

type FilaTipoVehiculo = TipoVehiculoProps;

@Injectable()
export class PrismaTipoVehiculoRepository implements TipoVehiculoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<TipoVehiculoProps | null> {
    const row = await this.prisma.tipoVehiculo.findUnique({ where: { id }, select: SELECT });
    return (row as FilaTipoVehiculo | null) ?? null;
  }

  async findByPublicId(publicId: string): Promise<TipoVehiculoProps | null> {
    const row = await this.prisma.tipoVehiculo.findUnique({
      where: { publicId },
      select: SELECT,
    });
    return (row as FilaTipoVehiculo | null) ?? null;
  }

  async findByCodigo(codigo: string): Promise<TipoVehiculoProps | null> {
    const row = await this.prisma.tipoVehiculo.findUnique({
      where: { codigo },
      select: SELECT,
    });
    return (row as FilaTipoVehiculo | null) ?? null;
  }

  async crear(data: CrearTipoVehiculoData): Promise<TipoVehiculoProps> {
    const row = await this.prisma.tipoVehiculo.create({
      data: {
        publicId: uuidv7(),
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        claseSugerida: data.claseSugerida,
        categoriaSugerida: data.categoriaSugerida,
        usuarioCreacion: data.usuarioCreacion,
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'tipoVehiculo',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return row as FilaTipoVehiculo;
  }

  async actualizar(
    id: number,
    data: ActualizarTipoVehiculoData,
  ): Promise<TipoVehiculoProps> {
    const row = await this.prisma.tipoVehiculo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        claseSugerida: data.claseSugerida,
        categoriaSugerida: data.categoriaSugerida,
        estadoActivo: data.estadoActivo,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'tipoVehiculo',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return row as FilaTipoVehiculo;
  }

  async anular(
    id: number,
    usuarioModificacion: string,
  ): Promise<TipoVehiculoProps> {
    const row = await this.prisma.tipoVehiculo.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'tipoVehiculo',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return row as FilaTipoVehiculo;
  }

  async buscar(
    filtros: BuscarTiposVehiculoFiltros,
  ): Promise<{ datos: TipoVehiculoProps[]; total: number }> {
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
      this.prisma.tipoVehiculo.findMany({
        where,
        select: SELECT,
        orderBy: { nombre: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.tipoVehiculo.count({ where }),
    ]);
    return { datos: rows as FilaTipoVehiculo[], total };
  }
}
