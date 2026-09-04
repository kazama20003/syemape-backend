// Enums del manifiesto que reflejan los del schema Prisma.

export enum EstadoCarga {
  VACIO = 'VACIO',
  CARGADO = 'CARGADO',
}

export enum NivelCombustible {
  FULL = 'FULL',
  TRES_CUARTOS = 'TRES_CUARTOS',
  MEDIO = 'MEDIO',
  UN_CUARTO = 'UN_CUARTO',
  POR_REGISTRAR = 'POR_REGISTRAR',
}

export enum Viaticos {
  SIN_VIATICOS = 'SIN_VIATICOS',
  CON_VIATICOS = 'CON_VIATICOS',
  POR_REGISTRAR = 'POR_REGISTRAR',
}

export enum UnidadMedida {
  UNIDAD = 'UNIDAD',
  KG = 'KG',
  TONELADA = 'TONELADA',
  LITRO = 'LITRO',
  CAJA = 'CAJA',
  SACO = 'SACO',
  OTRO = 'OTRO',
}

export function esEstadoCarga(v: unknown): v is EstadoCarga {
  return typeof v === 'string' && (Object.values(EstadoCarga) as string[]).includes(v);
}
export function esNivelCombustible(v: unknown): v is NivelCombustible {
  return (
    typeof v === 'string' &&
    (Object.values(NivelCombustible) as string[]).includes(v)
  );
}
export function esViaticos(v: unknown): v is Viaticos {
  return typeof v === 'string' && (Object.values(Viaticos) as string[]).includes(v);
}
export function esUnidadMedida(v: unknown): v is UnidadMedida {
  return typeof v === 'string' && (Object.values(UnidadMedida) as string[]).includes(v);
}
