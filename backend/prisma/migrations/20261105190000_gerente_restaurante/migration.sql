ALTER TABLE "Usuario" ADD COLUMN "restauranteId" TEXT;

UPDATE "Usuario"
SET "restauranteId" = 'principal'
WHERE "perfil" IN ('GERENTE', 'GARCOM');

ALTER TABLE "Usuario"
ADD CONSTRAINT "Usuario_restauranteId_fkey"
FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
