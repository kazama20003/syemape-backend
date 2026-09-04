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
} from '@nestjs/common';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import {
  ActualizarDocumentoDto,
  GESTION_DOCUMENTOS_PERSONAL,
  GestionDocumentosUseCase,
  RegistrarDocumentoDto,
} from '../use-cases/documento.use-cases.js';

// Documentos de una persona (licencia, DNI, examen medico, SCTR...).
@Controller('personal/:personalId/documentos')
export class DocumentosPersonalController {
  constructor(
    @Inject(GESTION_DOCUMENTOS_PERSONAL)
    private readonly gestion: GestionDocumentosUseCase,
  ) {}

  @Get()
  async listar(@Param('personalId', ParseIntPipe) personalId: number) {
    return this.gestion.listar(personalId);
  }

  @Post()
  async registrar(
    @Param('personalId', ParseIntPipe) personalId: number,
    @Body() dto: RegistrarDocumentoDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.registrar(personalId, dto) };
  }

  @Patch(':documentoId')
  async actualizar(
    @Param('documentoId', ParseIntPipe) documentoId: number,
    @Body() dto: ActualizarDocumentoDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.actualizar(documentoId, dto) };
  }

  @Delete(':documentoId')
  async anular(
    @Param('documentoId', ParseIntPipe) documentoId: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.anular(documentoId) };
  }
}
