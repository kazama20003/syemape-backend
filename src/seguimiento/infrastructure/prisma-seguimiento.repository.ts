import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import {
  CrearSeguimientoData,
  EstadoSeguimiento,
  ManifiestoResumenSeguimiento,
  SeguimientoProps,
  SeguimientoRepository,
  TipoCheckin,
} from '../domain/seguimiento.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  manifiestoId: true,
  tipo: true,
  rutaPuntoId: true,
  estado: true,
  fecha: true,
  latitud: true,
  longitud: true,
  fotoUrl: true,
  observacion: true,
  registradoPor: true,
} as const;

interface Fila {
  id: number;
  publicId: string;
  manifiestoId: number;
  tipo: TipoCheckin;
  rutaPuntoId: number | null;
  estado: EstadoSeguimiento | null;
  fecha: Date;
  latitud: { toNumber(): number } | null;
  longitud: { toNumber(): number } | null;
  fotoUrl: string | null;
  observacion: string | null;
  registradoPor: string;
}

function aProps(f: Fila): SeguimientoProps {
  return {
    id: f.id,
    publicId: f.publicId,
    manifiestoId: f.manifiestoId,
    tipo: f.tipo,
    rutaPuntoId: f.rutaPuntoId,
    estado: f.estado,
    fecha: f.fecha,
    latitud: f.latitud?.toNumber() ?? null,
    longitud: f.longitud?.toNumber() ?? null,
    fotoUrl: f.fotoUrl,
    observacion: f.observacion,
    registradoPor: f.registradoPor,
  };
}

@Injectable()
export class PrismaSeguimientoRepository implements SeguimientoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async manifiestoActivo(
    id: number,
  ): Promise<ManifiestoResumenSeguimiento | null> {
    const row = await this.prisma.manifiesto.findFirst({
      where: { id, estadoRegistro: EstadoRegistro.ACTIVO },
      select: { id: true, publicId: true, estado: true },
    });
    return row as ManifiestoResumenSeguimiento | null;
  }

  async crear(data: CrearSeguimientoData): Promise<SeguimientoProps> {
    const row = await this.prisma.seguimientoManifiesto.create({
      data: {
        publicId: uuidv7(),
        manifiestoId: data.manifiestoId,
        tipo: data.tipo,
        rutaPuntoId: data.rutaPuntoId,
        estado: data.estado,
        latitud: data.latitud,
        longitud: data.longitud,
        fotoUrl: data.fotoUrl,
        observacion: data.observacion,
        registradoPor: data.registradoPor,
      },
      select: SELECT,
    });
    return aProps(row as Fila);
  }

  async actualizarEstadoManifiesto(
    manifiestoId: number,
    estado: EstadoSeguimiento,
  ): Promise<void> {
    await this.prisma.manifiesto.update({
      where: { id: manifiestoId },
      data: { estadoSeguimiento: estado },
    });
  }

  async listarPorManifiesto(manifiestoId: number): Promise<SeguimientoProps[]> {
    const rows = await this.prisma.seguimientoManifiesto.findMany({
      where: { manifiestoId },
      select: SELECT,
      orderBy: { fecha: 'asc' },
    });
    return (rows as Fila[]).map(aProps);
  }
}
