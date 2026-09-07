-- Split future person records into explicit name and surname components.
ALTER TABLE "personal"
  ADD COLUMN "primer_nombre" TEXT,
  ADD COLUMN "segundo_nombre" TEXT,
  ADD COLUMN "primer_apellido" TEXT,
  ADD COLUMN "segundo_apellido" TEXT;

-- Existing records retain their full values in the required first components.
UPDATE "personal"
SET
  "primer_nombre" = UPPER(BTRIM("nombres")),
  "primer_apellido" = UPPER(BTRIM("apellidos"));

ALTER TABLE "personal"
  ALTER COLUMN "primer_nombre" SET NOT NULL,
  ALTER COLUMN "primer_apellido" SET NOT NULL;
