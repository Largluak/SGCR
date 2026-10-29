-- A foto do restaurante fica no banco para continuar disponível
-- quando a API roda em um ambiente sem disco permanente.
ALTER TABLE "Restaurante" ADD COLUMN "fotoMime" TEXT;
ALTER TABLE "Restaurante" ADD COLUMN "fotoDados" BYTEA;
