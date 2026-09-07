import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import { RolUsuario } from '../../auth/domain/usuario.repository.js';
import { Roles, type UsuarioJwt } from '../../auth/guards/jwt-auth.guard.js';
import {
  ActualizarDocumentoDto,
  GESTION_DOCUMENTOS_PERSONAL,
  GestionDocumentosUseCase,
  RegistrarDocumentoDto,
} from '../use-cases/documento.use-cases.js';

function actorDe(req: Request): string {
  return (req as Request & { usuario?: UsuarioJwt }).usuario?.email ?? 'sistema';
}

// Documentos de una persona (licencia, DNI, examen medico, SCTR...).
@Controller('personal/:personalId/documentos')
export class DocumentosPersonalController {
  constructor(
    @Inject(GESTION_DOCUMENTOS_PERSONAL)
    private readonly gestion: GestionDocumentosUseCase,
  ) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES, RolUsuario.SUPERVISOR)
  @Get()
  async listar(@Param('personalId', ParseIntPipe) personalId: number) {
    return this.gestion.listar(personalId);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post()
  async registrar(
    @Param('personalId', ParseIntPipe) personalId: number,
    @Body() dto: RegistrarDocumentoDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.registrar(personalId, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Patch(':documentoId')
  async actualizar(
    @Param('personalId', ParseIntPipe) personalId: number,
    @Param('documentoId', ParseIntPipe) documentoId: number,
    @Body() dto: ActualizarDocumentoDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.actualizar(personalId, documentoId, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Delete(':documentoId')
  async anular(
    @Param('personalId', ParseIntPipe) personalId: number,
    @Param('documentoId', ParseIntPipe) documentoId: number,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.anular(personalId, documentoId, actorDe(req)) };
  }
}
