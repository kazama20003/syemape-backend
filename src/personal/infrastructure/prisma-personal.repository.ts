import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { uuidv7 } from '../../shared/domain/uuid.js';
import { registrarHistorial } from '../../shared/auditoria/historial.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  ActualizarPersonalData,
  BuscarPersonalFiltros,
  CrearPersonalData,
  PersonalProps,
  PersonalRepository,
} from '../domain/repositories/personal.repository.js';
import { TipoPersonal } from '../domain/value-objects/tipo-personal.enum.js';

const SELECT = {
  id: true,
  publicId: true,
  tipoDocumento: true,
  numeroDocumento: true,
  primerNombre: true,
  segundoNombre: true,
  primerApellido: true,
  segundoApellido: true,
  nombres: true,
  apellidos: true,
  tipo: true,
  apelativo: true,
  telefono: true,
  licenciaConducir: true,
  categoriaLicencia: true,
  licenciaVencimiento: true,
  estadoActivo: true,
  estadoRegistro: true,
} as const;

type FilaPersonal = PersonalProps;

function aProps(fila: FilaPersonal): PersonalProps {
  return { ...fila };
}

@Injectable()
export class PrismaPersonalRepository implements PersonalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<PersonalProps | null> {
    const row = await this.prisma.personal.findUnique({ where: { id }, select: SELECT });
    return row ? aProps(row as FilaPersonal) : null;
  }

  async findByPublicId(publicId: string): Promise<PersonalProps | null> {
    const row = await this.prisma.personal.findUnique({
      where: { publicId },
      select: SELECT,
    });
    return row ? aProps(row as FilaPersonal) : null;
  }

  async findByDocumentoActivo(
    numeroDocumentoNormalizado: string,
  ): Promise<PersonalProps | null> {
    const row = await this.prisma.personal.findFirst({
      where: { numeroDocumentoNormalizado, estadoRegistro: EstadoRegistro.ACTIVO },
      select: SELECT,
    });
    return row ? aProps(row as FilaPersonal) : null;
  }

  async crear(data: CrearPersonalData): Promise<PersonalProps> {
    const row = await this.prisma.personal.create({
      data: {
        publicId: uuidv7(),
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        numeroDocumentoNormalizado: data.numeroDocumentoNormalizado,
        primerNombre: data.primerNombre,
        segundoNombre: data.segundoNombre,
        primerApellido: data.primerApellido,
        segundoApellido: data.segundoApellido,
        nombres: data.nombres,
        apellidos: data.apellidos,
        tipo: data.tipo,
        apelativo: data.apelativo,
        telefono: data.telefono,
        licenciaConducir: data.licenciaConducir,
        categoriaLicencia: data.categoriaLicencia,
        licenciaVencimiento: data.licenciaVencimiento,
        usuarioCreacion: data.usuarioCreacion,
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'personal',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.CREAR,
      usuario: data.usuarioCreacion,
      datos: row,
    });
    return aProps(row as FilaPersonal);
  }

  async actualizar(
    id: number,
    data: ActualizarPersonalData,
  ): Promise<PersonalProps> {
    const row = await this.prisma.personal.update({
      where: { id },
      data: {
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        numeroDocumentoNormalizado: data.numeroDocumentoNormalizado,
        primerNombre: data.primerNombre,
        segundoNombre: data.segundoNombre,
        primerApellido: data.primerApellido,
        segundoApellido: data.segundoApellido,
        nombres: data.nombres,
        apellidos: data.apellidos,
        tipo: data.tipo,
        apelativo: data.apelativo,
        telefono: data.telefono,
        licenciaConducir: data.licenciaConducir,
        categoriaLicencia: data.categoriaLicencia,
        licenciaVencimiento: data.licenciaVencimiento,
        estadoActivo: data.estadoActivo,
        usuarioModificacion: data.usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'personal',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ACTUALIZAR,
      usuario: data.usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaPersonal);
  }

  async anular(id: number, usuarioModificacion: string): Promise<PersonalProps> {
    const row = await this.prisma.personal.update({
      where: { id },
      data: {
        estadoRegistro: EstadoRegistro.ANULADO,
        usuarioModificacion,
        fechaModificacion: new Date(),
      },
      select: SELECT,
    });
    await registrarHistorial(this.prisma, {
      entidad: 'personal',
      entidadId: (row as { id: number }).id,
      entidadPublicId: (row as { publicId?: string }).publicId ?? null,
      accion: AccionAuditoria.ANULAR,
      usuario: usuarioModificacion,
      datos: row,
    });
    return aProps(row as FilaPersonal);
  }

  async buscar(
    filtros: BuscarPersonalFiltros,
  ): Promise<{ datos: PersonalProps[]; total: number }> {
    const where = {
      estadoRegistro: filtros.estadoRegistro ?? undefined,
      tipo: filtros.tipo ?? undefined,
      ...(filtros.texto
        ? {
            OR: [
              { nombres: { contains: filtros.texto, mode: 'insensitive' as const } },
              { apellidos: { contains: filtros.texto, mode: 'insensitive' as const } },
              {
                numeroDocumento: {
                  contains: filtros.texto,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.personal.findMany({
        where,
        select: SELECT,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
      }),
      this.prisma.personal.count({ where }),
    ]);
    return { datos: (rows as FilaPersonal[]).map(aProps), total };
  }
}
