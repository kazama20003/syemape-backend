import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';
import { ClaseUnidad, EstadoUnidad } from '../value-objects/clase-unidad.enum.js';

export const UNIDAD_REPOSITORY = Symbol('UNIDAD_REPOSITORY');

// Vista de dominio de la unidad. El id local nunca cambia; la placa (su forma
// normalizada) es la identidad de negocio, unica entre unidades activas.
export interface UnidadProps {
  id: number;
  publicId: string;
  placa: string;
  clase: ClaseUnidad;
  tipoVehiculo: string | null;
  categoriaVehicular: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  anioFabricacion: number | null;
  color: string | null;
  numeroEjes: number | null;
  numeroMotor: string | null;
  numeroVin: string | null;
  registroMtc: string | null;
  mtcVigencia: Date | null;
  materialesPeligrosos: string | null;
  cuenta: string | null;
  clienteAsociado: string | null;
  capacidadCarga: number | null;
  pesoBrutoVehicular: number | null;
  tara: number | null;
  capacidadPasajeros: number | null;
  volumenCarga: number | null;
  tipoCarroceria: string | null;
  numeroSerieCarroceria: string | null;
  tipoCombustible: string | null;
  kilometraje: number | null;
  ultimoMantenimientoFecha: Date | null;
  ultimoMantenimientoKilometraje: number | null;
  proximoMantenimientoFecha: Date | null;
  proximoMantenimientoKilometraje: number | null;
  mantenimientoObservacion: string | null;
  fotos: string[];
  estadoUnidad: EstadoUnidad;
  estadoActivo: EstadoActivo;
  estadoRegistro: EstadoRegistro;
}

export interface CrearUnidadData {
  placa: string;
  placaNormalizada: string;
  clase: ClaseUnidad;
  tipoVehiculo: string | null;
  categoriaVehicular: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  anioFabricacion: number | null;
  color: string | null;
  numeroEjes: number | null;
  numeroMotor: string | null;
  numeroVin: string | null;
  registroMtc: string | null;
  mtcVigencia: Date | null;
  materialesPeligrosos: string | null;
  cuenta: string | null;
  clienteAsociado: string | null;
  capacidadCarga: number | null;
  pesoBrutoVehicular: number | null;
  tara: number | null;
  capacidadPasajeros: number | null;
  volumenCarga: number | null;
  tipoCarroceria: string | null;
  numeroSerieCarroceria: string | null;
  tipoCombustible: string | null;
  kilometraje: number | null;
  ultimoMantenimientoFecha: Date | null;
  ultimoMantenimientoKilometraje: number | null;
  proximoMantenimientoFecha: Date | null;
  proximoMantenimientoKilometraje: number | null;
  mantenimientoObservacion: string | null;
  fotos: string[];
  estadoUnidad: EstadoUnidad;
  usuarioCreacion: string;
}

export interface ActualizarUnidadData {
  placa?: string;
  placaNormalizada?: string;
  clase?: ClaseUnidad;
  tipoVehiculo?: string | null;
  categoriaVehicular?: string | null;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  anioFabricacion?: number | null;
  color?: string | null;
  numeroEjes?: number | null;
  numeroMotor?: string | null;
  numeroVin?: string | null;
  registroMtc?: string | null;
  mtcVigencia?: Date | null;
  materialesPeligrosos?: string | null;
  cuenta?: string | null;
  clienteAsociado?: string | null;
  capacidadCarga?: number | null;
  pesoBrutoVehicular?: number | null;
  tara?: number | null;
  capacidadPasajeros?: number | null;
  volumenCarga?: number | null;
  tipoCarroceria?: string | null;
  numeroSerieCarroceria?: string | null;
  tipoCombustible?: string | null;
  ultimoMantenimientoFecha?: Date | null;
  ultimoMantenimientoKilometraje?: number | null;
  proximoMantenimientoFecha?: Date | null;
  proximoMantenimientoKilometraje?: number | null;
  mantenimientoObservacion?: string | null;
  fotos?: string[];
  estadoUnidad?: EstadoUnidad;
  estadoActivo?: EstadoActivo;
  usuarioModificacion: string;
}

export interface BuscarUnidadesFiltros {
  placa?: string;
  clase?: ClaseUnidad;
  estadoUnidad?: EstadoUnidad;
  estadoRegistro?: EstadoRegistro;
  page: number;
  pageSize: number;
}

export interface UnidadRepository {
  findById(id: number): Promise<UnidadProps | null>;
  findByPublicId(publicId: string): Promise<UnidadProps | null>;
  findByPlacaActiva(placaNormalizada: string): Promise<UnidadProps | null>;
  crear(data: CrearUnidadData): Promise<UnidadProps>;
  actualizar(id: number, data: ActualizarUnidadData): Promise<UnidadProps>;
  anular(id: number, usuarioModificacion: string): Promise<UnidadProps>;
  buscar(
    filtros: BuscarUnidadesFiltros,
  ): Promise<{ datos: UnidadProps[]; total: number }>;
}
