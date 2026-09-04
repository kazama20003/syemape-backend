import { EstadoRegistro } from '../../shared/enums/estado-registro.enum.js';

export const INCIDENCIA_REPOSITORY = Symbol('INCIDENCIA_REPOSITORY');

export enum TipoIncidencia {
  ACCIDENTE = 'ACCIDENTE',
  FALLA_MECANICA = 'FALLA_MECANICA',
  BLOQUEO_VIA = 'BLOQUEO_VIA',
  EXCESO_VELOCIDAD = 'EXCESO_VELOCIDAD',
  DESVIO_RUTA = 'DESVIO_RUTA',
  RELEVO = 'RELEVO',
  OTRO = 'OTRO',
}
export enum Criticidad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}
export enum EstadoIncidencia {
  ABIERTA = 'ABIERTA',
  EN_ATENCION = 'EN_ATENCION',
  RESUELTA = 'RESUELTA',
}
export enum TipoEvidencia {
  FOTO = 'FOTO',
  VIDEO = 'VIDEO',
  DOCUMENTO = 'DOCUMENTO',
}
export const esTipoIncidencia = (v: unknown): v is TipoIncidencia =>
  typeof v === 'string' && (Object.values(TipoIncidencia) as string[]).includes(v);
export const esCriticidad = (v: unknown): v is Criticidad =>
  typeof v === 'string' && (Object.values(Criticidad) as string[]).includes(v);
export const esEstadoIncidencia = (v: unknown): v is EstadoIncidencia =>
  typeof v === 'string' && (Object.values(EstadoIncidencia) as string[]).includes(v);
export const esTipoEvidencia = (v: unknown): v is TipoEvidencia =>
  typeof v === 'string' && (Object.values(TipoEvidencia) as string[]).includes(v);

export interface EvidenciaProps {
  id: number;
  tipo: TipoEvidencia;
  url: string;
  descripcion: string | null;
}

export interface IncidenciaProps {
  id: number;
  publicId: string;
  manifiestoId: number;
  tipo: TipoIncidencia;
  criticidad: Criticidad;
  estado: EstadoIncidencia;
  descripcion: string;
  latitud: number | null;
  longitud: number | null;
  responsable: string | null;
  accionesTomadas: string | null;
  reportadoPor: string;
  fechaReporte: Date;
  fechaResolucion: Date | null;
  evidencias: EvidenciaProps[];
  estadoRegistro: EstadoRegistro;
}

export interface CrearIncidenciaData {
  manifiestoId: number;
  tipo: TipoIncidencia;
  criticidad: Criticidad;
  descripcion: string;
  latitud: number | null;
  longitud: number | null;
  responsable: string | null;
  reportadoPor: string;
  evidencias: { tipo: TipoEvidencia; url: string; descripcion: string | null }[];
  usuarioCreacion: string;
}

export interface ActualizarIncidenciaData {
  criticidad?: Criticidad;
  estado?: EstadoIncidencia;
  descripcion?: string;
  responsable?: string | null;
  accionesTomadas?: string | null;
  fechaResolucion?: Date | null;
  usuarioModificacion: string;
}

export interface BuscarIncidenciasFiltros {
  manifiestoId?: number;
  tipo?: TipoIncidencia;
  criticidad?: Criticidad;
  estado?: EstadoIncidencia;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface IncidenciaRepository {
  manifiestoActivo(id: number): Promise<{ id: number } | null>;
  findById(id: number): Promise<IncidenciaProps | null>;
  crear(data: CrearIncidenciaData): Promise<IncidenciaProps>;
  actualizar(id: number, data: ActualizarIncidenciaData): Promise<IncidenciaProps>;
  agregarEvidencia(
    incidenciaId: number,
    data: { tipo: TipoEvidencia; url: string; descripcion: string | null },
  ): Promise<IncidenciaProps>;
  buscar(
    filtros: BuscarIncidenciasFiltros,
  ): Promise<{ datos: IncidenciaProps[]; total: number }>;
}
