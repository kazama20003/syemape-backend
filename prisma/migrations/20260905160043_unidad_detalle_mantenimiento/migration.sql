-- AlterTable
ALTER TABLE "unidad" ADD COLUMN     "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kilometraje" INTEGER,
ADD COLUMN     "tipo_combustible" TEXT;
