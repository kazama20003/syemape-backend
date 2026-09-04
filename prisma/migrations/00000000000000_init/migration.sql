-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "estado_registro" AS ENUM ('ACTIVO', 'ANULADO');

-- CreateEnum
CREATE TYPE "estado_activo" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "accion_auditoria" AS ENUM ('CREAR', 'ACTUALIZAR', 'ANULAR', 'CAMBIAR_ESTADO', 'REACTIVAR');

-- CreateEnum
CREATE TYPE "clase_unidad" AS ENUM ('LIVIANO', 'PESADO', 'REMOLQUE', 'SEMIRREMOLQUE', 'OTRO');

-- CreateEnum
CREATE TYPE "estado_unidad" AS ENUM ('OPERATIVA', 'EN_MANTENIMIENTO', 'DE_BAJA');

-- CreateEnum
CREATE TYPE "TipoPersonal" AS ENUM ('CONDUCTOR', 'COPILOTO', 'SUPERVISOR', 'ESCOLTA');

-- CreateEnum
CREATE TYPE "estado_manifiesto" AS ENUM ('BORRADOR', 'EMITIDO', 'EN_RUTA', 'CERRADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "tipo_ubicacion" AS ENUM ('ORIGEN', 'DESTINO', 'BASE', 'PUESTO_CONTROL', 'SUCURSAL', 'GENERAL');

-- CreateEnum
CREATE TYPE "estado_carga" AS ENUM ('VACIO', 'CARGADO');

-- CreateEnum
CREATE TYPE "nivel_combustible" AS ENUM ('FULL', 'TRES_CUARTOS', 'MEDIO', 'UN_CUARTO', 'POR_REGISTRAR');

-- CreateEnum
CREATE TYPE "viaticos" AS ENUM ('SIN_VIATICOS', 'CON_VIATICOS', 'POR_REGISTRAR');

-- CreateEnum
CREATE TYPE "unidad_medida" AS ENUM ('UNIDAD', 'KG', 'TONELADA', 'LITRO', 'CAJA', 'SACO', 'OTRO');

-- CreateEnum
CREATE TYPE "estado_seguimiento" AS ENUM ('PENDIENTE', 'EN_RUTA', 'RETRASADO', 'DETENIDO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "tipo_checkin" AS ENUM ('SALIDA', 'PUNTO_CONTROL', 'UBICACION', 'INCIDENCIA', 'CIERRE');

-- CreateEnum
CREATE TYPE "tipo_incidencia" AS ENUM ('ACCIDENTE', 'FALLA_MECANICA', 'BLOQUEO_VIA', 'EXCESO_VELOCIDAD', 'DESVIO_RUTA', 'RELEVO', 'OTRO');

-- CreateEnum
CREATE TYPE "Criticidad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "estado_incidencia" AS ENUM ('ABIERTA', 'EN_ATENCION', 'RESUELTA');

-- CreateEnum
CREATE TYPE "tipo_evidencia" AS ENUM ('FOTO', 'VIDEO', 'DOCUMENTO');

-- CreateEnum
CREATE TYPE "resultado_inspeccion" AS ENUM ('CONFORME', 'NO_CONFORME');

-- CreateEnum
CREATE TYPE "tipo_turno" AS ENUM ('TURNO', 'DESCANSO');

-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('ADMINISTRADOR', 'OPERACIONES', 'SUPERVISOR', 'CONDUCTOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "tipo_alerta" AS ENUM ('LLEGADA_TARDE', 'UNIDAD_SIN_REGISTRO', 'DOCUMENTO_POR_VENCER', 'INCIDENCIA_CRITICA', 'MANIFIESTO_SIN_CERRAR');

-- CreateTable
CREATE TABLE "cliente" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "razon_social" TEXT NOT NULL,
    "tipo_documento" TEXT NOT NULL DEFAULT 'RUC',
    "numero_documento" TEXT,
    "numero_documento_normalizado" TEXT,
    "cuenta" TEXT,
    "direccion" TEXT,
    "contacto_nombre" TEXT,
    "contacto_telefono" TEXT,
    "email" TEXT,
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicacion" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "tipo_ubicacion" NOT NULL DEFAULT 'GENERAL',
    "direccion" TEXT,
    "referencia" TEXT,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "distrito" TEXT,
    "provincia" TEXT,
    "departamento" TEXT,
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_servicio" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "tipo_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidad" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "placa" TEXT NOT NULL,
    "placa_normalizada" TEXT NOT NULL,
    "clase" "clase_unidad" NOT NULL,
    "tipo_vehiculo" TEXT,
    "categoria_vehicular" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "anio" INTEGER,
    "anio_fabricacion" INTEGER,
    "color" TEXT,
    "numero_ejes" INTEGER,
    "numero_motor" TEXT,
    "numero_vin" TEXT,
    "registro_mtc" TEXT,
    "mtc_vigencia" TIMESTAMP(3),
    "materiales_peligrosos" TEXT,
    "cuenta" TEXT,
    "cliente_asociado" TEXT,
    "capacidad_carga" DECIMAL(10,2),
    "estado_unidad" "estado_unidad" NOT NULL DEFAULT 'OPERATIVA',
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "tipo_documento" TEXT NOT NULL DEFAULT 'DNI',
    "numero_documento" TEXT NOT NULL,
    "numero_documento_normalizado" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "tipo" "TipoPersonal" NOT NULL DEFAULT 'CONDUCTOR',
    "apelativo" TEXT,
    "telefono" TEXT,
    "licencia_conducir" TEXT,
    "categoria_licencia" TEXT,
    "licencia_vencimiento" TIMESTAMP(3),
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruta" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "distancia_km" DECIMAL(10,2),
    "duracion_estimada_horas" DECIMAL(6,2),
    "descripcion" TEXT,
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "ruta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifiesto" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "estado" "estado_manifiesto" NOT NULL DEFAULT 'BORRADOR',
    "estado_seguimiento" "estado_seguimiento" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_servicio" TIMESTAMP(3) NOT NULL,
    "hora_servicio" TEXT,
    "origen" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "ubicacion_origen_id" INTEGER,
    "ubicacion_destino_id" INTEGER,
    "tipo_servicio_id" INTEGER,
    "cliente_id" INTEGER,
    "cliente_texto" TEXT,
    "estado_carga" "estado_carga",
    "combustible" "nivel_combustible" DEFAULT 'POR_REGISTRAR',
    "viaticos" "viaticos" DEFAULT 'POR_REGISTRAR',
    "unidad_id" INTEGER NOT NULL,
    "segunda_unidad_id" INTEGER,
    "segunda_placa" TEXT,
    "conductor_id" INTEGER NOT NULL,
    "ruta_id" INTEGER,
    "supervisor_id" INTEGER,
    "base" TEXT,
    "puesto_control" TEXT,
    "fecha_llegada_estimada" TIMESTAMP(3),
    "fecha_cierre" TIMESTAMP(3),
    "observaciones" TEXT,
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "manifiesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifiesto_carga" (
    "id" SERIAL NOT NULL,
    "manifiesto_id" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(12,2),
    "unidad_medida" "unidad_medida" NOT NULL DEFAULT 'UNIDAD',
    "peso_kg" DECIMAL(12,2),
    "piezas" INTEGER,
    "embalaje" TEXT,
    "valor_declarado" DECIMAL(14,2),

    CONSTRAINT "manifiesto_carga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifiesto_tripulante" (
    "id" SERIAL NOT NULL,
    "manifiesto_id" INTEGER NOT NULL,
    "personal_id" INTEGER NOT NULL,
    "rol" "TipoPersonal" NOT NULL,

    CONSTRAINT "manifiesto_tripulante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_evento" (
    "id" SERIAL NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" INTEGER NOT NULL,
    "entidad_public_id" UUID,
    "accion" "accion_auditoria" NOT NULL,
    "datos" JSONB NOT NULL,
    "usuario" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruta_punto" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "ruta_id" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion_id" INTEGER,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "hora_estimada" TEXT,
    "tolerancia_minutos" INTEGER,
    "requiere_evidencia" BOOLEAN NOT NULL DEFAULT false,
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "ruta_punto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimiento_manifiesto" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "manifiesto_id" INTEGER NOT NULL,
    "tipo" "tipo_checkin" NOT NULL,
    "ruta_punto_id" INTEGER,
    "estado" "estado_seguimiento",
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "foto_url" TEXT,
    "observacion" TEXT,
    "registrado_por" TEXT NOT NULL,

    CONSTRAINT "seguimiento_manifiesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidencia" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "manifiesto_id" INTEGER NOT NULL,
    "tipo" "tipo_incidencia" NOT NULL,
    "criticidad" "Criticidad" NOT NULL DEFAULT 'MEDIA',
    "estado" "estado_incidencia" NOT NULL DEFAULT 'ABIERTA',
    "descripcion" TEXT NOT NULL,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "responsable" TEXT,
    "acciones_tomadas" TEXT,
    "reportado_por" TEXT NOT NULL,
    "fecha_reporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "incidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencia_incidencia" (
    "id" SERIAL NOT NULL,
    "incidencia_id" INTEGER NOT NULL,
    "tipo" "tipo_evidencia" NOT NULL DEFAULT 'FOTO',
    "url" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "evidencia_incidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_unidad" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "unidad_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numero" TEXT,
    "fecha_emision" TIMESTAMP(3),
    "fecha_vencimiento" TIMESTAMP(3),
    "archivo_url" TEXT,
    "observacion" TEXT,
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "documento_unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_personal" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "personal_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "numero" TEXT,
    "fecha_emision" TIMESTAMP(3),
    "fecha_vencimiento" TIMESTAMP(3),
    "archivo_url" TEXT,
    "observacion" TEXT,
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "documento_personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspeccion_preoperacional" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "unidad_id" INTEGER NOT NULL,
    "conductor_id" INTEGER,
    "manifiesto_id" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" "resultado_inspeccion" NOT NULL DEFAULT 'CONFORME',
    "tiene_falla_critica" BOOLEAN NOT NULL DEFAULT false,
    "observacion" TEXT,
    "realizada_por" TEXT NOT NULL,
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "inspeccion_preoperacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspeccion_item" (
    "id" SERIAL NOT NULL,
    "inspeccion_id" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "conforme" BOOLEAN NOT NULL DEFAULT true,
    "critico" BOOLEAN NOT NULL DEFAULT false,
    "observacion" TEXT,

    CONSTRAINT "inspeccion_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turno_supervisor" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "supervisor_id" INTEGER NOT NULL,
    "tipo" "tipo_turno" NOT NULL DEFAULT 'TURNO',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "zona" TEXT,
    "base" TEXT,
    "observacion" TEXT,
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "turno_supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "rol_usuario" NOT NULL DEFAULT 'OPERACIONES',
    "password_hash" TEXT NOT NULL,
    "cliente_id" INTEGER,
    "personal_id" INTEGER,
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "tipo" "tipo_alerta" NOT NULL,
    "criticidad" "Criticidad" NOT NULL DEFAULT 'MEDIA',
    "mensaje" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" INTEGER NOT NULL,
    "manifiesto_id" INTEGER,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "fecha_generacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_resolucion" TIMESTAMP(3),

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_public_id_key" ON "cliente"("public_id");

-- CreateIndex
CREATE INDEX "cliente_razon_social_idx" ON "cliente"("razon_social");

-- CreateIndex
CREATE INDEX "cliente_numero_documento_normalizado_idx" ON "cliente"("numero_documento_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "ubicacion_public_id_key" ON "ubicacion"("public_id");

-- CreateIndex
CREATE INDEX "ubicacion_nombre_idx" ON "ubicacion"("nombre");

-- CreateIndex
CREATE INDEX "ubicacion_tipo_idx" ON "ubicacion"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_servicio_public_id_key" ON "tipo_servicio"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_servicio_codigo_key" ON "tipo_servicio"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "unidad_public_id_key" ON "unidad"("public_id");

-- CreateIndex
CREATE INDEX "unidad_placa_normalizada_idx" ON "unidad"("placa_normalizada");

-- CreateIndex
CREATE UNIQUE INDEX "personal_public_id_key" ON "personal"("public_id");

-- CreateIndex
CREATE INDEX "personal_numero_documento_normalizado_idx" ON "personal"("numero_documento_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "ruta_public_id_key" ON "ruta"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifiesto_public_id_key" ON "manifiesto"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifiesto_numero_key" ON "manifiesto"("numero");

-- CreateIndex
CREATE INDEX "manifiesto_unidad_id_idx" ON "manifiesto"("unidad_id");

-- CreateIndex
CREATE INDEX "manifiesto_conductor_id_idx" ON "manifiesto"("conductor_id");

-- CreateIndex
CREATE INDEX "manifiesto_cliente_id_idx" ON "manifiesto"("cliente_id");

-- CreateIndex
CREATE INDEX "manifiesto_estado_idx" ON "manifiesto"("estado");

-- CreateIndex
CREATE INDEX "manifiesto_carga_manifiesto_id_idx" ON "manifiesto_carga"("manifiesto_id");

-- CreateIndex
CREATE UNIQUE INDEX "manifiesto_tripulante_manifiesto_id_personal_id_key" ON "manifiesto_tripulante"("manifiesto_id", "personal_id");

-- CreateIndex
CREATE INDEX "historial_evento_entidad_entidad_id_idx" ON "historial_evento"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "historial_evento_fecha_idx" ON "historial_evento"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ruta_punto_public_id_key" ON "ruta_punto"("public_id");

-- CreateIndex
CREATE INDEX "ruta_punto_ruta_id_idx" ON "ruta_punto"("ruta_id");

-- CreateIndex
CREATE UNIQUE INDEX "ruta_punto_ruta_id_orden_key" ON "ruta_punto"("ruta_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "seguimiento_manifiesto_public_id_key" ON "seguimiento_manifiesto"("public_id");

-- CreateIndex
CREATE INDEX "seguimiento_manifiesto_manifiesto_id_idx" ON "seguimiento_manifiesto"("manifiesto_id");

-- CreateIndex
CREATE UNIQUE INDEX "incidencia_public_id_key" ON "incidencia"("public_id");

-- CreateIndex
CREATE INDEX "incidencia_manifiesto_id_idx" ON "incidencia"("manifiesto_id");

-- CreateIndex
CREATE INDEX "incidencia_estado_idx" ON "incidencia"("estado");

-- CreateIndex
CREATE INDEX "evidencia_incidencia_incidencia_id_idx" ON "evidencia_incidencia"("incidencia_id");

-- CreateIndex
CREATE UNIQUE INDEX "documento_unidad_public_id_key" ON "documento_unidad"("public_id");

-- CreateIndex
CREATE INDEX "documento_unidad_unidad_id_idx" ON "documento_unidad"("unidad_id");

-- CreateIndex
CREATE INDEX "documento_unidad_fecha_vencimiento_idx" ON "documento_unidad"("fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "documento_personal_public_id_key" ON "documento_personal"("public_id");

-- CreateIndex
CREATE INDEX "documento_personal_personal_id_idx" ON "documento_personal"("personal_id");

-- CreateIndex
CREATE INDEX "documento_personal_fecha_vencimiento_idx" ON "documento_personal"("fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "inspeccion_preoperacional_public_id_key" ON "inspeccion_preoperacional"("public_id");

-- CreateIndex
CREATE INDEX "inspeccion_preoperacional_unidad_id_idx" ON "inspeccion_preoperacional"("unidad_id");

-- CreateIndex
CREATE INDEX "inspeccion_item_inspeccion_id_idx" ON "inspeccion_item"("inspeccion_id");

-- CreateIndex
CREATE UNIQUE INDEX "turno_supervisor_public_id_key" ON "turno_supervisor"("public_id");

-- CreateIndex
CREATE INDEX "turno_supervisor_supervisor_id_idx" ON "turno_supervisor"("supervisor_id");

-- CreateIndex
CREATE INDEX "turno_supervisor_fecha_inicio_idx" ON "turno_supervisor"("fecha_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_public_id_key" ON "usuario"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_personal_id_key" ON "usuario"("personal_id");

-- CreateIndex
CREATE INDEX "usuario_rol_idx" ON "usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "alerta_public_id_key" ON "alerta"("public_id");

-- CreateIndex
CREATE INDEX "alerta_resuelta_idx" ON "alerta"("resuelta");

-- CreateIndex
CREATE INDEX "alerta_tipo_idx" ON "alerta"("tipo");

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_segunda_unidad_id_fkey" FOREIGN KEY ("segunda_unidad_id") REFERENCES "unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "personal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_tipo_servicio_id_fkey" FOREIGN KEY ("tipo_servicio_id") REFERENCES "tipo_servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_ruta_id_fkey" FOREIGN KEY ("ruta_id") REFERENCES "ruta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_ubicacion_origen_id_fkey" FOREIGN KEY ("ubicacion_origen_id") REFERENCES "ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_ubicacion_destino_id_fkey" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto_carga" ADD CONSTRAINT "manifiesto_carga_manifiesto_id_fkey" FOREIGN KEY ("manifiesto_id") REFERENCES "manifiesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto_tripulante" ADD CONSTRAINT "manifiesto_tripulante_manifiesto_id_fkey" FOREIGN KEY ("manifiesto_id") REFERENCES "manifiesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifiesto_tripulante" ADD CONSTRAINT "manifiesto_tripulante_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_punto" ADD CONSTRAINT "ruta_punto_ruta_id_fkey" FOREIGN KEY ("ruta_id") REFERENCES "ruta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_punto" ADD CONSTRAINT "ruta_punto_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_manifiesto" ADD CONSTRAINT "seguimiento_manifiesto_manifiesto_id_fkey" FOREIGN KEY ("manifiesto_id") REFERENCES "manifiesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento_manifiesto" ADD CONSTRAINT "seguimiento_manifiesto_ruta_punto_id_fkey" FOREIGN KEY ("ruta_punto_id") REFERENCES "ruta_punto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencia" ADD CONSTRAINT "incidencia_manifiesto_id_fkey" FOREIGN KEY ("manifiesto_id") REFERENCES "manifiesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencia_incidencia" ADD CONSTRAINT "evidencia_incidencia_incidencia_id_fkey" FOREIGN KEY ("incidencia_id") REFERENCES "incidencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_unidad" ADD CONSTRAINT "documento_unidad_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_personal" ADD CONSTRAINT "documento_personal_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "personal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_preoperacional" ADD CONSTRAINT "inspeccion_preoperacional_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_preoperacional" ADD CONSTRAINT "inspeccion_preoperacional_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "personal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_preoperacional" ADD CONSTRAINT "inspeccion_preoperacional_manifiesto_id_fkey" FOREIGN KEY ("manifiesto_id") REFERENCES "manifiesto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspeccion_item" ADD CONSTRAINT "inspeccion_item_inspeccion_id_fkey" FOREIGN KEY ("inspeccion_id") REFERENCES "inspeccion_preoperacional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno_supervisor" ADD CONSTRAINT "turno_supervisor_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "personal"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Unicidad de negocio: placa/documento unicos SOLO entre registros activos.
CREATE UNIQUE INDEX "unidad_placa_normalizada_activa_key" ON "unidad" ("placa_normalizada") WHERE "estado_registro" = 'ACTIVO';
CREATE UNIQUE INDEX "personal_documento_normalizado_activo_key" ON "personal" ("numero_documento_normalizado") WHERE "estado_registro" = 'ACTIVO';
