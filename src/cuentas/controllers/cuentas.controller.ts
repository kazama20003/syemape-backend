import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ActualizarCuentaDto, ActualizarCuentaUseCase, AnularCuentaUseCase, ListarCuentasUseCase, ObtenerCuentaUseCase, RegistrarCuentaDto, RegistrarCuentaUseCase } from '../use-cases/cuenta.use-cases.js';
@Controller('cuentas') export class CuentasController {
  constructor(private readonly registrar: RegistrarCuentaUseCase, private readonly listar: ListarCuentasUseCase, private readonly obtener: ObtenerCuentaUseCase, private readonly actualizar: ActualizarCuentaUseCase, private readonly anular: AnularCuentaUseCase) {}
  @Get() listarCuentas(@Query() q: { texto?: string; estadoRegistro?: string; page?: string; pageSize?: string }) { return this.listar.execute(q); }
  @Get(':id') async obtenerCuenta(@Param('id', ParseIntPipe) id: number) { return { datos: await this.obtener.execute(id) }; }
  @Post() async registrarCuenta(@Body() dto: RegistrarCuentaDto) { return { datos: await this.registrar.execute(dto) }; }
  @Patch(':id') async actualizarCuenta(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarCuentaDto) { return { datos: await this.actualizar.execute(id, dto) }; }
  @Delete(':id') async anularCuenta(@Param('id', ParseIntPipe) id: number) { return { datos: await this.anular.execute(id) }; }
}
