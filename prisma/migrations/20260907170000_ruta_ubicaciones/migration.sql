-- Ruta referencia el maestro de ubicaciones para origen y destino.
ALTER TABLE "ruta" ADD COLUMN "ubicacion_origen_id" INTEGER;
ALTER TABLE "ruta" ADD COLUMN "ubicacion_destino_id" INTEGER;

ALTER TABLE "ruta" ADD CONSTRAINT "ruta_ubicacion_origen_id_fkey"
  FOREIGN KEY ("ubicacion_origen_id") REFERENCES "ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ruta" ADD CONSTRAINT "ruta_ubicacion_destino_id_fkey"
  FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
