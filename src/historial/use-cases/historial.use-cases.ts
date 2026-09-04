import { Inject, Injectable } from '@nestjs/common';
import {
  construirPaginacion,
  type RespuestaPaginadaDto,
} from '../../shared/dto/respuesta.dto.js';
import { aEnteroPositivo, aTextoOpcional } from '../../shared/dto/parseo.js';
import { AccionAuditoria } from '../../shared/enums/accion-auditoria.enum.js';
import {
  HISTORIAL_REPOSITORY,
  type HistorialEventoProps,
  type HistorialRepository,
} from '../domain/repositories/historial.repository.js';

const PAGE_SIZE_POR_DEFECTO = 50;
const PAGE_SIZE_MAXIMO = 200;

function esAccion(valor: unknown): valor is AccionAuditoria {
  return (
    typeof valor === 'string' &&
    (Object.values(AccionAuditoria) as string[]).includes(valor)
  );
}

@Injectable()
export class ListarHistorialUseCase {
  constructor(
    @Inject(HISTORIAL_REPOSITORY)
    private readonly historial: HistorialRepository,
  ) {}

  async execute(query: {
    entidad?: string;
    entidadId?: string | number;
    usuario?: string;
    accion?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<RespuestaPaginadaDto<HistorialEventoProps>> {
    const page = aEnteroPositivo(query.page, 1);
    const pageSize = Math.min(
      PAGE_SIZE_MAXIMO,
      aEnteroPositivo(query.pageSize, PAGE_SIZE_POR_DEFECTO),
    );
    const entidadId = query.entidadId
      ? aEnteroPositivo(query.entidadId, 0) || undefined
      : undefined;

    const { datos, total } = await this.historial.buscar({
      entidad: aTextoOpcional(query.entidad) ?? undefined,
      entidadId,
      usuario: aTextoOpcional(query.usuario) ?? undefined,
      accion: esAccion(query.accion) ? query.accion : undefined,
      page,
      pageSize,
    });

    return { datos, paginacion: construirPaginacion(page, pageSize, total) };
  }
}
