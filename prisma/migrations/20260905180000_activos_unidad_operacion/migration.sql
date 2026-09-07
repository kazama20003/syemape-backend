-- AlterTable
ALTER TABLE "activo"
  ADD COLUMN "fecha_adquisicion" TIMESTAMP(3),
  ADD COLUMN "valor_adquisicion" DECIMAL(12,2),
  ADD COLUMN "vida_util_meses" INTEGER,
  ADD COLUMN "proveedor" TEXT,
  ADD COLUMN "numero_serie" TEXT,
  ADD COLUMN "responsable_id" INTEGER,
  ADD COLUMN "ubicacion_habitual_id" INTEGER;

-- AlterTable
ALTER TABLE "unidad"
  ADD COLUMN "peso_bruto_vehicular" DECIMAL(10,2),
  ADD COLUMN "tara" DECIMAL(10,2),
  ADD COLUMN "capacidad_pasajeros" INTEGER,
  ADD COLUMN "volumen_carga" DECIMAL(10,2),
  ADD COLUMN "tipo_carroceria" TEXT,
  ADD COLUMN "numero_serie_carroceria" TEXT,
  ADD COLUMN "ultimo_mantenimiento_fecha" TIMESTAMP(3),
  ADD COLUMN "ultimo_mantenimiento_kilometraje" INTEGER,
  ADD COLUMN "proximo_mantenimiento_fecha" TIMESTAMP(3),
  ADD COLUMN "proximo_mantenimiento_kilometraje" INTEGER,
  ADD COLUMN "mantenimiento_observacion" TEXT;

-- CreateTable
CREATE TABLE "asignacion_gps_unidad" (
  "id" SERIAL NOT NULL,
  "public_id" UUID NOT NULL,
  "unidad_id" INTEGER NOT NULL,
  "activo_id" INTEGER NOT NULL,
  "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_fin" TIMESTAMP(3),
  "observacion" TEXT,
  "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
  "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usuario_creacion" TEXT NOT NULL,
  "fecha_modificacion" TIMESTAMP(3),
  "usuario_modificacion" TEXT,
  CONSTRAINT "asignacion_gps_unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lectura_kilometraje_unidad" (
  "id" SERIAL NOT NULL,
  "public_id" UUID NOT NULL,
  "unidad_id" INTEGER NOT NULL,
  "valor" INTEGER NOT NULL,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fuente" TEXT,
  "observacion" TEXT,
  "registrado_por" TEXT NOT NULL,
  CONSTRAINT "lectura_kilometraje_unidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activo_responsable_id_idx" ON "activo"("responsable_id");
CREATE INDEX "activo_ubicacion_habitual_id_idx" ON "activo"("ubicacion_habitual_id");
CREATE UNIQUE INDEX "asignacion_gps_unidad_public_id_key" ON "asignacion_gps_unidad"("public_id");
CREATE INDEX "asignacion_gps_unidad_unidad_id_fecha_inicio_idx" ON "asignacion_gps_unidad"("unidad_id", "fecha_inicio");
CREATE INDEX "asignacion_gps_unidad_activo_id_fecha_inicio_idx" ON "asignacion_gps_unidad"("activo_id", "fecha_inicio");
CREATE UNIQUE INDEX "asignacion_gps_unidad_unidad_activa_key" ON "asignacion_gps_unidad"("unidad_id") WHERE "fecha_fin" IS NULL;
CREATE UNIQUE INDEX "asignacion_gps_unidad_activo_activa_key" ON "asignacion_gps_unidad"("activo_id") WHERE "fecha_fin" IS NULL;
CREATE UNIQUE INDEX "lectura_kilometraje_unidad_public_id_key" ON "lectura_kilometraje_unidad"("public_id");
CREATE INDEX "lectura_kilometraje_unidad_unidad_id_fecha_idx" ON "lectura_kilometraje_unidad"("unidad_id", "fecha");

-- AddForeignKey
ALTER TABLE "activo" ADD CONSTRAINT "activo_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "activo" ADD CONSTRAINT "activo_ubicacion_habitual_id_fkey" FOREIGN KEY ("ubicacion_habitual_id") REFERENCES "ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asignacion_gps_unidad" ADD CONSTRAINT "asignacion_gps_unidad_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asignacion_gps_unidad" ADD CONSTRAINT "asignacion_gps_unidad_activo_id_fkey" FOREIGN KEY ("activo_id") REFERENCES "activo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lectura_kilometraje_unidad" ADD CONSTRAINT "lectura_kilometraje_unidad_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
