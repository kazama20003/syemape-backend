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
  AnularManifiestoUseCase,
  CambiarEstadoManifiestoDto,
  CambiarEstadoManifiestoUseCase,
  ListarManifiestosUseCase,
  ObtenerManifiestoUseCase,
  RegistrarManifiestoDto,
  RegistrarManifiestoUseCase,
} from '../use-cases/manifiesto.use-cases.js';

function actorDe(req: Request): string {
  return (req as Request & { usuario?: UsuarioJwt }).usuario?.email ?? 'sistema';
}

// Manifiestos de viaje: agregan unidad, conductor, supervisor, cliente, ruta,
// ubicaciones, tipo de servicio y las lineas de carga.
@Controller('manifiestos')
export class ManifiestosController {
  constructor(
    private readonly registrar: RegistrarManifiestoUseCase,
    private readonly listar: ListarManifiestosUseCase,
    private readonly obtener: ObtenerManifiestoUseCase,
    private readonly cambiarEstado: CambiarEstadoManifiestoUseCase,
    private readonly anular: AnularManifiestoUseCase,
  ) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES, RolUsuario.SUPERVISOR)
  @Get()
  async listarManifiestos(
    @Query()
    query: {
      numero?: string;
      estado?: string;
      unidadId?: string;
      conductorId?: string;
      clienteId?: string;
      rutaId?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES, RolUsuario.SUPERVISOR)
  @Get(':id')
  async obtenerManifiesto(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post()
  async registrarManifiesto(
    @Body() dto: RegistrarManifiestoDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Patch(':id/estado')
  async cambiarEstadoManifiesto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoManifiestoDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.cambiarEstado.execute(id, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Delete(':id')
  async anularManifiesto(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id, actorDe(req)) };
  }
}
