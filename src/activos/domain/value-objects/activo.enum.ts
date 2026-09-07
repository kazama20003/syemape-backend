// Enums de dominio equivalentes a los enums Prisma del maestro de activos.
export enum TipoActivo {
  UNIDAD = 'UNIDAD',
  EQUIPO = 'EQUIPO',
  HERRAMIENTA = 'HERRAMIENTA',
  INFRAESTRUCTURA = 'INFRAESTRUCTURA',
  OTRO = 'OTRO',
}

export enum EstadoOperativoActivo {
  OPERATIVO = 'OPERATIVO',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
  FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO',
  DE_BAJA = 'DE_BAJA',
}

const TIPOS = new Set<string>(Object.values(TipoActivo));
const ESTADOS_OPERATIVOS = new Set<string>(
  Object.values(EstadoOperativoActivo),
);

export function esTipoActivo(valor: unknown): valor is TipoActivo {
  return typeof valor === 'string' && TIPOS.has(valor);
}

export function esEstadoOperativoActivo(
  valor: unknown,
): valor is EstadoOperativoActivo {
  return typeof valor === 'string' && ESTADOS_OPERATIVOS.has(valor);
}
