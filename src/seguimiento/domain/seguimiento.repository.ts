import { EstadoManifiesto } from '../../manifiestos/domain/value-objects/estado-manifiesto.enum.js';

export const SEGUIMIENTO_REPOSITORY = Symbol('SEGUIMIENTO_REPOSITORY');

export enum TipoCheckin {
  SALIDA = 'SALIDA',
  PUNTO_CONTROL = 'PUNTO_CONTROL',
  UBICACION = 'UBICACION',
  INCIDENCIA = 'INCIDENCIA',
  CIERRE = 'CIERRE',
}

export enum EstadoSeguimiento {
  PENDIENTE = 'PENDIENTE',
  EN_RUTA = 'EN_RUTA',
  RETRASADO = 'RETRASADO',
  DETENIDO = 'DETENIDO',
  FINALIZADO = 'FINALIZADO',
}

export function esTipoCheckin(v: unknown): v is TipoCheckin {
  return typeof v === 'string' && (Object.values(TipoCheckin) as string[]).includes(v);
}
export function esEstadoSeguimiento(v: unknown): v is EstadoSeguimiento {
  return (
    typeof v === 'string' &&
    (Object.values(EstadoSeguimiento) as string[]).includes(v)
  );
}

export interface SeguimientoProps {
  id: number;
  publicId: string;
  manifiestoId: number;
  tipo: TipoCheckin;
  rutaPuntoId: number | null;
  estado: EstadoSeguimiento | null;
  fecha: Date;
  latitud: number | null;
  longitud: number | null;
  fotoUrl: string | null;
  observacion: string | null;
  registradoPor: string;
}

export interface CrearSeguimientoData {
  manifiestoId: number;
  tipo: TipoCheckin;
  rutaPuntoId: number | null;
  estado: EstadoSeguimiento | null;
  latitud: number | null;
  longitud: number | null;
  fotoUrl: string | null;
  observacion: string | null;
  registradoPor: string;
}

export interface ManifiestoResumenSeguimiento {
  id: number;
  publicId: string;
  estado: EstadoManifiesto;
}

export interface SeguimientoRepository {
  manifiestoActivo(id: number): Promise<ManifiestoResumenSeguimiento | null>;
  crear(data: CrearSeguimientoData): Promise<SeguimientoProps>;
  // Actualiza el estado operativo de seguimiento del manifiesto.
  actualizarEstadoManifiesto(
    manifiestoId: number,
    estado: EstadoSeguimiento,
  ): Promise<void>;
  listarPorManifiesto(manifiestoId: number): Promise<SeguimientoProps[]>;
}
