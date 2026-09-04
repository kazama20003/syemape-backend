import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../shared/enums/estado-activo.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarUbicacionData,
  BuscarUbicacionesFiltros,
  CrearUbicacionData,
  UbicacionProps,
  UbicacionRepository,
} from '../domain/repositories/ubicacion.repository.js';
import { TipoUbicacion } from '../domain/value-objects/tipo-ubicacion.enum.js';

const SELECT = {
  id: true,
  publicId: true,
  nombre: true,
  tipo: true,
  direccion: true,
  referencia: true,
  latitud: true,
  longitud: true,
  distrito: true,
  provincia: true,
  departamento: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

interface FilaUbicacion {
  id: number;
  publicId: string;
  nombre: string;
  tipo: TipoUbicacion;
  direccion: string | null;
  referencia: string | null;
  latitud: { toNumber(): number } | null;
  longitud: { toNumber(): number } | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

function aProps(fila: FilaUbicacion): UbicacionProps {
  return {
    id: fila.id,
    publicId: fila.publicId,
    nombre: fila.nombre,
    tipo: fila.tipo,
    direccion: fila.direccion,
    referencia: fila.referencia,
    latitud: fila.latitud?.toNumber() ?? null,
    longitud: fila.longitud?.toNumber() ?? null,
    distrito: fila.distrito,
    provincia: fila.provincia,
    departamento: fila.departamento,
    estadoActivo: fila.estadoActivo,
    estadoRegistro: fila.estadoRegistro,
  };
}

@Injectable()
export class PrismaUbicacionRepository implements UbicacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UbicacionProps | null> {
    const row = await this.prisma.ubicacion.findUnique({ where: { id }, select: SELECT });
    return row ? aProps(row as FilaUbicacion) : null;
  }

  async findByPublicId(publicId: string): Promise<UbicacionProps | null> {
    const row = await this.prisma.ubicacion.findUnique({
      where: { publicId },
      select: SELECT,
    });
    return row ? aProps(row as FilaUbicacion) : null;
  }

  async crear(data: CrearUbicacionData): Promise<UbicacionProps> {
    const row = await this.prisma.ubicacion.create({
      data: {
        publicId: uuidv7(),
        nombre: data.nombre,
        tipo: data.tipo,
        direccion: data.direccion,
        referencia: data.referencia,
        latitud: data.latitud,
        longitud: data.longitud,
        distrito: data.distrito,
        provincia: data.provincia,
        departamento: data.departamento,
        usuarioCreacion: data.usuarioCreacion,
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'ubicacion',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return aProps(row as FilaUbicacion);
  }

  async actualizar(
    id: number,
    data: ActualizarUbicacionData,
  ): Promise<UbicacionProps> {
    const row = await this.prisma.ubicacion.update({
      where: { id },
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        direccion: data.direccion,
        referencia: data.referencia,
        latitud: data.latitud,
        longitud: data.longitud,
        distrito: data.distrito,
        provincia: data.provincia,
        departamento: data.departamento,
        estadoActivo: data.estadoActivo,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'ubicacion',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaUbicacion);
  }

  async anular(id: number, usuarioModificacion: string): Promise<UbicacionProps> {
    const row = await this.prisma.ubicacion.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'ubicacion',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaUbicacion);
  }

  async buscar(
    filtros: BuscarUbicacionesFiltros,
  ): Promise<{ datos: UbicacionProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      tipo: filtros.tipo ?? undefined,
      ...(filtros.texto
        ? {
            OR: [
              { nombre: { contains: filtros.texto, mode: 'insensitive' as const } },
              { direccion: { contains: filtros.texto, mode: 'insensitive' as const } },
              { distrito: { contains: filtros.texto, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.ubicacion.findMany({
        where,
        select: SELECT,
        orderBy: { nombre: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.ubicacion.count({ where }),
    ]);
    return { datos: (rows as FilaUbicacion[]).map(aProps), total };
  }
}
