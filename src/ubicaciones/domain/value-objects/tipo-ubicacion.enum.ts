// Tipo de ubicacion. Igual al enum Prisma TipoUbicacion.
export enum TipoUbicacion {
  ORIGEN = 'ORIGEN',
  DESTINO = 'DESTINO',
  BASE = 'BASE',
  PUESTO_CONTROL = 'PUESTO_CONTROL',
  SUCURSAL = 'SUCURSAL',
  GENERAL = 'GENERAL',
}

const TIPOS = new Set<string>(Object.values(TipoUbicacion));

export function esTipoUbicacion(valor: unknown): valor is TipoUbicacion {
  return typeof valor === 'string' && TIPOS.has(valor);
}
