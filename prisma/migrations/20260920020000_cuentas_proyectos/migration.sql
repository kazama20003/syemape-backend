CREATE TABLE "cuenta" (
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
  CONSTRAINT "cuenta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cuenta_public_id_key" ON "cuenta"("public_id");
CREATE UNIQUE INDEX "cuenta_codigo_key" ON "cuenta"("codigo");
CREATE INDEX "cuenta_nombre_idx" ON "cuenta"("nombre");

CREATE TABLE "proyecto" (
  "id" SERIAL NOT NULL,
  "public_id" UUID NOT NULL,
  "cuenta_id" INTEGER NOT NULL,
  "codigo" TEXT NOT NULL,
  "nombre" TEXT NOT NULL,
  "descripcion" TEXT,
  "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
  "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
  "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usuario_creacion" TEXT NOT NULL,
  "fecha_modificacion" TIMESTAMP(3),
  "usuario_modificacion" TEXT,
  CONSTRAINT "proyecto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "proyecto_public_id_key" ON "proyecto"("public_id");
CREATE UNIQUE INDEX "proyecto_cuenta_id_codigo_key" ON "proyecto"("cuenta_id", "codigo");
CREATE INDEX "proyecto_nombre_idx" ON "proyecto"("nombre");
ALTER TABLE "proyecto" ADD CONSTRAINT "proyecto_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "unidad" ADD COLUMN "cuenta_id" INTEGER, ADD COLUMN "proyecto_id" INTEGER;
ALTER TABLE "manifiesto" ADD COLUMN "cuenta_id" INTEGER, ADD COLUMN "proyecto_id" INTEGER;
CREATE INDEX "unidad_cuenta_id_idx" ON "unidad"("cuenta_id");
CREATE INDEX "unidad_proyecto_id_idx" ON "unidad"("proyecto_id");
CREATE INDEX "manifiesto_cuenta_id_idx" ON "manifiesto"("cuenta_id");
CREATE INDEX "manifiesto_proyecto_id_idx" ON "manifiesto"("proyecto_id");
ALTER TABLE "unidad" ADD CONSTRAINT "unidad_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "unidad" ADD CONSTRAINT "unidad_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "manifiesto" ADD CONSTRAINT "manifiesto_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
