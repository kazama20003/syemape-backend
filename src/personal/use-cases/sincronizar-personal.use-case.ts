import { Inject, Injectable } from '@nestjs/common';
import {
  PERSONAL_REPOSITORY,
  type PersonalProps,
  type PersonalRepository,
} from '../domain/repositories/personal.repository.js';
import {
  TipoPersonal,
  esTipoPersonal,
} from '../domain/value-objects/tipo-personal.enum.js';
import { normalizarDocumento } from '../domain/value-objects/documento.vo.js';

// Rol sugerido para el backend consumidor (mape-app-backend: ADMIN | SUPERVISOR | OPERATOR).
// Solo es una sugerencia; el consumidor decide el rol final. Se considera
// SUPERVISOR si el tipo lo es o si alguno de sus roles puede supervisar.
function rolSugeridoDe(p: PersonalProps): 'SUPERVISOR' | 'OPERATOR' {
  const supervisaPorRol = p.roles.some((r) => r.puedeSupervisar);
  return p.tipo === TipoPersonal.SUPERVISOR || supervisaPorRol
    ? 'SUPERVISOR'
    : 'OPERATOR';
}

// Cargo legible: el primer rol asignado o, en su defecto, el tipo de personal.
function cargoDe(p: PersonalProps): string {
  return p.roles[0]?.nombre ?? p.tipo;
}

// Forma pensada para crear un usuario en otro sistema a partir del personal.
export interface PersonalParaUsuario {
  // Identificadores estables (idempotencia en el consumidor)
  publicId: string;
  documento: string;
  tipoDocumento: string;
  // Nombre
  nombreCompleto: string;
  nombres: string;
  apellidos: string;
  // Datos de contacto / perfil
  apelativo: string | null;
  telefono: string | null;
  cargo: string;
  tipo: TipoPersonal;
  // Roles funcionales asignados en syemape (codigo + nombre)
  roles: { codigo: string; nombre: string }[];
  // Sugerencias para el alta de usuario
  rolSugerido: 'SUPERVISOR' | 'OPERATOR';
  // El personal NO tiene correo: el consumidor debe generarlo/solicitarlo.
  correoSugerido: string | null;
  activo: boolean;
}

function aPersonalParaUsuario(p: PersonalProps): PersonalParaUsuario {
  return {
    publicId: p.publicId,
    documento: p.numeroDocumento,
    tipoDocumento: p.tipoDocumento,
    nombreCompleto: [p.nombres, p.apellidos].filter(Boolean).join(' '),
    nombres: p.nombres,
    apellidos: p.apellidos,
    apelativo: p.apelativo,
    telefono: p.telefono,
    cargo: cargoDe(p),
    tipo: p.tipo,
    roles: p.roles.map((r) => ({ codigo: r.codigo, nombre: r.nombre })),
    rolSugerido: rolSugeridoDe(p),
    correoSugerido: null,
    activo: true,
  };
}

@Injectable()
export class SincronizarPersonalUseCase {
  constructor(
    @Inject(PERSONAL_REPOSITORY) private readonly personal: PersonalRepository,
  ) {}

  async execute(query: {
    tipo?: string;
    documento?: string;
  }): Promise<PersonalParaUsuario[]> {
    const tipo = esTipoPersonal(query.tipo) ? query.tipo : undefined;
    const documento =
      query.documento && query.documento.trim()
        ? normalizarDocumento(query.documento)
        : undefined;

    const filas = await this.personal.listarActivosParaSincronizacion({
      tipo,
      documento,
    });
    return filas.map(aPersonalParaUsuario);
  }
}
