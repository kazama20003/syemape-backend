// Clase de la unidad segun porte/rol. Igual al enum Prisma ClaseUnidad.
export enum ClaseUnidad {
  LIVIANO = 'LIVIANO',
  PESADO = 'PESADO',
  REMOLQUE = 'REMOLQUE',
  SEMIRREMOLQUE = 'SEMIRREMOLQUE',
  OTRO = 'OTRO',
}

// Estado operativo del vehiculo (distinto del borrado logico). Igual al enum
// Prisma EstadoUnidad.
export enum EstadoUnidad {
  OPERATIVA = 'OPERATIVA',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
  DE_BAJA = 'DE_BAJA',
}

const CLASES = new Set<string>(Object.values(ClaseUnidad));
const ESTADOS = new Set<string>(Object.values(EstadoUnidad));

export function esClaseUnidad(valor: unknown): valor is ClaseUnidad {
  return typeof valor === 'string' && CLASES.has(valor);
}

export function esEstadoUnidad(valor: unknown): valor is EstadoUnidad {
  return typeof valor === 'string' && ESTADOS.has(valor);
}
