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
  ActualizarRutaDto,
  ActualizarRutaUseCase,
  AnularRutaUseCase,
  ListarRutasUseCase,
  ObtenerRutaUseCase,
  RegistrarRutaDto,
  RegistrarRutaUseCase,
} from '../use-cases/ruta.use-cases.js';

// Catalogo de rutas (trayectos origen -> destino).
@Controller('rutas')
export class RutasController {
  constructor(
    private readonly registrar: RegistrarRutaUseCase,
    private readonly listar: ListarRutasUseCase,
    private readonly obtener: ObtenerRutaUseCase,
    private readonly actualizar: ActualizarRutaUseCase,
    private readonly anular: AnularRutaUseCase,
  ) {}

  @Get()
  async listarRutas(
    @Query()
    query: {
      texto?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Get(':id')
  async obtenerRuta(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Post()
  async registrarRuta(
    @Body() dto: RegistrarRutaDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto) };
  }

  @Patch(':id')
  async actualizarRuta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarRutaDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto) };
  }

  @Delete(':id')
  async anularRuta(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id) };
  }
}
