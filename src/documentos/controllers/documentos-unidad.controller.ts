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
  GESTION_DOCUMENTOS_UNIDAD,
  GestionDocumentosUseCase,
  RegistrarDocumentoDto,
} from '../use-cases/documento.use-cases.js';

// Documentos de una unidad (SOAT, revision tecnica, MTC, poliza...).
@Controller('unidades/:unidadId/documentos')
export class DocumentosUnidadController {
  constructor(
    @Inject(GESTION_DOCUMENTOS_UNIDAD)
    private readonly gestion: GestionDocumentosUseCase,
  ) {}

  @Get()
  async listar(@Param('unidadId', ParseIntPipe) unidadId: number) {
    return this.gestion.listar(unidadId);
  }

  @Post()
  async registrar(
    @Param('unidadId', ParseIntPipe) unidadId: number,
    @Body() dto: RegistrarDocumentoDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.gestion.registrar(unidadId, dto) };
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
