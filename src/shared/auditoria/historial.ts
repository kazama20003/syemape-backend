import { PrismaService } from '../prisma/prisma.service.js';
import { AccionAuditoria } from '../enums/accion-auditoria.enum.js';

export interface EventoAuditoria {
  entidad: string;
  entidadId: number;
  entidadPublicId?: string | null;
  accion: AccionAuditoria;
  usuario: string;
  // Snapshot del estado de la entidad tras la accion (se guarda como JSON).
  datos: unknown;
}

// Convierte a JSON plano: Decimals (toJSON) y Dates (toISOString) quedan como
// valores serializables antes de escribir en la columna Json.
function aJsonPlano(valor: unknown): unknown {
  return JSON.parse(JSON.stringify(valor ?? {}));
}

// Registra un evento en el historial de auditoria. No lanza: la auditoria no
// debe tumbar la operacion de negocio que la origina.
export async function registrarHistorial(
  prisma: PrismaService,
  evento: EventoAuditoria,
): Promise<void> {
  try {
    await prisma.historialEvento.create({
      data: {
        entidad: evento.entidad,
        entidadId: evento.entidadId,
        entidadPublicId: evento.entidadPublicId ?? null,
        accion: evento.accion,
        usuario: evento.usuario,
        datos: aJsonPlano(evento.datos) as object,
      },
    });
  } catch {
    // Silencioso a proposito: ver comentario de la funcion.
  }
}
