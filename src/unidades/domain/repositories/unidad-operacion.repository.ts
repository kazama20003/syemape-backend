export const UNIDAD_OPERACION_REPOSITORY = Symbol('UNIDAD_OPERACION_REPOSITORY');

export interface AsignacionGpsUnidadProps {
  id: number;
  publicId: string;
  unidadId: number;
  activoId: number;
  fechaInicio: Date;
  fechaFin: Date | null;
  observacion: string | null;
}

export interface LecturaKilometrajeUnidadProps {
  id: number;
  publicId: string;
  unidadId: number;
  valor: number;
  fecha: Date;
  fuente: string | null;
  observacion: string | null;
  registradoPor: string;
}

export interface UnidadOperacionRepository {
  listarAsignacionesGps(unidadId: number): Promise<AsignacionGpsUnidadProps[]>;
  asignarGps(data: {
    unidadId: number;
    activoId: number;
    fechaInicio: Date;
    observacion: string | null;
    actor: string;
  }): Promise<AsignacionGpsUnidadProps>;
  liberarGps(data: {
    unidadId: number;
    asignacionId: number;
    fechaFin: Date;
    observacion: string | null | undefined;
    actor: string;
  }): Promise<AsignacionGpsUnidadProps | null>;
  listarLecturas(unidadId: number): Promise<LecturaKilometrajeUnidadProps[]>;
  registrarLectura(data: {
    unidadId: number;
    valor: number;
    fecha: Date;
    fuente: string | null;
    observacion: string | null;
    actor: string;
  }): Promise<LecturaKilometrajeUnidadProps>;
}
