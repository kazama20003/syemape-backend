import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import {
  ListarSeguimientosUseCase,
  RegistrarSeguimientoDto,
  RegistrarSeguimientoUseCase,
} from '../use-cases/seguimiento.use-cases.js';

// Seguimiento (check-ins GPS) de un manifiesto.
@Controller('manifiestos/:manifiestoId/seguimientos')
export class SeguimientoController {
  constructor(
    private readonly registrar: RegistrarSeguimientoUseCase,
    private readonly listar: ListarSeguimientosUseCase,
  ) {}

  @Get()
  async listarSeguimientos(
    @Param('manifiestoId', ParseIntPipe) manifiestoId: number,
  ) {
    return this.listar.execute(manifiestoId);
  }

  @Post()
  async registrarSeguimiento(
    @Param('manifiestoId', ParseIntPipe) manifiestoId: number,
    @Body() dto: RegistrarSeguimientoDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(manifiestoId, dto) };
  }
}
