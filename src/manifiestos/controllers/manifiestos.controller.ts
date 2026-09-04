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
  AnularManifiestoUseCase,
  CambiarEstadoManifiestoDto,
  CambiarEstadoManifiestoUseCase,
  ListarManifiestosUseCase,
  ObtenerManifiestoUseCase,
  RegistrarManifiestoDto,
  RegistrarManifiestoUseCase,
} from '../use-cases/manifiesto.use-cases.js';

// Manifiestos de viaje: agregan unidad, conductor, supervisor, cliente, ruta,
// ubicaciones, tipo de servicio y las lineas de carga.
@Controller('manifiestos')
export class ManifiestosController {
  constructor(
    private readonly registrar: RegistrarManifiestoUseCase,
    private readonly listar: ListarManifiestosUseCase,
    private readonly obtener: ObtenerManifiestoUseCase,
    private readonly cambiarEstado: CambiarEstadoManifiestoUseCase,
    private readonly anular: AnularManifiestoUseCase,
  ) {}

  @Get()
  async listarManifiestos(
    @Query()
    query: {
      numero?: string;
      estado?: string;
      unidadId?: string;
      conductorId?: string;
      clienteId?: string;
      rutaId?: string;
      estadoRegistro?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }

  @Get(':id')
  async obtenerManifiesto(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Post()
  async registrarManifiesto(
    @Body() dto: RegistrarManifiestoDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto) };
  }

  @Patch(':id/estado')
  async cambiarEstadoManifiesto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoManifiestoDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.cambiarEstado.execute(id, dto) };
  }

  @Delete(':id')
  async anularManifiesto(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id) };
  }
}
