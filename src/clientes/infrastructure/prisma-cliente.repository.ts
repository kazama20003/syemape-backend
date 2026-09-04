import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarClienteData,
  BuscarClientesFiltros,
  CrearClienteData,
  ClienteProps,
  ClienteRepository,
} from '../domain/repositories/cliente.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  razonSocial: true,
  tipoDocumento: true,
  numeroDocumento: true,
  cuenta: true,
  direccion: true,
  contactoNombre: true,
  contactoTelefono: true,
  email: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

type FilaCliente = ClienteProps;

@Injectable()
export class PrismaClienteRepository implements ClienteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<ClienteProps | null> {
    const row = await this.prisma.cliente.findUnique({ where: { id }, select: SELECT });
    return (row as FilaCliente | null) ?? null;
  }

  async findByPublicId(publicId: string): Promise<ClienteProps | null> {
    const row = await this.prisma.cliente.findUnique({
      where: { publicId },
      select: SELECT,
    });
    return (row as FilaCliente | null) ?? null;
  }

  async findByDocumentoActivo(
    numeroDocumentoNormalizado: string,
  ): Promise<ClienteProps | null> {
    const row = await this.prisma.cliente.findFirst({
      where: { numeroDocumentoNormalizado, estadoRegistro: EstadoRegistro.ACTIVO },
      select: SELECT,
    });
    return (row as FilaCliente | null) ?? null;
  }

  async crear(data: CrearClienteData): Promise<ClienteProps> {
    const row = await this.prisma.cliente.create({
      data: {
        publicId: uuidv7(),
        razonSocial: data.razonSocial,
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        numeroDocumentoNormalizado: data.numeroDocumentoNormalizado,
        cuenta: data.cuenta,
        direccion: data.direccion,
        contactoNombre: data.contactoNombre,
        contactoTelefono: data.contactoTelefono,
        email: data.email,
        usuarioCreacion: data.usuarioCreacion,
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'cliente',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return row as FilaCliente;
  }

  async actualizar(
    id: number,
    data: ActualizarClienteData,
  ): Promise<ClienteProps> {
    const row = await this.prisma.cliente.update({
      where: { id },
      data: {
        razonSocial: data.razonSocial,
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        numeroDocumentoNormalizado: data.numeroDocumentoNormalizado,
        cuenta: data.cuenta,
        direccion: data.direccion,
        contactoNombre: data.contactoNombre,
        contactoTelefono: data.contactoTelefono,
        email: data.email,
        estadoActivo: data.estadoActivo,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'cliente',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return row as FilaCliente;
  }

  async anular(id: number, usuarioModificacion: string): Promise<ClienteProps> {
    const row = await this.prisma.cliente.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'cliente',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return row as FilaCliente;
  }

  async buscar(
    filtros: BuscarClientesFiltros,
  ): Promise<{ datos: ClienteProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      ...(filtros.texto
        ? {
            OR: [
              { razonSocial: { contains: filtros.texto, mode: 'insensitive' as const } },
              { numeroDocumento: { contains: filtros.texto, mode: 'insensitive' as const } },
              { cuenta: { contains: filtros.texto, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        select: SELECT,
        orderBy: { razonSocial: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.cliente.count({ where }),
    ]);
    return { datos: rows as FilaCliente[], total };
  }
}
