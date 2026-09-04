import { AccionAuditoria } from '../../../shared/enums/accion-auditoria.enum.js';

export const HISTORIAL_REPOSITORY = Symbol('HISTORIAL_REPOSITORY');

export interface HistorialEventoProps {
  id: number;
  entidad: string;
  entidadId: number;
  entidadPublicId: string | null;
  accion: AccionAuditoria;
  datos: unknown;
  usuario: string;
  fecha: Date;
}

export interface BuscarHistorialFiltros {
  entidad?: string;
  entidadId?: number;
  usuario?: string;
  accion?: AccionAuditoria;
  page: number;
  pageSize: number;
}

export interface HistorialRepository {
  buscar(
    filtros: BuscarHistorialFiltros,
  ): Promise<{ datos: HistorialEventoProps[]; total: number }>;
}
