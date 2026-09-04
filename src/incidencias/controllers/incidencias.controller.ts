import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import {
  ActualizarIncidenciaDto,
  ActualizarIncidenciaUseCase,
  AgregarEvidenciaDto,
  AgregarEvidenciaUseCase,
  ListarIncidenciasUseCase,
  ObtenerIncidenciaUseCase,
  ReportarIncidenciaDto,
  ReportarIncidenciaUseCase,
} from '../use-cases/incidencia.use-cases.js';

// Incidencias por manifiesto y su gestion global.
@Controller()
export class IncidenciasController {
  constructor(
    private readonly reportar: ReportarIncidenciaUseCase,
    private readonly actualizar: ActualizarIncidenciaUseCase,
    private readonly agregarEvidencia: AgregarEvidenciaUseCase,
    private readonly obtener: ObtenerIncidenciaUseCase,
    private readonly listar: ListarIncidenciasUseCase,
  ) {}

  @Post('manifiestos/:manifiestoId/incidencias')
  async reportarIncidencia(
    @Param('manifiestoId', ParseIntPipe) manifiestoId: number,
    @Body() dto: ReportarIncidenciaDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.reportar.execute(manifiestoId, dto) };
  }

  @Get('incidencias')
  async listarIncidencias(
    @Query()
    query: {
      manifiestoId?: string;
      tipo?: string;
      criticidad?: string;
      estado?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Get('incidencias/:id')
  async obtenerIncidencia(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Patch('incidencias/:id')
  async actualizarIncidencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarIncidenciaDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto) };
  }

  @Post('incidencias/:id/evidencias')
  async agregarEvidenciaIncidencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarEvidenciaDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.agregarEvidencia.execute(id, dto) };
  }
}
