import { EstadoActivo } from '../../../shared/enums/estado-activo.enum.js';
import { EstadoRegistro } from '../../../shared/enums/estado-registro.enum.js';
import { CuentaProps } from '../../../cuentas/domain/repositories/cuenta.repository.js';
export const PROYECTO_REPOSITORY = Symbol('PROYECTO_REPOSITORY');
export interface ProyectoProps { id: number; publicId: string; cuentaId: number; codigo: string; nombre: string; descripcion: string | null; estadoActivo: EstadoActivo; estadoRegistro: EstadoRegistro; cuenta: Pick<CuentaProps, 'id' | 'codigo' | 'nombre'>; }
export interface CrearProyectoData { cuentaId: number; codigo: string; nombre: string; descripcion: string | null; usuarioCreacion: string; }
export interface ProyectoRepository { findById(id: number): Promise<ProyectoProps | null>; findByCuentaYCodigo(cuentaId: number, codigo: string): Promise<ProyectoProps | null>; crear(data: CrearProyectoData): Promise<ProyectoProps>; actualizar(id: number, data: Partial<Pick<ProyectoProps, 'nombre' | 'descripcion' | 'estadoActivo'>> & { usuarioModificacion: string }): Promise<ProyectoProps>; anular(id: number, actor: string): Promise<ProyectoProps>; buscar(filtros: { cuentaId?: number; texto?: string; estadoRegistro?: EstadoRegistro; page: number; pageSize: number }): Promise<{ datos: ProyectoProps[]; total: number }>; }
