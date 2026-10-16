-- CreateTable
CREATE TABLE "Restaurante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "corSecundaria" TEXT NOT NULL,
    "fotoArquivo" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurante_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Restaurante" ("id", "nome", "corSecundaria", "atualizadoEm")
VALUES ('principal', 'Ardósia', '#B08968', CURRENT_TIMESTAMP);
