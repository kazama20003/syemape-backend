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
} from '@nestjs/common';
import type { RespuestaDto } from '../../shared/dto/respuesta.dto.js';
import {
  ActualizarTipoServicioDto,
  ActualizarTipoServicioUseCase,
  AnularTipoServicioUseCase,
  ListarTiposServicioUseCase,
  ObtenerTipoServicioUseCase,
  RegistrarTipoServicioDto,
  RegistrarTipoServicioUseCase,
} from '../use-cases/tipo-servicio.use-cases.js';

// Catalogo de tipos de servicio.
@Controller('tipos-servicio')
export class TiposServicioController {
  constructor(
    private readonly registrar: RegistrarTipoServicioUseCase,
    private readonly listar: ListarTiposServicioUseCase,
    private readonly obtener: ObtenerTipoServicioUseCase,
    private readonly actualizar: ActualizarTipoServicioUseCase,
    private readonly anular: AnularTipoServicioUseCase,
  ) {}

  @Get()
  async listarTipos(
    @Query()
    query: { texto?: string; estadoRegistro?: string; page?: string; pageSize?: string },
  ) {
    return this.listar.execute(query);
  }

  @Get(':id')
  async obtenerTipo(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Post()
  async registrarTipo(
    @Body() dto: RegistrarTipoServicioDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto) };
  }

  @Patch(':id')
  async actualizarTipo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarTipoServicioDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto) };
  }

  @Delete(':id')
  async anularTipo(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id) };
  }
}
