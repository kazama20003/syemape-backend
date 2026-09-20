import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { CrearProyectoData, ProyectoProps, ProyectoRepository } from '../domain/repositories/proyecto.repository.js';
const select = { id: true, publicId: true, cuentaId: true, codigo: true, nombre: true, descripcion: true, estadoActivo: true, estadoRegistro: true, cuenta: { select: { id: true, codigo: true, nombre: true } } } as const;
@Injectable() export class PrismaProyectoRepository implements ProyectoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: number) { return this.prisma.proyecto.findUnique({ where: { id }, select }) as Promise<ProyectoProps | null>; }
  async findByCuentaYCodigo(cuentaId: number, codigo: string) { return this.prisma.proyecto.findUnique({ where: { cuentaId_codigo: { cuentaId, codigo } }, select }) as Promise<ProyectoProps | null>; }
  async crear(data: CrearProyectoData) { return this.prisma.proyecto.create({ data: { ...data, publicId: uuidv7() }, select }) as Promise<ProyectoProps>; }
  async actualizar(id: number, data: Partial<Pick<ProyectoProps, 'nombre' | 'descripcion' | 'estadoActivo'>> & { usuarioModificacion: string }) { return this.prisma.proyecto.update({ where: { id }, data: { ...data, fechaModificacion: new Date() }, select }) as Promise<ProyectoProps>; }
  async anular(id: number, actor: string) { return this.prisma.proyecto.update({ where: { id }, data: { estadoRegistro: EstadoRegistro.ANULADO, usuarioModificacion: actor, fechaModificacion: new Date() }, select }) as Promise<ProyectoProps>; }
  async buscar(filtros: { cuentaId?: number; texto?: string; estadoRegistro?: EstadoRegistro; page: number; pageSize: number }) { const where = { cuentaId: filtros.cuentaId, estadoRegistro: filtros.estadoRegistro, ...(filtros.texto ? { OR: [{ codigo: { contains: filtros.texto, mode: 'insensitive' as const } }, { nombre: { contains: filtros.texto, mode: 'insensitive' as const } }] } : {}) }; const [datos, total] = await Promise.all([this.prisma.proyecto.findMany({ where, select, orderBy: { nombre: 'asc' }, skip: (filtros.page - 1) * filtros.pageSize, take: filtros.pageSize }), this.prisma.proyecto.count({ where })]); return { datos: datos as ProyectoProps[], total }; }
}
