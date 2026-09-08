-- Maestro administrable de tipos de vehiculo.
CREATE TABLE "tipo_vehiculo" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "clase_sugerida" "clase_unidad",
    "categoria_sugerida" TEXT,
    "estado_activo" "estado_activo" NOT NULL DEFAULT 'ACTIVO',
    "estado_registro" "estado_registro" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_creacion" TEXT NOT NULL,
    "fecha_modificacion" TIMESTAMP(3),
    "usuario_modificacion" TEXT,

    CONSTRAINT "tipo_vehiculo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tipo_vehiculo_public_id_key" ON "tipo_vehiculo"("public_id");
CREATE UNIQUE INDEX "tipo_vehiculo_codigo_key" ON "tipo_vehiculo"("codigo");

-- Catalogo inicial de tipos bien definidos, con clase y categoria MTC sugeridas.
INSERT INTO "tipo_vehiculo" ("public_id", "codigo", "nombre", "descripcion", "clase_sugerida", "categoria_sugerida", "usuario_creacion") VALUES
(gen_random_uuid(), 'AUTO', 'Auto', 'Vehiculo ligero de pasajeros', 'LIVIANO', 'M1', 'sistema'),
(gen_random_uuid(), 'CAMIONETA', 'Camioneta', 'Pick-up o SUV de trabajo', 'LIVIANO', 'N1', 'sistema'),
(gen_random_uuid(), 'MINIVAN', 'Minivan', 'Transporte ligero de personal', 'LIVIANO', 'M2', 'sistema'),
(gen_random_uuid(), 'MINIBUS', 'Minibus', 'Transporte de personal de mediana capacidad', 'PESADO', 'M2', 'sistema'),
(gen_random_uuid(), 'BUS', 'Bus', 'Transporte de personal de gran capacidad', 'PESADO', 'M3', 'sistema'),
(gen_random_uuid(), 'CAMION', 'Camion', 'Camion de carga rigido', 'PESADO', 'N3', 'sistema'),
(gen_random_uuid(), 'TRACTO', 'Tracto', 'Tracto remolcador para semirremolques', 'PESADO', 'N3', 'sistema'),
(gen_random_uuid(), 'CISTERNA', 'Cisterna', 'Camion cisterna para liquidos o combustible', 'PESADO', 'N3', 'sistema'),
(gen_random_uuid(), 'FURGON', 'Furgon', 'Camion con carroceria cerrada', 'PESADO', 'N2', 'sistema'),
(gen_random_uuid(), 'GRUA', 'Grua', 'Camion grua o de auxilio mecanico', 'PESADO', 'N3', 'sistema'),
(gen_random_uuid(), 'VOLQUETE', 'Volquete', 'Camion volquete para material a granel', 'PESADO', 'N3', 'sistema'),
(gen_random_uuid(), 'REMOLQUE', 'Remolque', 'Acople remolcado de eje delantero y trasero', 'REMOLQUE', 'O3', 'sistema'),
(gen_random_uuid(), 'SEMIRREMOLQUE', 'Semirremolque', 'Acople apoyado sobre el tracto', 'SEMIRREMOLQUE', 'O4', 'sistema'),
(gen_random_uuid(), 'PLATAFORMA', 'Plataforma', 'Semirremolque plataforma para carga general', 'SEMIRREMOLQUE', 'O4', 'sistema'),
(gen_random_uuid(), 'CAMA_BAJA', 'Cama baja', 'Semirremolque cama baja para maquinaria', 'SEMIRREMOLQUE', 'O4', 'sistema'),
(gen_random_uuid(), 'TOLVA', 'Tolva', 'Semirremolque tolva para granel', 'SEMIRREMOLQUE', 'O4', 'sistema'),
(gen_random_uuid(), 'OTRO', 'Otro', 'Tipo no catalogado', 'OTRO', NULL, 'sistema');
