import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarUsuarioData,
  BuscarUsuariosFiltros,
  CrearUsuarioData,
  UsuarioConHash,
  UsuarioProps,
  UsuarioRepository,
} from '../domain/usuario.repository.js';

const SELECT = {
  id: true,
  publicId: true,
  email: true,
  nombre: true,
  rol: true,
  clienteId: true,
  personalId: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

@Injectable()
export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UsuarioProps | null> {
    const row = await this.prisma.usuario.findUnique({ where: { id }, select: SELECT });
    return row as UsuarioProps | null;
  }

  async findByEmail(email: string): Promise<UsuarioConHash | null> {
    const row = await this.prisma.usuario.findFirst({
      where: { email: email.toLowerCase(), estadoRegistro: EstadoRegistro.ACTIVO },
      select: { ...SELECT, passwordHash: true },
    });
    return row as UsuarioConHash | null;
  }

  async contarTotal(): Promise<number> {
    return this.prisma.usuario.count({
      where: { estadoRegistro: EstadoRegistro.ACTIVO },
    });
  }

  async crear(data: CrearUsuarioData): Promise<UsuarioProps> {
    const row = await this.prisma.usuario.create({
      data: {
        publicId: uuidv7(),
        email: data.email.toLowerCase(),
        nombre: data.nombre,
        rol: data.rol,
        passwordHash: data.passwordHash,
        clienteId: data.clienteId,
        personalId: data.personalId,
        usuarioCreacion: data.usuarioCreacion,
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'usuario',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      // Nunca se audita el hash de la contraseña.
      datos: row,
    });
    return row as UsuarioProps;
  }

  async actualizar(id: number, data: ActualizarUsuarioData): Promise<UsuarioProps> {
    const row = await this.prisma.usuario.update({
      where: { id },
      data: {
        nombre: data.nombre,
        rol: data.rol,
        passwordHash: data.passwordHash,
        clienteId: data.clienteId,
        personalId: data.personalId,
        estadoActivo: data.estadoActivo,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'usuario',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return row as UsuarioProps;
  }

  async anular(id: number, usuarioModificacion: string): Promise<UsuarioProps> {
    const row = await this.prisma.usuario.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'usuario',
      entidadId: row.id,
      entidadPublicId: row.publicId,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return row as UsuarioProps;
  }

  async buscar(
    filtros: BuscarUsuariosFiltros,
  ): Promise<{ datos: UsuarioProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      rol: filtros.rol ?? undefined,
      ...(filtros.texto
        ? {
            OR: [
              { nombre: { contains: filtros.texto, mode: 'insensitive' as const } },
              { email: { contains: filtros.texto, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: SELECT,
        orderBy: { nombre: 'asc' },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return { datos: rows as UsuarioProps[], total };
  }
}
