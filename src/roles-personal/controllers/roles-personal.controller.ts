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
import { RolUsuario } from '../../auth/domain/usuario.repository.js';
import { Roles, type UsuarioJwt } from '../../auth/guards/jwt-auth.guard.js';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import {
  ActualizarRolPersonalDto,
  ActualizarRolPersonalUseCase,
  AnularRolPersonalUseCase,
  ListarRolesPersonalUseCase,
  ObtenerRolPersonalUseCase,
  RegistrarRolPersonalDto,
  RegistrarRolPersonalUseCase,
} from '../use-cases/rol-personal.use-cases.js';

function actorDe(req: Request): string {
  return (
    (req as Request & { usuario?: UsuarioJwt }).usuario?.email ?? 'sistema'
  );
}

@Controller('roles-personal')
export class RolesPersonalController {
  constructor(
    private readonly registrar: RegistrarRolPersonalUseCase,
    private readonly listar: ListarRolesPersonalUseCase,
    private readonly obtener: ObtenerRolPersonalUseCase,
    private readonly actualizar: ActualizarRolPersonalUseCase,
    private readonly anular: AnularRolPersonalUseCase,
  ) {}

  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.OPERACIONES,
    RolUsuario.SUPERVISOR,
  )
  @Get()
  async listarRoles(
    @Query()
    query: {
      texto?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.OPERACIONES,
    RolUsuario.SUPERVISOR,
  )
  @Get(':id')
  async obtenerRol(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post()
  async registrarRol(
    @Body() dto: RegistrarRolPersonalDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Patch(':id')
  async actualizarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarRolPersonalDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Delete(':id')
  async anularRol(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id, actorDe(req)) };
  }
}
