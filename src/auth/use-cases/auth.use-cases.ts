import { Inject, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import {
  DomainValidationError,
  RecursoNoEncontradoError,
} from '../../shared/errors/domain-validation.error.js';
import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';
import { EstadoActivo, esEstadoActivo } from '../../shared/enums/estado-activo.enum.js';
import {
  construirPaginacion,
  type RespuestaPaginadaDto,
} from '../../shared/dto/respuesta.dto.js';
import { aEnteroPositivo, aNumeroOpcional, aTextoOpcional } from '../../shared/dto/parseo.js';
import {
  RolUsuario,
  USUARIO_REPOSITORY,
  esRolUsuario,
  type UsuarioProps,
} from '../domain/usuario.repository.js';
import type { UsuarioRepository } from '../domain/usuario.repository.js';
import type { UsuarioJwt } from '../guards/jwt-auth.guard.js';

const RONDAS_BCRYPT = 10;

export class LoginDto {
  email: string;
  password: string;
}

export class RegistrarUsuarioDto {
  email: string;
  nombre: string;
  password: string;
  rol?: string;
  clienteId?: number;
  personalId?: number;
}

export class ActualizarUsuarioDto {
  nombre?: string;
  rol?: string;
  password?: string;
  clienteId?: number;
  personalId?: number;
  estadoActivo?: string;
}

export interface SesionDto {
  accessToken: string;
  usuario: {
    id: number;
    email: string;
    nombre: string;
    rol: RolUsuario;
    clienteId: number | null;
  };
}

function exigirTexto(v: unknown, campo: string): string {
  const t = aTextoOpcional(v);
  if (!t) {
    throw new DomainValidationError(`El campo "${campo}" es obligatorio.`, campo, 'REQUERIDO', v ?? null);
  }
  return t;
}

function exigirEmail(v: unknown): string {
  const email = exigirTexto(v, 'email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainValidationError('El email no es valido.', 'email', 'INVALIDO', v);
  }
  return email;
}

function exigirPassword(v: unknown): string {
  const pass = exigirTexto(v, 'password');
  if (pass.length < 6) {
    throw new DomainValidationError(
      'La contraseña debe tener al menos 6 caracteres.',
      'password',
      'INVALIDO',
      null,
    );
  }
  return pass;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<SesionDto> {
    const email = exigirEmail(dto.email);
    const password = exigirTexto(dto.password, 'password');

    const usuario = await this.usuarios.findByEmail(email);
    // Mensaje unico para email inexistente y password erroneo: no filtrar
    // cuales cuentas existen.
    if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }
    if (usuario.estadoActivo !== EstadoActivo.ACTIVO) {
      throw new UnauthorizedException('El usuario esta inactivo.');
    }

    const payload: UsuarioJwt = {
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      clienteId: usuario.clienteId,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        clienteId: usuario.clienteId,
      },
    };
  }
}

@Injectable()
export class RegistrarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
  ) {}

  async execute(dto: RegistrarUsuarioDto, creadoPor: string): Promise<UsuarioProps> {
    const email = exigirEmail(dto.email);
    const password = exigirPassword(dto.password);
    const nombre = exigirTexto(dto.nombre, 'nombre');
    const rol = esRolUsuario(dto.rol) ? dto.rol : RolUsuario.OPERACIONES;

    const existente = await this.usuarios.findByEmail(email);
    if (existente) {
      throw new DomainValidationError(
        `Ya existe un usuario con el email "${email}".`,
        'email',
        'DUPLICADO',
        email,
      );
    }

    return this.usuarios.crear({
      email,
      nombre,
      rol,
      passwordHash: await bcrypt.hash(password, RONDAS_BCRYPT),
      clienteId: aNumeroOpcional(dto.clienteId),
      personalId: aNumeroOpcional(dto.personalId),
      usuarioCreacion: creadoPor,
    });
  }
}

@Injectable()
export class ActualizarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
  ) {}

  async execute(
    id: number,
    dto: ActualizarUsuarioDto,
    modificadoPor: string,
  ): Promise<UsuarioProps> {
    const usuario = await this.usuarios.findById(id);
    if (!usuario) {
      throw new RecursoNoEncontradoError('El usuario no existe.', 'usuario', id);
    }
    return this.usuarios.actualizar(id, {
      nombre: dto.nombre !== undefined ? exigirTexto(dto.nombre, 'nombre') : undefined,
      rol:
        dto.rol !== undefined
          ? esRolUsuario(dto.rol)
            ? dto.rol
            : usuario.rol
          : undefined,
      passwordHash:
        dto.password !== undefined
          ? await bcrypt.hash(exigirPassword(dto.password), RONDAS_BCRYPT)
          : undefined,
      clienteId:
        dto.clienteId !== undefined ? aNumeroOpcional(dto.clienteId) : undefined,
      personalId:
        dto.personalId !== undefined ? aNumeroOpcional(dto.personalId) : undefined,
      estadoActivo: esEstadoActivo(dto.estadoActivo) ? dto.estadoActivo : undefined,
      usuarioModificacion: modificadoPor,
    });
  }
}

@Injectable()
export class AnularUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
  ) {}

  async execute(id: number, anuladoPor: string): Promise<UsuarioProps> {
    const usuario = await this.usuarios.findById(id);
    if (!usuario) {
      throw new RecursoNoEncontradoError('El usuario no existe.', 'usuario', id);
    }
    return this.usuarios.anular(id, anuladoPor);
  }
}

@Injectable()
export class ListarUsuariosUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
  ) {}

  async execute(query: {
    texto?: string;
    rol?: string;
    estadoRegistro?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<UsuarioProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(200, aEnteroPositivo(query.pageSize, 50));
    const { datos, total } = await this.usuarios.buscar({
      texto: aTextoOpcional(query.texto) ?? undefined,
      rol: esRolUsuario(query.rol) ? query.rol : undefined,
      estadoRegistro:
        query.estadoRegistro === 'TODOS' ? undefined : EstadoRegistro.ACTIVO,
      page,
      pageSize,
    });
    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}

// Crea el usuario administrador inicial si la tabla esta vacia, para poder
// entrar al sistema la primera vez. Credenciales por variables de entorno
// (ADMIN_EMAIL / ADMIN_PASSWORD) con valores por defecto de desarrollo.
@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapAdminService.name);

  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
  ) {}

  // Usuarios que deben existir siempre; se crean si faltan (idempotente).
  // Las credenciales viven en variables de entorno, nunca en el codigo: el
  // repositorio es publico. Sin password definido, ese usuario se omite.
  private readonly semilla = [
    {
      email: process.env.ADMIN_EMAIL ?? 'admin@mape.com',
      nombre: 'Administrador',
      password: process.env.ADMIN_PASSWORD,
    },
    {
      email: process.env.GERENCIA_EMAIL ?? 'gerencia@syemape.com',
      nombre: 'Gerencia',
      password: process.env.GERENCIA_PASSWORD,
    },
  ];

  async onModuleInit(): Promise<void> {
    try {
      for (const usuario of this.semilla) {
        if (!usuario.password) continue;
        const existente = await this.usuarios.findByEmail(usuario.email);
        if (existente) continue;
        await this.usuarios.crear({
          email: usuario.email,
          nombre: usuario.nombre,
          rol: RolUsuario.ADMINISTRADOR,
          passwordHash: await bcrypt.hash(usuario.password, RONDAS_BCRYPT),
          clienteId: null,
          personalId: null,
          usuarioCreacion: 'bootstrap',
        });
        this.logger.log(`Usuario administrador creado: ${usuario.email}`);
      }
    } catch (error) {
      // Sin BD disponible el arranque no debe caerse; el admin se creara en el
      // siguiente arranque con conexion.
      this.logger.warn(
        `No se pudo verificar/crear el admin inicial: ${(error as Error).message}`,
      );
    }
  }
}
