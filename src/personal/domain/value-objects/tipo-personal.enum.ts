// Rol del personal en una operacion. Igual al enum Prisma TipoPersonal.
export enum TipoPersonal {
  CONDUCTOR = 'CONDUCTOR',
  COPILOTO = 'COPILOTO',
  SUPERVISOR = 'SUPERVISOR',
  ESCOLTA = 'ESCOLTA',
}

const TIPOS = new Set<string>(Object.values(TipoPersonal));

export function esTipoPersonal(valor: unknown): valor is TipoPersonal {
  return typeof valor === 'string' && TIPOS.has(valor);
}
