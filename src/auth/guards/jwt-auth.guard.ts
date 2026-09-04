import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { RolUsuario } from '../domain/usuario.repository.js';

export const ES_PUBLICO = 'esPublico';
// Marca un endpoint como accesible sin token (login, estado).
export const Public = () => SetMetadata(ES_PUBLICO, true);

export const ROLES_REQUERIDOS = 'rolesRequeridos';
// Restringe un endpoint a ciertos roles. Sin decorador: cualquier usuario logueado.
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_REQUERIDOS, roles);

export interface UsuarioJwt {
  sub: number;
  email: string;
  nombre: string;
  rol: RolUsuario;
  clienteId: number | null;
}

// Guard global: valida el Bearer token en todas las rutas salvo las @Public()
// y aplica @Roles() si esta presente.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extraerToken(request);
    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido.');
    }

    let payload: UsuarioJwt;
    try {
      payload = await this.jwt.verifyAsync<UsuarioJwt>(token);
    } catch {
      throw new UnauthorizedException('Token invalido o expirado.');
    }
    (request as Request & { usuario: UsuarioJwt }).usuario = payload;

    const roles = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_REQUERIDOS,
      [context.getHandler(), context.getClass()],
    );
    if (roles?.length && !roles.includes(payload.rol)) {
      throw new ForbiddenException('No tiene permisos para esta operacion.');
    }
    return true;
  }

  private extraerToken(request: Request): string | null {
    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return null;
  }
}
