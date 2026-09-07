import { Inject, Injectable } from '@nestjs/common';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { esEstadoActivo } from '../../shared/enums/estado-activo.enum.js';
import {
  construirPaginacion,
  type RespuestaPaginadaDto,
} from '../../shared/dto/respuesta.dto.js';
import {
  aEnteroPositivo,
  aFechaOpcional,
  aTextoOpcional,
} from '../../shared/dto/parseo.js';
import {
  PERSONAL_REPOSITORY,
  type PersonalProps,
  type PersonalRepository,
} from '../domain/repositories/personal.repository.js';
import {
  TipoPersonal,
  esTipoPersonal,
} from '../domain/value-objects/tipo-personal.enum.js';
import {
  exigirDocumento,
  normalizarDocumento,
} from '../domain/value-objects/documento.vo.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;

function throwEstadoActivoInvalido(valor: unknown): never {
  throw new DomainValidationError(
    'El estadoActivo no es valido. Use ACTIVO o INACTIVO.',
    'estadoActivo',
    'INVALIDO',
    valor,
  );
}


export class RegistrarPersonalDto {
  tipoDocumento?: string;
  numeroDocumento: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  tipo?: string;
  apelativo?: string;
  telefono?: string;
  licenciaConducir?: string;
  categoriaLicencia?: string;
  licenciaVencimiento?: string;
}

export class ActualizarPersonalDto {
  tipoDocumento?: string;
  numeroDocumento?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  tipo?: string;
  apelativo?: string;
  telefono?: string;
  licenciaConducir?: string;
  categoriaLicencia?: string;
  licenciaVencimiento?: string;
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
  return texto.replace(/\s+/g, ' ').toUpperCase();
}

function unirNombre(primer: string, segundo: string | null): string {
  return [primer, segundo].filter(Boolean).join(' ');
}

function resolverTipo(valor: unknown, porDefecto: TipoPersonal): TipoPersonal {
  if (valor === undefined || valor === null || valor === '') {
    return porDefecto;
  }
  if (!esTipoPersonal(valor)) {
    throw new DomainValidationError(
      `El tipo de personal no es valido. Use una de: ${Object.values(TipoPersonal).join(', ')}.`,
      'tipo',
      'INVALIDO',
      valor,
    );
  }
  return valor;
}

@Injectable()
export class RegistrarPersonalUseCase {
  constructor(
    @Inject(PERSONAL_REPOSITORY) private readonly personal: PersonalRepository,
  ) {}

  async execute(dto: RegistrarPersonalDto, actor: string): Promise<PersonalProps> {
    const documento = exigirDocumento(dto.numeroDocumento);
    const primerNombre = exigirTexto(dto.primerNombre, 'primerNombre');
    const segundoNombre = aTextoOpcional(dto.segundoNombre)?.toUpperCase() ?? null;
    const primerApellido = exigirTexto(dto.primerApellido, 'primerApellido');
    const segundoApellido = aTextoOpcional(dto.segundoApellido)?.toUpperCase() ?? null;
    const tipo = resolverTipo(dto.tipo, TipoPersonal.CONDUCTOR);

    const existente = await this.personal.findByDocumentoActivo(documento);
    if (existente) {
      throw new DomainValidationError(
        `Ya existe personal activo con el documento "${dto.numeroDocumento}".`,
        'numeroDocumento',
        'DUPLICADO',
        dto.numeroDocumento,
      );
    }

    return this.personal.crear({
      tipoDocumento: aTextoOpcional(dto.tipoDocumento) ?? 'DNI',
      numeroDocumento: dto.numeroDocumento.trim(),
      numeroDocumentoNormalizado: documento,
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
      nombres: unirNombre(primerNombre, segundoNombre),
      apellidos: unirNombre(primerApellido, segundoApellido),
      tipo,
      apelativo: aTextoOpcional(dto.apelativo),
      telefono: aTextoOpcional(dto.telefono),
      licenciaConducir: aTextoOpcional(dto.licenciaConducir),
      categoriaLicencia: aTextoOpcional(dto.categoriaLicencia),
      licenciaVencimiento: aFechaOpcional(dto.licenciaVencimiento),
      usuarioCreacion: actor,
    });
  }
}

@Injectable()
export class ListarPersonalUseCase {
  constructor(
    @Inject(PERSONAL_REPOSITORY) private readonly personal: PersonalRepository,
  ) {}

  async execute(query: {
    texto?: string;
    tipo?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<PersonalProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );

    const { datos, total } = await this.personal.buscar({
      texto: aTextoOpcional(query.texto) ?? undefined,
      tipo: esTipoPersonal(query.tipo) ? query.tipo : undefined,
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      page,
      pageSize,
    });

    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}

@Injectable()
export class ObtenerPersonalUseCase {
  constructor(
    @Inject(PERSONAL_REPOSITORY) private readonly personal: PersonalRepository,
  ) {}

  async execute(id: number): Promise<PersonalProps> {
    const persona = await this.personal.findById(id);
    if (!persona) {
      throw new RecursoNoEncontradoError(
        'El personal indicado no existe.',
        'personal',
        id,
      );
    }
    return persona;
  }
}

@Injectable()
export class ActualizarPersonalUseCase {
  constructor(
    @Inject(PERSONAL_REPOSITORY) private readonly personal: PersonalRepository,
  ) {}

  async execute(id: number, dto: ActualizarPersonalDto, actor: string): Promise<PersonalProps> {
    const persona = await this.personal.findById(id);
    if (!persona) {
      throw new RecursoNoEncontradoError(
        'El personal indicado no existe.',
        'personal',
        id,
      );
    }

    let numeroDocumento: string | undefined;
    let numeroDocumentoNormalizado: string | undefined;
    if (dto.numeroDocumento !== undefined) {
      numeroDocumentoNormalizado = exigirDocumento(dto.numeroDocumento);
      numeroDocumento = dto.numeroDocumento.trim();
      const otro = await this.personal.findByDocumentoActivo(
        numeroDocumentoNormalizado,
      );
      if (otro && otro.id !== id) {
        throw new DomainValidationError(
          `Ya existe otro personal activo con el documento "${dto.numeroDocumento}".`,
          'numeroDocumento',
          'DUPLICADO',
          dto.numeroDocumento,
        );
      }
    }

    const primerNombre =
      dto.primerNombre === undefined
        ? persona.primerNombre
        : exigirTexto(dto.primerNombre, 'primerNombre');
    const segundoNombre =
      dto.segundoNombre === undefined
        ? persona.segundoNombre
        : aTextoOpcional(dto.segundoNombre)?.toUpperCase() ?? null;
    const primerApellido =
      dto.primerApellido === undefined
        ? persona.primerApellido
        : exigirTexto(dto.primerApellido, 'primerApellido');
    const segundoApellido =
      dto.segundoApellido === undefined
        ? persona.segundoApellido
        : aTextoOpcional(dto.segundoApellido)?.toUpperCase() ?? null;
    const actualizarNombre =
      dto.primerNombre !== undefined ||
      dto.segundoNombre !== undefined ||
      dto.primerApellido !== undefined ||
      dto.segundoApellido !== undefined;

    return this.personal.actualizar(id, {
      tipoDocumento:
        dto.tipoDocumento !== undefined
          ? (aTextoOpcional(dto.tipoDocumento) ?? 'DNI')
          : undefined,
      numeroDocumento,
      numeroDocumentoNormalizado,
      primerNombre: dto.primerNombre === undefined ? undefined : primerNombre,
      segundoNombre: dto.segundoNombre === undefined ? undefined : segundoNombre,
      primerApellido: dto.primerApellido === undefined ? undefined : primerApellido,
      segundoApellido: dto.segundoApellido === undefined ? undefined : segundoApellido,
      nombres: actualizarNombre ? unirNombre(primerNombre, segundoNombre) : undefined,
      apellidos: actualizarNombre ? unirNombre(primerApellido, segundoApellido) : undefined,
      tipo: dto.tipo !== undefined ? resolverTipo(dto.tipo, persona.tipo) : undefined,
      apelativo:
        dto.apelativo !== undefined ? aTextoOpcional(dto.apelativo) : undefined,
      telefono:
        dto.telefono !== undefined ? aTextoOpcional(dto.telefono) : undefined,
      licenciaConducir:
        dto.licenciaConducir !== undefined
          ? aTextoOpcional(dto.licenciaConducir)
          : undefined,
      categoriaLicencia:
        dto.categoriaLicencia !== undefined
          ? aTextoOpcional(dto.categoriaLicencia)
          : undefined,
      licenciaVencimiento:
        dto.licenciaVencimiento !== undefined
          ? aFechaOpcional(dto.licenciaVencimiento)
          : undefined,
      estadoActivo:
        dto.estadoActivo === undefined
          ? undefined
          : esEstadoActivo(dto.estadoActivo)
            ? dto.estadoActivo
            : throwEstadoActivoInvalido(dto.estadoActivo),
      usuarioModificacion: actor,
    });
  }
}

@Injectable()
export class AnularPersonalUseCase {
  constructor(
    @Inject(PERSONAL_REPOSITORY) private readonly personal: PersonalRepository,
  ) {}

  async execute(id: number, actor: string): Promise<PersonalProps> {
    const persona = await this.personal.findById(id);
    if (!persona) {
      throw new RecursoNoEncontradoError(
        'El personal indicado no existe.',
        'personal',
        id,
      );
    }
    return this.personal.anular(id, actor);
  }
}
