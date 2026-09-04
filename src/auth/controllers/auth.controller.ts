import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import { Public, Roles, type UsuarioJwt } from '../guards/jwt-auth.guard.js';
import { RolUsuario } from '../domain/usuario.repository.js';
import {
  ActualizarUsuarioDto,
  ActualizarUsuarioUseCase,
  AnularUsuarioUseCase,
  ListarUsuariosUseCase,
  LoginDto,
  LoginUseCase,
  RegistrarUsuarioDto,
  RegistrarUsuarioUseCase,
} from '../use-cases/auth.use-cases.js';

function actorDe(req: Request): string {
  const usuario = (req as Request & { usuario?: UsuarioJwt }).usuario;
  return usuario?.email ?? 'sistema';
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly registrar: RegistrarUsuarioUseCase,
    private readonly actualizar: ActualizarUsuarioUseCase,
    private readonly anular: AnularUsuarioUseCase,
    private readonly listar: ListarUsuariosUseCase,
  ) {}

  @Public()
  @Post('login')
  async iniciarSesion(@Body() dto: LoginDto): Promise<RespuestaDto<unknown>> {
    return { datos: await this.login.execute(dto) };
  }

  // Perfil de la sesion actual (el front lo usa para restaurar la sesion).
  @Get('me')
  me(@Req() req: Request): RespuestaDto<unknown> {
    const usuario = (req as Request & { usuario?: UsuarioJwt }).usuario;
    return {
      datos: {
        id: usuario?.sub,
        email: usuario?.email,
        nombre: usuario?.nombre,
        rol: usuario?.rol,
        clienteId: usuario?.clienteId ?? null,
      },
    };
  }

  // ------- Gestion de usuarios (solo ADMINISTRADOR) -------

  @Roles(RolUsuario.ADMINISTRADOR)
  @Get('usuarios')
  async listarUsuarios(
    @Query()
    query: { texto?: string; rol?: string; estadoRegistro?: string; page?: string; pageSize?: string },
  ) {
    return this.listar.execute(query);
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Post('usuarios')
  async registrarUsuario(
    @Body() dto: RegistrarUsuarioDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Patch('usuarios/:id')
  async actualizarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUsuarioDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR)
  @Delete('usuarios/:id')
  async anularUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id, actorDe(req)) };
  }
}
