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
import { aEnteroPositivo, aTextoOpcional } from '../../shared/dto/parseo.js';
import {
  CLIENTE_REPOSITORY,
  type ClienteProps,
  type ClienteRepository,
} from '../domain/repositories/cliente.repository.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;
const USUARIO_SISTEMA = 'sistema';

function throwEstadoActivoInvalido(valor: unknown): never {
  throw new DomainValidationError(
    'El estadoActivo no es valido. Use ACTIVO o INACTIVO.',
    'estadoActivo',
    'INVALIDO',
    valor,
  );
}


// Normaliza RUC/DNI: quita espacios y guiones.
function normalizarDoc(valor: string | null): string | null {
  if (!valor) return null;
  const limpio = valor.toUpperCase().replace(/[\s\p{Pd}−]/gu, '').trim();
  return limpio || null;
}

export class RegistrarClienteDto {
  razonSocial: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  cuenta?: string;
  direccion?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  email?: string;
}

export class ActualizarClienteDto {
  razonSocial?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  cuenta?: string;
  direccion?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  email?: string;
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

@Injectable()
export class RegistrarClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepository,
  ) {}

  async execute(dto: RegistrarClienteDto): Promise<ClienteProps> {
    const razonSocial = exigirTexto(dto.razonSocial, 'razonSocial');
    const numeroDocumento = aTextoOpcional(dto.numeroDocumento);
    const numeroDocumentoNormalizado = normalizarDoc(numeroDocumento);

    if (numeroDocumentoNormalizado) {
      const existente = await this.clientes.findByDocumentoActivo(
        numeroDocumentoNormalizado,
      );
      if (existente) {
        throw new DomainValidationError(
          `Ya existe un cliente activo con el documento "${numeroDocumento}".`,
          'numeroDocumento',
          'DUPLICADO',
          numeroDocumento,
        );
      }
    }

    return this.clientes.crear({
      razonSocial,
      tipoDocumento: aTextoOpcional(dto.tipoDocumento) ?? 'RUC',
      numeroDocumento,
      numeroDocumentoNormalizado,
      cuenta: aTextoOpcional(dto.cuenta),
      direccion: aTextoOpcional(dto.direccion),
      contactoNombre: aTextoOpcional(dto.contactoNombre),
      contactoTelefono: aTextoOpcional(dto.contactoTelefono),
      email: aTextoOpcional(dto.email),
      usuarioCreacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class ListarClientesUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepository,
  ) {}

  async execute(query: {
    texto?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<ClienteProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );
    const { datos, total } = await this.clientes.buscar({
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
export class ObtenerClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepository,
  ) {}

  async execute(id: number): Promise<ClienteProps> {
    const cliente = await this.clientes.findById(id);
    if (!cliente) {
      throw new RecursoNoEncontradoError(
        'El cliente indicado no existe.',
        'cliente',
        id,
      );
    }
    return cliente;
  }
}

@Injectable()
export class ActualizarClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepository,
  ) {}

  async execute(id: number, dto: ActualizarClienteDto): Promise<ClienteProps> {
    const cliente = await this.clientes.findById(id);
    if (!cliente) {
      throw new RecursoNoEncontradoError(
        'El cliente indicado no existe.',
        'cliente',
        id,
      );
    }

    let numeroDocumento: string | null | undefined;
    let numeroDocumentoNormalizado: string | null | undefined;
    if (dto.numeroDocumento !== undefined) {
      numeroDocumento = aTextoOpcional(dto.numeroDocumento);
      numeroDocumentoNormalizado = normalizarDoc(numeroDocumento);
      if (numeroDocumentoNormalizado) {
        const otro = await this.clientes.findByDocumentoActivo(
          numeroDocumentoNormalizado,
        );
        if (otro && otro.id !== id) {
          throw new DomainValidationError(
            `Ya existe otro cliente activo con el documento "${numeroDocumento}".`,
            'numeroDocumento',
            'DUPLICADO',
            numeroDocumento,
          );
        }
      }
    }

    return this.clientes.actualizar(id, {
      razonSocial:
        dto.razonSocial !== undefined
          ? exigirTexto(dto.razonSocial, 'razonSocial')
          : undefined,
      tipoDocumento:
        dto.tipoDocumento !== undefined
          ? (aTextoOpcional(dto.tipoDocumento) ?? 'RUC')
          : undefined,
      numeroDocumento,
      numeroDocumentoNormalizado,
      cuenta: dto.cuenta !== undefined ? aTextoOpcional(dto.cuenta) : undefined,
      direccion:
        dto.direccion !== undefined ? aTextoOpcional(dto.direccion) : undefined,
      contactoNombre:
        dto.contactoNombre !== undefined
          ? aTextoOpcional(dto.contactoNombre)
          : undefined,
      contactoTelefono:
        dto.contactoTelefono !== undefined
          ? aTextoOpcional(dto.contactoTelefono)
          : undefined,
      email: dto.email !== undefined ? aTextoOpcional(dto.email) : undefined,
      estadoActivo:
        dto.estadoActivo === undefined
          ? undefined
          : esEstadoActivo(dto.estadoActivo)
            ? dto.estadoActivo
            : throwEstadoActivoInvalido(dto.estadoActivo),
      usuarioModificacion: USUARIO_SISTEMA,
    });
  }
}

@Injectable()
export class AnularClienteUseCase {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clientes: ClienteRepository,
  ) {}

  async execute(id: number): Promise<ClienteProps> {
    const cliente = await this.clientes.findById(id);
    if (!cliente) {
      throw new RecursoNoEncontradoError(
        'El cliente indicado no existe.',
        'cliente',
        id,
      );
    }
    return this.clientes.anular(id, USUARIO_SISTEMA);
  }
}
