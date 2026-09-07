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
  GESTION_DOCUMENTOS_UNIDAD,
  GestionDocumentosUseCase,
  RegistrarDocumentoDto,
} from '../use-cases/documento.use-cases.js';

function actorDe(req: Request): string {
  return (req as Request & { usuario?: UsuarioJwt }).usuario?.email ?? 'sistema';
}

// Documentos de una unidad (SOAT, revision tecnica, MTC, poliza...).
@Controller('unidades/:unidadId/documentos')
export class DocumentosUnidadController {
  constructor(
    @Inject(GESTION_DOCUMENTOS_UNIDAD)
    private readonly gestion: GestionDocumentosUseCase,
  ) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES, RolUsuario.SUPERVISOR)
  @Get()
  async listar(@Param('unidadId', ParseIntPipe) unidadId: number) {
    return this.gestion.listar(unidadId);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Post()
  async registrar(
    @Param('unidadId', ParseIntPipe) unidadId: number,
    @Body() dto: RegistrarDocumentoDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.registrar(unidadId, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Patch(':documentoId')
  async actualizar(
    @Param('unidadId', ParseIntPipe) unidadId: number,
    @Param('documentoId', ParseIntPipe) documentoId: number,
    @Body() dto: ActualizarDocumentoDto,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.actualizar(unidadId, documentoId, dto, actorDe(req)) };
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.OPERACIONES)
  @Delete(':documentoId')
  async anular(
    @Param('unidadId', ParseIntPipe) unidadId: number,
    @Param('documentoId', ParseIntPipe) documentoId: number,
    @Req() req: Request,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.anular(unidadId, documentoId, actorDe(req)) };
  }
}
