import { Controller, Get, Query } from '@nestjs/common';
import { ListarHistorialUseCase } from '../use-cases/historial.use-cases.js';

// Consulta del historial de auditoria. Solo lectura: los eventos los escriben
// los repositorios al mutar cada entidad.
@Controller('historial')
export class HistorialController {
  constructor(private readonly listar: ListarHistorialUseCase) {}

  @Get()
  async listarHistorial(
    @Query()
    query: {
      entidad?: string;
      entidadId?: string;
      usuario?: string;
      accion?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return this.listar.execute(query);
  }
}
