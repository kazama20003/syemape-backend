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
  ActualizarUnidadDto,
  ActualizarUnidadUseCase,
  AnularUnidadUseCase,
  ListarUnidadesUseCase,
  ObtenerUnidadUseCase,
  RegistrarUnidadDto,
  RegistrarUnidadUseCase,
} from '../use-cases/unidad.use-cases.js';

// Maestro de unidades (vehiculos) de la flota.
@Controller('unidades')
export class UnidadesController {
  constructor(
    private readonly registrar: RegistrarUnidadUseCase,
    private readonly listar: ListarUnidadesUseCase,
    private readonly obtener: ObtenerUnidadUseCase,
    private readonly actualizar: ActualizarUnidadUseCase,
    private readonly anular: AnularUnidadUseCase,
  ) {}

  @Get()
  async listarUnidades(
    @Query()
    query: {
      placa?: string;
      clase?: string;
      estadoUnidad?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Get(':id')
  async obtenerUnidad(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Post()
  async registrarUnidad(
    @Body() dto: RegistrarUnidadDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto) };
  }

  @Patch(':id')
  async actualizarUnidad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUnidadDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto) };
  }

  @Delete(':id')
  async anularUnidad(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id) };
  }
}
