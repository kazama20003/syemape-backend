// Uso operativo del registro (se usa / no se usa). Igual al enum Prisma
// EstadoActivo. Es independiente del borrado logico (EstadoRegistro).
export enum EstadoActivo {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

export function esEstadoActivo(valor: unknown): valor is EstadoActivo {
  return valor === EstadoActivo.ACTIVO || valor === EstadoActivo.INACTIVO;
}
