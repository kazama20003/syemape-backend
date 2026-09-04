import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import { TipoPersonal } from '../../personal/domain/value-objects/tipo-personal.enum.js';
import {
  BuscarManifiestosFiltros,
  CrearManifiestoData,
  ManifiestoProps,
  ManifiestoRepository,
} from '../domain/repositories/manifiesto.repository.js';
import { EstadoManifiesto } from '../domain/value-objects/estado-manifiesto.enum.js';
import { UnidadMedida } from '../domain/value-objects/servicio.enums.js';

const RESUMEN_PERSONAL = {
  id: true,
  publicId: true,
  nombres: true,
  apellidos: true,
  numeroDocumento: true,
  apelativo: true,
} as const;

const INCLUDE = {
  unidad: { select: { id: true, publicId: true, placa: true, clase: true } },
  segundaUnidad: { select: { id: true, publicId: true, placa: true, clase: true } },
  conductor: { select: RESUMEN_PERSONAL },
  supervisor: { select: RESUMEN_PERSONAL },
  cliente: { select: { id: true, publicId: true, razonSocial: true } },
  tipoServicio: { select: { id: true, publicId: true, codigo: true, nombre: true } },
  ruta: {
    select: { id: true, publicId: true, nombre: true, origen: true, destino: true },
  },
  ubicacionOrigen: {
    select: { id: true, publicId: true, nombre: true, latitud: true, longitud: true },
  },
  ubicacionDestino: {
    select: { id: true, publicId: true, nombre: true, latitud: true, longitud: true },
  },
  cargas: true,
  tripulantes: { select: { rol: true, personal: { select: RESUMEN_PERSONAL } } },
} as const;

type Dec = { toNumber(): number } | null;

function dec(v: Dec): number | null {
  return v?.toNumber() ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aProps(fila: any): ManifiestoProps {
  const ubic = (u: any) =>
    u
      ? {
          id: u.id,
          publicId: u.publicId,
          nombre: u.nombre,
          latitud: dec(u.latitud),
          longitud: dec(u.longitud),
        }
      : null;
  return {
    id: fila.id,
    publicId: fila.publicId,
    numero: fila.numero,
    estado: fila.estado,
    fechaServicio: fila.fechaServicio,
    horaServicio: fila.horaServicio,
    origen: fila.origen,
    destino: fila.destino,
    ubicacionOrigen: ubic(fila.ubicacionOrigen),
    ubicacionDestino: ubic(fila.ubicacionDestino),
    tipoServicio: fila.tipoServicio,
    cliente: fila.cliente,
    clienteTexto: fila.clienteTexto,
    estadoCarga: fila.estadoCarga,
    combustible: fila.combustible,
    viaticos: fila.viaticos,
    unidad: fila.unidad,
    segundaUnidad: fila.segundaUnidad,
    segundaPlaca: fila.segundaPlaca,
    conductor: fila.conductor,
    ruta: fila.ruta,
    supervisor: fila.supervisor,
    base: fila.base,
    puestoControl: fila.puestoControl,
    fechaLlegadaEstimada: fila.fechaLlegadaEstimada,
    fechaCierre: fila.fechaCierre,
    observaciones: fila.observaciones,
    cargas: (fila.cargas ?? []).map((c: any) => ({
      id: c.id,
      descripcion: c.descripcion,
      cantidad: dec(c.cantidad),
      unidadMedida: c.unidadMedida as UnidadMedida,
      pesoKg: dec(c.pesoKg),
      piezas: c.piezas,
      embalaje: c.embalaje,
      valorDeclarado: dec(c.valorDeclarado),
    })),
    tripulantes: (fila.tripulantes ?? []).map((t: any) => ({
      personal: t.personal,
      rol: t.rol as TipoPersonal,
    })),
    estadoRegistro: fila.estadoRegistro,
  };
}

@Injectable()
export class PrismaManifiestoRepository implements ManifiestoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<ManifiestoProps | null> {
    const row = await this.prisma.manifiesto.findUnique({ where: { id }, include: INCLUDE });
    return row ? aProps(row) : null;
  }

  async findByPublicId(publicId: string): Promise<ManifiestoProps | null> {
    const row = await this.prisma.manifiesto.findUnique({
      where: { publicId },
      include: INCLUDE,
    });
    return row ? aProps(row) : null;
  }

  async crear(data: CrearManifiestoData): Promise<ManifiestoProps> {
    const row = await this.prisma.manifiesto.create({
      data: {
        publicId: uuidv7(),
        numero: data.numero,
        fechaServicio: data.fechaServicio,
        horaServicio: data.horaServicio,
        origen: data.origen,
        destino: data.destino,
        ubicacionOrigenId: data.ubicacionOrigenId,
        ubicacionDestinoId: data.ubicacionDestinoId,
        tipoServicioId: data.tipoServicioId,
        clienteId: data.clienteId,
        clienteTexto: data.clienteTexto,
        estadoCarga: data.estadoCarga,
        combustible: data.combustible,
        viaticos: data.viaticos,
        unidadId: data.unidadId,
        segundaUnidadId: data.segundaUnidadId,
        segundaPlaca: data.segundaPlaca,
        conductorId: data.conductorId,
        rutaId: data.rutaId,
        supervisorId: data.supervisorId,
        base: data.base,
        puestoControl: data.puestoControl,
        fechaLlegadaEstimada: data.fechaLlegadaEstimada,
        observaciones: data.observaciones,
        usuarioCreacion: data.usuarioCreacion,
        cargas: { create: data.cargas },
        tripulantes: {
          create: data.tripulantes.map((t) => ({
            personalId: t.personalId,
            rol: t.rol,
          })),
        },
      },
      include: INCLUDE,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'manifiesto',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return aProps(row);
  }

  async cambiarEstado(
    id: number,
    data: {
      estado: EstadoManifiesto;
      fechaCierre: Date | null;
      usuarioModificacion: string;
    },
  ): Promise<ManifiestoProps> {
    const row = await this.prisma.manifiesto.update({
      where: { id },
      data: {
        estado: data.estado,
        fechaCierre: data.fechaCierre,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      include: INCLUDE,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'manifiesto',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.CAMBIAR_ESTADO,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return aProps(row);
  }

  async anular(id: number, usuarioModificacion: string): Promise<ManifiestoProps> {
    const row = await this.prisma.manifiesto.update({
      where: { id },
      data: {
        estado: EstadoManifiesto.ANULADO,
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      include: INCLUDE,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'manifiesto',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return aProps(row);
  }

  async buscar(
    filtros: BuscarManifiestosFiltros,
  ): Promise<{ datos: ManifiestoProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      estado: filtros.estado ?? undefined,
      unidadId: filtros.unidadId ?? undefined,
      conductorId: filtros.conductorId ?? undefined,
      clienteId: filtros.clienteId ?? undefined,
      rutaId: filtros.rutaId ?? undefined,
      ...(filtros.numero
        ? { numero: { contains: filtros.numero, mode: 'insensitive' as const } }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.manifiesto.findMany({
        where,
        include: INCLUDE,
        orderBy: { fechaCreacion: 'desc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.manifiesto.count({ where }),
    ]);
    return { datos: rows.map(aProps), total };
  }

  async contarTotal(): Promise<number> {
    return this.prisma.manifiesto.count();
  }
}
