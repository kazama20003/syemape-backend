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
  ActualizarTipoVehiculoDto,
  ActualizarTipoVehiculoUseCase,
  AnularTipoVehiculoUseCase,
  ListarTiposVehiculoUseCase,
  ObtenerTipoVehiculoUseCase,
  RegistrarTipoVehiculoDto,
  RegistrarTipoVehiculoUseCase,
} from '../use-cases/tipo-vehiculo.use-cases.js';

// Catalogo administrable de tipos de vehiculo.
@Controller('tipos-vehiculo')
export class TiposVehiculoController {
  constructor(
    private readonly registrar: RegistrarTipoVehiculoUseCase,
    private readonly listar: ListarTiposVehiculoUseCase,
    private readonly obtener: ObtenerTipoVehiculoUseCase,
    private readonly actualizar: ActualizarTipoVehiculoUseCase,
    private readonly anular: AnularTipoVehiculoUseCase,
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
    @Body() dto: RegistrarTipoVehiculoDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto) };
  }

  @Patch(':id')
  async actualizarTipo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarTipoVehiculoDto,
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
