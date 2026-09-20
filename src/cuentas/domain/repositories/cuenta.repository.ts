import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';
import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';

export const CUENTA_REPOSITORY = Symbol('CUENTA_REPOSITORY');
export interface CuentaProps { id: number; publicId: string; codigo: string; nombre: string; descripcion: string | null; estadoActivo: EstadoActivo; estadoRegistro: EstadoRegistro; }
export interface CrearCuentaData { codigo: string; nombre: string; descripcion: string | null; usuarioCreacion: string; }
export interface CuentaRepository {
  findById(id: number): Promise<CuentaProps | null>;
  findByCodigo(codigo: string): Promise<CuentaProps | null>;
  crear(data: CrearCuentaData): Promise<CuentaProps>;
  actualizar(id: number, data: Partial<Pick<CuentaProps, 'nombre' | 'descripcion' | 'estadoActivo'>> & { usuarioModificacion: string }): Promise<CuentaProps>;
  anular(id: number, actor: string): Promise<CuentaProps>;
  buscar(filtros: { texto?: string; estadoRegistro?: EstadoRegistro; page: number; pageSize: number }): Promise<{ datos: CuentaProps[]; total: number }>;
}
