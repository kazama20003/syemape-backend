import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { RolUsuario } from '../../auth/domain/usuario.repository.js';
import { Roles, type UsuarioJwt } from '../../auth/guards/jwt-auth.guard.js';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import {
  AsignarGpsUnidadDto,
  AsignarGpsUnidadUseCase,
  LiberarGpsUnidadDto,
  LiberarGpsUnidadUseCase,
  ListarAsignacionesGpsUnidadUseCase,
  ListarLecturasKilometrajeUnidadUseCase,
  RegistrarLecturaKilometrajeUnidadDto,
  RegistrarLecturaKilometrajeUnidadUseCase,
} from '../use-cases/unidad-operacion.use-cases.js';

function actorDe(req: Request): string {
  return (req as Request & { usuario?: UsuarioJwt }).usuario?.email ?? 'sistema';
}

@Controller('unidades/:unidadId')
export class UnidadesOperacionController {
  constructor(
    private readonly listarGps: ListarAsignacionesGpsUnidadUseCase,
    private readonly asignarGps: AsignarGpsUnidadUseCase,
    private readonly liberarGps: LiberarGpsUnidadUseCase,
    private readonly listarKilometrajes: ListarLecturasKilometrajeUnidadUseCase,
    private readonly registrarKilometraje: RegistrarLecturaKilometrajeUnidadUseCase,
  ) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES, RolUsuario.SUPERVISOR)
  @Get('gps')
  async listarAsignacionesGps(@Param('unidadId', ParseIntPipe) unidadId: number) {
    return { datos: await this.listarGps.execute(unidadId) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post('gps')
  async asignar(
    @Param('unidadId', ParseIntPipe) unidadId: number,
    @Body() dto: AsignarGpsUnidadDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.asignarGps.execute(unidadId, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Patch('gps/:asignacionId')
  async liberar(
    @Param('unidadId', ParseIntPipe) unidadId: number,
    @Param('asignacionId', ParseIntPipe) asignacionId: number,
    @Body() dto: LiberarGpsUnidadDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return {
      datos: await this.liberarGps.execute(unidadId, asignacionId, dto, actorDe(req)),
    };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES, RolUsuario.SUPERVISOR)
  @Get('kilometrajes')
  async listarLecturas(@Param('unidadId', ParseIntPipe) unidadId: number) {
    return { datos: await this.listarKilometrajes.execute(unidadId) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post('kilometrajes')
  async registrarLectura(
    @Param('unidadId', ParseIntPipe) unidadId: number,
    @Body() dto: RegistrarLecturaKilometrajeUnidadDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return {
      datos: await this.registrarKilometraje.execute(unidadId, dto, actorDe(req)),
    };
  }

}
