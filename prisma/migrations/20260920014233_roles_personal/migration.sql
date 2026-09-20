-- CreateTable
CREATE TABLE "rol_personal" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "puede_conducir" BOOLEAN NOT NULL DEFAULT false,
    "puede_supervisar" BOOLEAN NOT NULL DEFAULT false,
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "rol_personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_rol_personal" (
    "personal_id" INTEGER NOT NULL,
    "rol_personal_id" INTEGER NOT NULL,

    CONSTRAINT "personal_rol_personal_pkey" PRIMARY KEY ("personal_id","rol_personal_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_personal_public_id_key" ON "rol_personal"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "rol_personal_codigo_key" ON "rol_personal"("codigo");

-- CreateIndex
CREATE INDEX "personal_rol_personal_rol_personal_id_idx" ON "personal_rol_personal"("rol_personal_id");

-- AddForeignKey
ALTER TABLE "personal_rol_personal" ADD CONSTRAINT "personal_rol_personal_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "personal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_rol_personal" ADD CONSTRAINT "personal_rol_personal_rol_personal_id_fkey" FOREIGN KEY ("rol_personal_id") REFERENCES "rol_personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Roles operativos heredados. RolUsuario/JWT se mantiene completamente separado.
INSERT INTO "rol_personal" (
    "public_id", "codigo", "nombre", "descripcion", "puede_conducir", "puede_supervisar", "usuario_creacion"
) VALUES
    ('019d0f20-0000-7000-8000-000000000001', 'CONDUCTOR', 'Conductor', 'Operador habilitado para conducir.', true, false, 'migracion'),
    ('019d0f20-0000-7000-8000-000000000002', 'SUPERVISOR', 'Supervisor', 'Personal habilitado para supervisar y conducir.', true, true, 'migracion'),
    ('019d0f20-0000-7000-8000-000000000003', 'COPILOTO', 'Copiloto', 'Tripulante de apoyo.', false, false, 'migracion'),
    ('019d0f20-0000-7000-8000-000000000004', 'ESCOLTA', 'Escolta', 'Tripulante de escolta.', false, false, 'migracion')
ON CONFLICT ("codigo") DO NOTHING;

-- Conserva el TipoPersonal heredado y lo refleja como asignacion inicial.
INSERT INTO "personal_rol_personal" ("personal_id", "rol_personal_id")
SELECT p."id", r."id"
FROM "personal" p
JOIN "rol_personal" r ON r."codigo" = p."tipo"::text
ON CONFLICT ("personal_id", "rol_personal_id") DO NOTHING;
