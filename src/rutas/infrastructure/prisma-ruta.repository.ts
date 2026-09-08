import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../shared/enums/estado-activo.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarRutaData,
  BuscarRutasFiltros,
  CrearRutaData,
  RutaProps,
  RutaRepository,
} from '../domain/repositories/ruta.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  nombre: true,
  origen: true,
  destino: true,
  ubicacionOrigenId: true,
  ubicacionDestinoId: true,
  distanciaKm: true,
  duracionEstimadaHoras: true,
  descripcion: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

interface FilaRuta {
  id: number;
  publicId: string;
  nombre: string;
  origen: string;
  destino: string;
  ubicacionOrigenId: number | null;
  ubicacionDestinoId: number | null;
  distanciaKm: { toNumber(): number } | null;
  duracionEstimadaHoras: { toNumber(): number } | null;
  descripcion: string | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

function aProps(fila: FilaRuta): RutaProps {
  return {
    id: fila.id,
    publicId: fila.publicId,
    nombre: fila.nombre,
    origen: fila.origen,
    destino: fila.destino,
    ubicacionOrigenId: fila.ubicacionOrigenId,
    ubicacionDestinoId: fila.ubicacionDestinoId,
    distanciaKm: fila.distanciaKm?.toNumber() ?? null,
    duracionEstimadaHoras: fila.duracionEstimadaHoras?.toNumber() ?? null,
    descripcion: fila.descripcion,
    estadoActivo: fila.estadoActivo,
    estadoRegistro: fila.estadoRegistro,
  };
}

@Injectable()
export class PrismaRutaRepository implements RutaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<RutaProps | null> {
    const row = await this.prisma.ruta.findUnique({ where: { id }, select: SELECT });
    return row ? aProps(row as FilaRuta) : null;
  }

  async findByPublicId(publicId: string): Promise<RutaProps | null> {
    const row = await this.prisma.ruta.findUnique({
      where: { publicId },
      select: SELECT,
    });
    return row ? aProps(row as FilaRuta) : null;
  }

  async crear(data: CrearRutaData): Promise<RutaProps> {
    const row = await this.prisma.ruta.create({
      data: {
        publicId: uuidv7(),
        nombre: data.nombre,
        origen: data.origen,
        destino: data.destino,
        ubicacionOrigenId: data.ubicacionOrigenId,
        ubicacionDestinoId: data.ubicacionDestinoId,
        distanciaKm: data.distanciaKm,
        duracionEstimadaHoras: data.duracionEstimadaHoras,
        descripcion: data.descripcion,
        usuarioCreacion: data.usuarioCreacion,
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'ruta',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return aProps(row as FilaRuta);
  }

  async actualizar(id: number, data: ActualizarRutaData): Promise<RutaProps> {
    const row = await this.prisma.ruta.update({
      where: { id },
      data: {
        nombre: data.nombre,
        origen: data.origen,
        destino: data.destino,
        ubicacionOrigenId: data.ubicacionOrigenId,
        ubicacionDestinoId: data.ubicacionDestinoId,
        distanciaKm: data.distanciaKm,
        duracionEstimadaHoras: data.duracionEstimadaHoras,
        descripcion: data.descripcion,
        estadoActivo: data.estadoActivo,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'ruta',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaRuta);
  }

  async anular(id: number, usuarioModificacion: string): Promise<RutaProps> {
    const row = await this.prisma.ruta.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'ruta',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaRuta);
  }

  async buscar(
    filtros: BuscarRutasFiltros,
  ): Promise<{ datos: RutaProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      ...(filtros.texto
        ? {
            OR: [
              { nombre: { contains: filtros.texto, mode: 'insensitive' as const } },
              { origen: { contains: filtros.texto, mode: 'insensitive' as const } },
              { destino: { contains: filtros.texto, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.ruta.findMany({
        where,
        select: SELECT,
        orderBy: { nombre: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.ruta.count({ where }),
    ]);
    return { datos: (rows as FilaRuta[]).map(aProps), total };
  }
}
