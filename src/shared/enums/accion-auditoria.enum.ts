// Accion registrada en el historial de auditoria. Igual al enum Prisma
// AccionAuditoria.
export enum AccionAuditoria {
  CREAR = 'CREAR',
  ACTUALIZAR = 'ACTUALIZAR',
  ANULAR = 'ANULAR',
  CAMBIAR_ESTADO = 'CAMBIAR_ESTADO',
  REACTIVAR = 'REACTIVAR',
}
