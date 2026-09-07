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
  ActualizarPersonalDto,
  ActualizarPersonalUseCase,
  AnularPersonalUseCase,
  ListarPersonalUseCase,
  ObtenerPersonalUseCase,
  RegistrarPersonalDto,
  RegistrarPersonalUseCase,
} from '../use-cases/personal.use-cases.js';

function actorDe(req: Request): string {
  return (req as Request & { usuario?: UsuarioJwt }).usuario?.email ?? 'sistema';
}

// Maestro de personal: conductores y tripulacion.
@Controller('personal')
export class PersonalController {
  constructor(
    private readonly registrar: RegistrarPersonalUseCase,
    private readonly listar: ListarPersonalUseCase,
    private readonly obtener: ObtenerPersonalUseCase,
    private readonly actualizar: ActualizarPersonalUseCase,
    private readonly anular: AnularPersonalUseCase,
  ) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES, RolUsuario.SUPERVISOR)
  @Get()
  async listarPersonal(
    @Query()
    query: {
      texto?: string;
      tipo?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES, RolUsuario.SUPERVISOR)
  @Get(':id')
  async obtenerPersonal(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post()
  async registrarPersonal(
    @Body() dto: RegistrarPersonalDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Patch(':id')
  async actualizarPersonal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPersonalDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Delete(':id')
  async anularPersonal(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id, actorDe(req)) };
  }
}
