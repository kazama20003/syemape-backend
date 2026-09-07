-- CreateEnum
CREATE TYPE "tipo_activo" AS ENUM ('UNIDAD', 'EQUIPO', 'HERRAMIENTA', 'INFRAESTRUCTURA', 'OTRO');

-- CreateEnum
CREATE TYPE "estado_operativo_activo" AS ENUM ('OPERATIVO', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO', 'DE_BAJA');

-- CreateTable
CREATE TABLE "activo" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "tipo_activo" NOT NULL,
    "descripcion" TEXT,
    "estado_operativo" "estado_operativo_activo" NOT NULL DEFAULT 'OPERATIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "activo_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "unidad" ADD COLUMN "activo_id" INTEGER;

-- Backfill each existing unit as its corporate asset. The MD5-derived UUID is
-- deterministic so reruns preserve the same external identity.
INSERT INTO "activo" (
    "public_id", "codigo", "nombre", "tipo", "estado_operativo",
    "estado_registro", "fecha_creacion", "usuario_creacion",
    "fecha_modificacion", "usuario_modificacion"
)
SELECT
    (substr(md5('activo-unidad:' || u."id"::text), 1, 8) || '-' ||
     substr(md5('activo-unidad:' || u."id"::text), 9, 4) || '-' ||
     substr(md5('activo-unidad:' || u."id"::text), 13, 4) || '-' ||
     substr(md5('activo-unidad:' || u."id"::text), 17, 4) || '-' ||
     substr(md5('activo-unidad:' || u."id"::text), 21, 12))::uuid,
    'UNIDAD-' || u."placa_normalizada",
    'Unidad ' || u."placa",
    'UNIDAD',
    CASE u."estado_unidad"
      WHEN 'OPERATIVA' THEN 'OPERATIVO'::"estado_operativo_activo"
      WHEN 'EN_MANTENIMIENTO' THEN 'EN_MANTENIMIENTO'::"estado_operativo_activo"
      WHEN 'DE_BAJA' THEN 'DE_BAJA'::"estado_operativo_activo"
    END,
    u."estado_registro", u."fecha_creacion", u."usuario_creacion",
    u."fecha_modificacion", u."usuario_modificacion"
FROM "unidad" u;

UPDATE "unidad" u
SET "activo_id" = a."id"
FROM "activo" a
WHERE a."codigo" = 'UNIDAD-' || u."placa_normalizada";

-- AlterTable
ALTER TABLE "unidad" ALTER COLUMN "activo_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "activo_public_id_key" ON "activo"("public_id");
CREATE UNIQUE INDEX "activo_codigo_key" ON "activo"("codigo");
CREATE INDEX "activo_nombre_idx" ON "activo"("nombre");
CREATE INDEX "activo_tipo_idx" ON "activo"("tipo");
CREATE INDEX "activo_estado_operativo_idx" ON "activo"("estado_operativo");
CREATE UNIQUE INDEX "unidad_activo_id_key" ON "unidad"("activo_id");

-- AddForeignKey
ALTER TABLE "unidad" ADD CONSTRAINT "unidad_activo_id_fkey" FOREIGN KEY ("activo_id") REFERENCES "activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
