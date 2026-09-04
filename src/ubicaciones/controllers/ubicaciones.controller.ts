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
  ActualizarUbicacionDto,
  ActualizarUbicacionUseCase,
  AnularUbicacionUseCase,
  ListarUbicacionesUseCase,
  ObtenerUbicacionUseCase,
  RegistrarUbicacionDto,
  RegistrarUbicacionUseCase,
} from '../use-cases/ubicacion.use-cases.js';

// Catalogo de ubicaciones geograficas (con coordenadas).
@Controller('ubicaciones')
export class UbicacionesController {
  constructor(
    private readonly registrar: RegistrarUbicacionUseCase,
    private readonly listar: ListarUbicacionesUseCase,
    private readonly obtener: ObtenerUbicacionUseCase,
    private readonly actualizar: ActualizarUbicacionUseCase,
    private readonly anular: AnularUbicacionUseCase,
  ) {}

  @Get()
  async listarUbicaciones(
    @Query()
    query: {
      texto?: string;
      tipo?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Get(':id')
  async obtenerUbicacion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Post()
  async registrarUbicacion(
    @Body() dto: RegistrarUbicacionDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto) };
  }

  @Patch(':id')
  async actualizarUbicacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarUbicacionDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto) };
  }

  @Delete(':id')
  async anularUbicacion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id) };
  }
}
