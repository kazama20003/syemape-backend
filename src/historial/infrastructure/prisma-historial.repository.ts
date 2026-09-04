import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import {
  BuscarHistorialFiltros,
  HistorialEventoProps,
  HistorialRepository,
} from '../domain/repositories/historial.repository.js';

@Injectable()
export class PrismaHistorialRepository implements HistorialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscar(
    filtros: BuscarHistorialFiltros,
  ): Promise<{ datos: HistorialEventoProps[]; total: number }> {
    const where = {
      entidad: filtros.entidad ?? undefined,
      entidadId: filtros.entidadId ?? undefined,
      accion: filtros.accion ?? undefined,
      ...(filtros.usuario
        ? { usuario: { contains: filtros.usuario, mode: 'insensitive' as const } }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.historialEvento.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.historialEvento.count({ where }),
    ]);
    return { datos: rows as unknown as HistorialEventoProps[], total };
  }
}
