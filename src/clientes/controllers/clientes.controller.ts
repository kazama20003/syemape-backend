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
  ActualizarClienteDto,
  ActualizarClienteUseCase,
  AnularClienteUseCase,
  ListarClientesUseCase,
  ObtenerClienteUseCase,
  RegistrarClienteDto,
  RegistrarClienteUseCase,
} from '../use-cases/cliente.use-cases.js';

// Catalogo de clientes.
@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly registrar: RegistrarClienteUseCase,
    private readonly listar: ListarClientesUseCase,
    private readonly obtener: ObtenerClienteUseCase,
    private readonly actualizar: ActualizarClienteUseCase,
    private readonly anular: AnularClienteUseCase,
  ) {}

  @Get()
  async listarClientes(
    @Query()
    query: { texto?: string; estadoRegistro?: string; page?: string; pageSize?: string },
  ) {
    return this.listar.execute(query);
  }

  @Get(':id')
  async obtenerCliente(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.obtener.execute(id) };
  }

  @Post()
  async registrarCliente(
    @Body() dto: RegistrarClienteDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.registrar.execute(dto) };
  }

  @Patch(':id')
  async actualizarCliente(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarClienteDto,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.actualizar.execute(id, dto) };
  }

  @Delete(':id')
  async anularCliente(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RespuestaDto<unknown>> {
    return { datos: await this.anular.execute(id) };
  }
}
