import { Inject, Injectable } from '@nestjs/common';
import {
  construirPaginacion,
  type RespuestaPaginadaDto,
} from '../../shared/dto/respuesta.dto.js';
import { aEnteroPositivo, aTextoOpcional } from '../../shared/dto/parseo.js';
import { esEstadoActivo } from '../../shared/enums/estado-activo.enum.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import {
  ROL_PERSONAL_REPOSITORY,
  type RolPersonalProps,
  type RolPersonalRepository,
} from '../domain/repositories/rol-personal.repository.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;

export class RegistrarRolPersonalDto {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  puedeConducir?: boolean;
  puedeSupervisar?: boolean;
}

export class ActualizarRolPersonalDto {
  nombre?: string;
  descripcion?: string | null;
  puedeConducir?: boolean;
  puedeSupervisar?: boolean;
  estadoActivo?: string;
}

function exigirTexto(valor: unknown, campo: string): string {
  const texto = aTextoOpcional(valor);
  if (!texto) {
    throw new DomainValidationError(
      `El campo "${campo}" es obligatorio.`,
      campo,
      'REQUERIDO',
      valor ?? null,
    );
  }
  return texto;
}

function codigoDesde(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function aBooleano(valor: unknown, campo: string): boolean {
  if (typeof valor === 'boolean') return valor;
  throw new DomainValidationError(
    `El campo "${campo}" debe ser booleano.`,
    campo,
    'INVALIDO',
    valor ?? null,
  );
}

function estadoActivoInvalido(valor: unknown): never {
  throw new DomainValidationError(
    'El estadoActivo no es valido. Use ACTIVO o INACTIVO.',
    'estadoActivo',
    'INVALIDO',
    valor,
  );
}

@Injectable()
export class RegistrarRolPersonalUseCase {
  constructor(
    @Inject(ROL_PERSONAL_REPOSITORY)
    private readonly roles: RolPersonalRepository,
  ) {}

  async execute(
    dto: RegistrarRolPersonalDto,
    actor: string,
  ): Promise<RolPersonalProps> {
    const nombre = exigirTexto(dto.nombre, 'nombre');
    const codigo = (
      aTextoOpcional(dto.codigo) ?? codigoDesde(nombre)
    ).toUpperCase();
    if (await this.roles.findByCodigo(codigo)) {
      throw new DomainValidationError(
        `Ya existe un rol de personal con el codigo "${codigo}".`,
        'codigo',
        'DUPLICADO',
        codigo,
      );
    }
    return this.roles.crear({
      codigo,
      nombre,
      descripcion: aTextoOpcional(dto.descripcion),
      puedeConducir:
        dto.puedeConducir === undefined
          ? false
          : aBooleano(dto.puedeConducir, 'puedeConducir'),
      puedeSupervisar:
        dto.puedeSupervisar === undefined
          ? false
          : aBooleano(dto.puedeSupervisar, 'puedeSupervisar'),
      usuarioCreacion: actor,
    });
  }
}

@Injectable()
export class ListarRolesPersonalUseCase {
  constructor(
    @Inject(ROL_PERSONAL_REPOSITORY)
    private readonly roles: RolPersonalRepository,
  ) {}

  async execute(query: {
    texto?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<RolPersonalProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );
    const { datos, total } = await this.roles.buscar({
      texto: aTextoOpcional(query.texto) ?? undefined,
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      page,
      pageSize,
    });
    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}

@Injectable()
export class ObtenerRolPersonalUseCase {
  constructor(
    @Inject(ROL_PERSONAL_REPOSITORY)
    private readonly roles: RolPersonalRepository,
  ) {}

  async execute(id: number): Promise<RolPersonalProps> {
    const rol = await this.roles.findById(id);
    if (!rol)
      throw new RecursoNoEncontradoError(
        'El rol de personal indicado no existe.',
        'rolPersonal',
        id,
      );
    return rol;
  }
}

@Injectable()
export class ActualizarRolPersonalUseCase {
  constructor(
    @Inject(ROL_PERSONAL_REPOSITORY)
    private readonly roles: RolPersonalRepository,
  ) {}

  async execute(
    id: number,
    dto: ActualizarRolPersonalDto,
    actor: string,
  ): Promise<RolPersonalProps> {
    if (!(await this.roles.findById(id))) {
      throw new RecursoNoEncontradoError(
        'El rol de personal indicado no existe.',
        'rolPersonal',
        id,
      );
    }
    return this.roles.actualizar(id, {
      nombre:
        dto.nombre === undefined
          ? undefined
          : exigirTexto(dto.nombre, 'nombre'),
      descripcion:
        dto.descripcion === undefined
          ? undefined
          : aTextoOpcional(dto.descripcion),
      puedeConducir:
        dto.puedeConducir === undefined
          ? undefined
          : aBooleano(dto.puedeConducir, 'puedeConducir'),
      puedeSupervisar:
        dto.puedeSupervisar === undefined
          ? undefined
          : aBooleano(dto.puedeSupervisar, 'puedeSupervisar'),
      estadoActivo:
        dto.estadoActivo === undefined
          ? undefined
          : esEstadoActivo(dto.estadoActivo)
            ? dto.estadoActivo
            : estadoActivoInvalido(dto.estadoActivo),
      usuarioModificacion: actor,
    });
  }
}

@Injectable()
export class AnularRolPersonalUseCase {
  constructor(
    @Inject(ROL_PERSONAL_REPOSITORY)
    private readonly roles: RolPersonalRepository,
  ) {}

  async execute(id: number, actor: string): Promise<RolPersonalProps> {
    if (!(await this.roles.findById(id))) {
      throw new RecursoNoEncontradoError(
        'El rol de personal indicado no existe.',
        'rolPersonal',
        id,
      );
    }
    return this.roles.anular(id, actor);
  }
}
