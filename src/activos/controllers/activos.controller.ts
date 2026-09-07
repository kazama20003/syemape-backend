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
import { RolUsuario } from '../../auth/domain/usuario.repository.js';
import { Roles, type UsuarioJwt } from '../../auth/guards/jwt-auth.guard.js';
import {
  ActualizarActivoDto,
  ActualizarActivoUseCase,
  AnularActivoUseCase,
  ListarActivosUseCase,
  ObtenerActivoUseCase,
  RegistrarActivoDto,
  RegistrarActivoUseCase,
} from '../use-cases/activo.use-cases.js';

function actorDe(req: Request): string {
  return (
    (req as Request & { usuario?: UsuarioJwt }).usuario?.email ?? 'sistema'
  );
}

@Controller('activos')
export class ActivosController {
  constructor(
    private readonly registrar: RegistrarActivoUseCase,
    private readonly listar: ListarActivosUseCase,
    private readonly obtener: ObtenerActivoUseCase,
    private readonly actualizar: ActualizarActivoUseCase,
    private readonly anular: AnularActivoUseCase,
  ) {}

  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.OPERACIONES,
    RolUsuario.SUPERVISOR,
  )
  @Get()
  async listarActivos(
    @Query()
    query: {
      codigo?: string;
      texto?: string;
      tipo?: string;
      estadoOperativo?: string;
      estadoRegistro?: string;
      responsableId?: string;
      ubicacionHabitualId?: string;
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
  async obtenerActivo(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post()
  async registrarActivo(
    @Body() dto: RegistrarActivoDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Patch(':id')
  async actualizarActivo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarActivoDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Delete(':id')
  async anularActivo(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id, actorDe(req)) };
  }
}
