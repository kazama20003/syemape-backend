// Ciclo de vida del manifiesto. Igual al enum Prisma EstadoManifiesto.
export enum EstadoManifiesto {
  BORRADOR = 'BORRADOR',
  EMITIDO = 'EMITIDO',
  EN_RUTA = 'EN_RUTA',
  CERRADO = 'CERRADO',
  ANULADO = 'ANULADO',
}

// Transiciones permitidas del manifiesto. Un manifiesto CERRADO o ANULADO es
// terminal: no admite mas cambios de estado.
const TRANSICIONES: Record<EstadoManifiesto, EstadoManifiesto[]> = {
  [EstadoManifiesto.BORRADOR]: [EstadoManifiesto.EMITIDO, EstadoManifiesto.ANULADO],
  [EstadoManifiesto.EMITIDO]: [EstadoManifiesto.EN_RUTA, EstadoManifiesto.ANULADO],
  [EstadoManifiesto.EN_RUTA]: [EstadoManifiesto.CERRADO, EstadoManifiesto.ANULADO],
  [EstadoManifiesto.CERRADO]: [],
  [EstadoManifiesto.ANULADO]: [],
};

export function esEstadoManifiesto(valor: unknown): valor is EstadoManifiesto {
  return (
    typeof valor === 'string' &&
    (Object.values(EstadoManifiesto) as string[]).includes(valor)
  );
}

export function puedeTransicionar(
  desde: EstadoManifiesto,
  hacia: EstadoManifiesto,
): boolean {
  return TRANSICIONES[desde].includes(hacia);
}
