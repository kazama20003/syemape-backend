import { Inject, Injectable } from '@nestjs/common';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import { aFechaOpcional, aNumeroOpcional, aTextoOpcional } from '../../shared/dto/parseo.js';
import {
  UNIDAD_OPERACION_REPOSITORY,
} from '../domain/repositories/unidad-operacion.repository.js';
import type {
  AsignacionGpsUnidadProps,
  LecturaKilometrajeUnidadProps,
  UnidadOperacionRepository,
} from '../domain/repositories/unidad-operacion.repository.js';
import { UNIDAD_REPOSITORY } from '../domain/repositories/unidad.repository.js';
import type { UnidadRepository } from '../domain/repositories/unidad.repository.js';

export class AsignarGpsUnidadDto {
  activoId: number;
  fechaInicio?: string;
  observacion?: string;
}

export class LiberarGpsUnidadDto {
  fechaFin?: string;
  observacion?: string;
}

export class RegistrarLecturaKilometrajeUnidadDto {
  valor: number;
  fecha?: string;
  fuente?: string;
  observacion?: string;
}

function exigirUnidad(unidad: unknown, id: number): asserts unidad {
  if (!unidad)
    throw new RecursoNoEncontradoError('La unidad indicada no existe.', 'unidad', id);
}

function exigirEnteroNoNegativo(valor: unknown, campo: string): number {
  const numero = aNumeroOpcional(valor);
  if (numero === null || !Number.isInteger(numero) || numero < 0)
    throw new DomainValidationError(
      `El campo "${campo}" debe ser un entero no negativo.`,
      campo,
      'INVALIDO',
      valor,
    );
  return numero;
}

function fechaOpcional(valor: unknown, campo: string): Date | null {
  if (valor === undefined || valor === null || valor === '') return null;
  const fecha = aFechaOpcional(valor);
  if (!fecha)
    throw new DomainValidationError(
      `El campo "${campo}" contiene una fecha invalida.`,
      campo,
      'INVALIDO',
      valor,
    );
  return fecha;
}

@Injectable()
export class ListarAsignacionesGpsUnidadUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
    @Inject(UNIDAD_OPERACION_REPOSITORY)
    private readonly operaciones: UnidadOperacionRepository,
  ) {}
  async execute(unidadId: number): Promise<AsignacionGpsUnidadProps[]> {
    exigirUnidad(await this.unidades.findById(unidadId), unidadId);
    return this.operaciones.listarAsignacionesGps(unidadId);
  }
}

@Injectable()
export class AsignarGpsUnidadUseCase {
  constructor(
    @Inject(UNIDAD_OPERACION_REPOSITORY)
    private readonly operaciones: UnidadOperacionRepository,
  ) {}
  async execute(
    unidadId: number,
    dto: AsignarGpsUnidadDto,
    actor: string,
  ): Promise<AsignacionGpsUnidadProps> {
    const fechaInicio = fechaOpcional(dto.fechaInicio, 'fechaInicio') ?? new Date();
    if (fechaInicio > new Date()) throw new DomainValidationError('La fecha de inicio no puede estar en el futuro.', 'fechaInicio', 'FECHA_FUTURA', dto.fechaInicio);
    return this.operaciones.asignarGps({
      unidadId,
      activoId: exigirEnteroNoNegativo(dto.activoId, 'activoId'),
      fechaInicio,
      observacion: aTextoOpcional(dto.observacion),
      actor,
    });
  }
}

@Injectable()
export class LiberarGpsUnidadUseCase {
  constructor(
    @Inject(UNIDAD_OPERACION_REPOSITORY)
    private readonly operaciones: UnidadOperacionRepository,
  ) {}
  async execute(
    unidadId: number,
    asignacionId: number,
    dto: LiberarGpsUnidadDto,
    actor: string,
  ): Promise<AsignacionGpsUnidadProps> {
    const asignacion = await this.operaciones.liberarGps({
      unidadId,
      asignacionId,
      fechaFin: fechaOpcional(dto.fechaFin, 'fechaFin') ?? new Date(),
      observacion:
        dto.observacion === undefined
          ? undefined
          : aTextoOpcional(dto.observacion),
      actor,
    });
    if (!asignacion)
      throw new RecursoNoEncontradoError(
        'La asignacion GPS indicada no existe o ya fue liberada.',
        'asignacionGps',
        asignacionId,
      );
    return asignacion;
  }
}

@Injectable()
export class ListarLecturasKilometrajeUnidadUseCase {
  constructor(
    @Inject(UNIDAD_REPOSITORY) private readonly unidades: UnidadRepository,
    @Inject(UNIDAD_OPERACION_REPOSITORY)
    private readonly operaciones: UnidadOperacionRepository,
  ) {}
  async execute(unidadId: number): Promise<LecturaKilometrajeUnidadProps[]> {
    exigirUnidad(await this.unidades.findById(unidadId), unidadId);
    return this.operaciones.listarLecturas(unidadId);
  }
}

@Injectable()
export class RegistrarLecturaKilometrajeUnidadUseCase {
  constructor(
    @Inject(UNIDAD_OPERACION_REPOSITORY)
    private readonly operaciones: UnidadOperacionRepository,
  ) {}
  async execute(
    unidadId: number,
    dto: RegistrarLecturaKilometrajeUnidadDto,
    actor: string,
  ): Promise<LecturaKilometrajeUnidadProps> {
    return this.operaciones.registrarLectura({
      unidadId,
      valor: exigirEnteroNoNegativo(dto.valor, 'valor'),
      fecha: fechaOpcional(dto.fecha, 'fecha') ?? new Date(),
      fuente: aTextoOpcional(dto.fuente),
      observacion: aTextoOpcional(dto.observacion),
      actor,
    });
  }
}
