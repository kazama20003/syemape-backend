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
  ActualizarPersonalDto,
  ActualizarPersonalUseCase,
  AnularPersonalUseCase,
  ListarPersonalUseCase,
  ObtenerPersonalUseCase,
  RegistrarPersonalDto,
  RegistrarPersonalUseCase,
} from '../use-cases/personal.use-cases.js';

// Maestro de personal: conductores y tripulacion.
@Controller('personal')
export class PersonalController {
  constructor(
    private readonly registrar: RegistrarPersonalUseCase,
    private readonly listar: ListarPersonalUseCase,
    private readonly obtener: ObtenerPersonalUseCase,
    private readonly actualizar: ActualizarPersonalUseCase,
    private readonly anular: AnularPersonalUseCase,
  ) {}

  @Get()
  async listarPersonal(
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
  async obtenerPersonal(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Post()
  async registrarPersonal(
    @Body() dto: RegistrarPersonalDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto) };
  }

  @Patch(':id')
  async actualizarPersonal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPersonalDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto) };
  }

  @Delete(':id')
  async anularPersonal(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id) };
  }
}
