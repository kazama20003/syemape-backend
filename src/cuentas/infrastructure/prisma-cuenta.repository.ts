import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { CuentaProps, CuentaRepository, CrearCuentaData } from '../domain/repositories/cuenta.repository.js';

const select = { id: true, publicId: true, codigo: true, nombre: true, descripcion: true, estadoActivo: true, estadoRegistro: true } as const;
@Injectable()
export class PrismaCuentaRepository implements CuentaRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: number) { return this.prisma.cuenta.findUnique({ where: { id }, select }) as Promise<CuentaProps | null>; }
  async findByCodigo(codigo: string) { return this.prisma.cuenta.findUnique({ where: { codigo }, select }) as Promise<CuentaProps | null>; }
  async crear(data: CrearCuentaData) { return this.prisma.cuenta.create({ data: { ...data, publicId: uuidv7() }, select }) as Promise<CuentaProps>; }
  async actualizar(id: number, data: Partial<Pick<CuentaProps, 'nombre' | 'descripcion' | 'estadoActivo'>> & { usuarioModificacion: string }) { return this.prisma.cuenta.update({ where: { id }, data: { ...data, fechaModificacion: new Date() }, select }) as Promise<CuentaProps>; }
  async anular(id: number, actor: string) { return this.prisma.cuenta.update({ where: { id }, data: { estadoRegistro: EstadoRegistro.ANULADO, usuarioModificacion: actor, fechaModificacion: new Date() }, select }) as Promise<CuentaProps>; }
  async buscar(filtros: { texto?: string; estadoRegistro?: EstadoRegistro; page: number; pageSize: number }) {
    const where = { estadoRegistro: filtros.estadoRegistro, ...(filtros.texto ? { OR: [{ codigo: { contains: filtros.texto, mode: 'insensitive' as const } }, { nombre: { contains: filtros.texto, mode: 'insensitive' as const } }] } : {}) };
    const [datos, total] = await Promise.all([this.prisma.cuenta.findMany({ where, select, orderBy: { nombre: 'asc' }, skip: (filtros.page - 1) * filtros.pageSize, take: filtros.pageSize }), this.prisma.cuenta.count({ where })]);
    return { datos: datos as CuentaProps[], total };
  }
}
