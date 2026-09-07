import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../shared/enums/estado-activo.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarUnidadData,
  BuscarUnidadesFiltros,
  CrearUnidadData,
  UnidadProps,
  UnidadRepository,
} from '../domain/repositories/unidad.repository.js';
import {
  ClaseUnidad,
  EstadoUnidad,
} from '../domain/value-objects/clase-unidad.enum.js';
import {
  EstadoOperativoActivo,
  TipoActivo,
} from '../../activos/domain/value-objects/activo.enum.js';

const SELECT = {
  id: true,
  publicId: true,
  placa: true,
  clase: true,
  tipoVehiculo: true,
  categoriaVehicular: true,
  marca: true,
  modelo: true,
  anio: true,
  anioFabricacion: true,
  color: true,
  numeroEjes: true,
  numeroMotor: true,
  numeroVin: true,
  registroMtc: true,
  mtcVigencia: true,
  materialesPeligrosos: true,
  cuenta: true,
  clienteAsociado: true,
  capacidadCarga: true,
  pesoBrutoVehicular: true,
  tara: true,
  capacidadPasajeros: true,
  volumenCarga: true,
  tipoCarroceria: true,
  numeroSerieCarroceria: true,
  tipoCombustible: true,
  kilometraje: true,
  ultimoMantenimientoFecha: true,
  ultimoMantenimientoKilometraje: true,
  proximoMantenimientoFecha: true,
  proximoMantenimientoKilometraje: true,
  mantenimientoObservacion: true,
  fotos: true,
  estadoUnidad: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

interface FilaUnidad {
  id: number;
  publicId: string;
  placa: string;
  clase: ClaseUnidad;
  tipoVehiculo: string | null;
  categoriaVehicular: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  anioFabricacion: number | null;
  color: string | null;
  numeroEjes: number | null;
  numeroMotor: string | null;
  numeroVin: string | null;
  registroMtc: string | null;
  mtcVigencia: Date | null;
  materialesPeligrosos: string | null;
  cuenta: string | null;
  clienteAsociado: string | null;
  capacidadCarga: { toNumber(): number } | null;
  pesoBrutoVehicular: { toNumber(): number } | null;
  tara: { toNumber(): number } | null;
  capacidadPasajeros: number | null;
  volumenCarga: { toNumber(): number } | null;
  tipoCarroceria: string | null;
  numeroSerieCarroceria: string | null;
  tipoCombustible: string | null;
  kilometraje: number | null;
  ultimoMantenimientoFecha: Date | null;
  ultimoMantenimientoKilometraje: number | null;
  proximoMantenimientoFecha: Date | null;
  proximoMantenimientoKilometraje: number | null;
  mantenimientoObservacion: string | null;
  fotos: string[];
  estadoUnidad: EstadoUnidad;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

function aProps(fila: FilaUnidad): UnidadProps {
  return {
    id: fila.id,
    publicId: fila.publicId,
    placa: fila.placa,
    clase: fila.clase,
    tipoVehiculo: fila.tipoVehiculo,
    categoriaVehicular: fila.categoriaVehicular,
    marca: fila.marca,
    modelo: fila.modelo,
    anio: fila.anio,
    anioFabricacion: fila.anioFabricacion,
    color: fila.color,
    numeroEjes: fila.numeroEjes,
    numeroMotor: fila.numeroMotor,
    numeroVin: fila.numeroVin,
    registroMtc: fila.registroMtc,
    mtcVigencia: fila.mtcVigencia,
    materialesPeligrosos: fila.materialesPeligrosos,
    cuenta: fila.cuenta,
    clienteAsociado: fila.clienteAsociado,
    capacidadCarga: fila.capacidadCarga?.toNumber() ?? null,
    pesoBrutoVehicular: fila.pesoBrutoVehicular?.toNumber() ?? null,
    tara: fila.tara?.toNumber() ?? null,
    capacidadPasajeros: fila.capacidadPasajeros,
    volumenCarga: fila.volumenCarga?.toNumber() ?? null,
    tipoCarroceria: fila.tipoCarroceria,
    numeroSerieCarroceria: fila.numeroSerieCarroceria,
    tipoCombustible: fila.tipoCombustible,
    kilometraje: fila.kilometraje,
    ultimoMantenimientoFecha: fila.ultimoMantenimientoFecha,
    ultimoMantenimientoKilometraje: fila.ultimoMantenimientoKilometraje,
    proximoMantenimientoFecha: fila.proximoMantenimientoFecha,
    proximoMantenimientoKilometraje: fila.proximoMantenimientoKilometraje,
    mantenimientoObservacion: fila.mantenimientoObservacion,
    fotos: fila.fotos,
    estadoUnidad: fila.estadoUnidad,
    estadoActivo: fila.estadoActivo,
    estadoRegistro: fila.estadoRegistro,
  };
}

// Campos de escritura comunes a crear/actualizar (todos menos placa/identidad).
function datosEscritura(
  data: CrearUnidadData | ActualizarUnidadData,
): Record<string, unknown> {
  return {
    clase: data.clase,
    tipoVehiculo: data.tipoVehiculo,
    categoriaVehicular: data.categoriaVehicular,
    marca: data.marca,
    modelo: data.modelo,
    anio: data.anio,
    anioFabricacion: data.anioFabricacion,
    color: data.color,
    numeroEjes: data.numeroEjes,
    numeroMotor: data.numeroMotor,
    numeroVin: data.numeroVin,
    registroMtc: data.registroMtc,
    mtcVigencia: data.mtcVigencia,
    materialesPeligrosos: data.materialesPeligrosos,
    cuenta: data.cuenta,
    clienteAsociado: data.clienteAsociado,
    capacidadCarga: data.capacidadCarga,
    pesoBrutoVehicular: data.pesoBrutoVehicular,
    tara: data.tara,
    capacidadPasajeros: data.capacidadPasajeros,
    volumenCarga: data.volumenCarga,
    tipoCarroceria: data.tipoCarroceria,
    numeroSerieCarroceria: data.numeroSerieCarroceria,
    tipoCombustible: data.tipoCombustible,
    kilometraje: 'kilometraje' in data ? data.kilometraje : undefined,
    ultimoMantenimientoFecha: data.ultimoMantenimientoFecha,
    ultimoMantenimientoKilometraje: data.ultimoMantenimientoKilometraje,
    proximoMantenimientoFecha: data.proximoMantenimientoFecha,
    proximoMantenimientoKilometraje: data.proximoMantenimientoKilometraje,
    mantenimientoObservacion: data.mantenimientoObservacion,
    fotos: data.fotos,
    estadoUnidad: data.estadoUnidad,
  };
}

function estadoOperativo(estado: EstadoUnidad): EstadoOperativoActivo {
  switch (estado) {
    case EstadoUnidad.EN_MANTENIMIENTO:
      return EstadoOperativoActivo.EN_MANTENIMIENTO;
    case EstadoUnidad.DE_BAJA:
      return EstadoOperativoActivo.DE_BAJA;
    default:
      return EstadoOperativoActivo.OPERATIVO;
  }
}

@Injectable()
export class PrismaUnidadRepository implements UnidadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UnidadProps | null> {
    const row = await this.prisma.unidad.findUnique({
      where: { id },
      select: SELECT,
    });
    return row ? aProps(row as FilaUnidad) : null;
  }

  async findByPublicId(publicId: string): Promise<UnidadProps | null> {
    const row = await this.prisma.unidad.findUnique({
      where: { publicId },
      select: SELECT,
    });
    return row ? aProps(row as FilaUnidad) : null;
  }

  async findByPlacaActiva(
    placaNormalizada: string,
  ): Promise<UnidadProps | null> {
    const row = await this.prisma.unidad.findFirst({
      where: { placaNormalizada, estadoRegistro: EstadoRegistro.ACTIVO },
      select: SELECT,
    });
    return row ? aProps(row as FilaUnidad) : null;
  }

  async crear(data: CrearUnidadData): Promise<UnidadProps> {
    const row = await this.prisma.unidad.create({
      data: {
        publicId: uuidv7(),
        placa: data.placa,
        placaNormalizada: data.placaNormalizada,
        clase: data.clase,
        estadoUnidad: data.estadoUnidad,
        usuarioCreacion: data.usuarioCreacion,
        activo: {
          create: {
            publicId: uuidv7(),
            codigo: `UNIDAD-${data.placaNormalizada}`,
            nombre: `Unidad ${data.placa}`,
            tipo: TipoActivo.UNIDAD,
            estadoOperativo: estadoOperativo(data.estadoUnidad),
            usuarioCreacion: data.usuarioCreacion,
          },
        },
        ...datosEscritura(data),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'unidad',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return aProps(row as FilaUnidad);
  }

  async actualizar(
    id: number,
    data: ActualizarUnidadData,
  ): Promise<UnidadProps> {
    const row = await this.prisma.unidad.update({
      where: { id },
      data: {
        placa: data.placa,
        placaNormalizada: data.placaNormalizada,
        estadoActivo: data.estadoActivo,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
        activo: {
          update: {
            codigo:
              data.placaNormalizada === undefined
                ? undefined
                : `UNIDAD-${data.placaNormalizada}`,
            nombre:
              data.placa === undefined ? undefined : `Unidad ${data.placa}`,
            estadoOperativo:
              data.estadoUnidad === undefined
                ? undefined
                : estadoOperativo(data.estadoUnidad),
            usuarioModificacion: data.usuarioModificacion,
            fechaModificacion: new Date(),
          },
        },
        ...datosEscritura(data),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'unidad',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaUnidad);
  }

  async anular(id: number, usuarioModificacion: string): Promise<UnidadProps> {
    const row = await this.prisma.unidad.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
        activo: {
          update: {
            estadoRegistro: EstadoRegistro.ANULADO,
            usuarioModificacion,
            fechaModificacion: new Date(),
          },
        },
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'unidad',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaUnidad);
  }

  async buscar(
    filtros: BuscarUnidadesFiltros,
  ): Promise<{ datos: UnidadProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      estadoUnidad: filtros.estadoUnidad ?? undefined,
      clase: filtros.clase ?? undefined,
      ...(filtros.placa
        ? {
            placaNormalizada: {
              contains: filtros.placa,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.unidad.findMany({
        where,
        select: SELECT,
        orderBy: { placa: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.unidad.count({ where }),
    ]);
    return { datos: (rows as FilaUnidad[]).map(aProps), total };
  }
}
