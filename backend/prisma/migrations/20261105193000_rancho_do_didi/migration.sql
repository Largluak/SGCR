-- Separa mesas e cardápio por restaurante, sem apagar o que a Ardósia já tem.
ALTER TABLE "Mesa" ADD COLUMN "restauranteId" TEXT;
ALTER TABLE "Produto" ADD COLUMN "restauranteId" TEXT;

UPDATE "Mesa" SET "restauranteId" = 'principal' WHERE "restauranteId" IS NULL;
UPDATE "Produto" SET "restauranteId" = 'principal' WHERE "restauranteId" IS NULL;

ALTER TABLE "Mesa" ALTER COLUMN "restauranteId" SET NOT NULL;
ALTER TABLE "Produto" ALTER COLUMN "restauranteId" SET NOT NULL;

DROP INDEX IF EXISTS "Mesa_numero_key";
ALTER TABLE "Mesa"
ADD CONSTRAINT "Mesa_restauranteId_numero_key" UNIQUE ("restauranteId", "numero");

ALTER TABLE "Mesa"
ADD CONSTRAINT "Mesa_restauranteId_fkey"
FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Produto"
ADD CONSTRAINT "Produto_restauranteId_fkey"
FOREIGN KEY ("restauranteId") REFERENCES "Restaurante"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Restaurante" ("id", "nome", "corSecundaria", "atualizadoEm")
SELECT 'rancho-do-didi', 'Rancho do Didi', '#C45C26', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Restaurante" WHERE "id" = 'rancho-do-didi'
);

INSERT INTO "Usuario" ("id", "nome", "email", "senhaHash", "perfil", "restauranteId", "criadoEm")
SELECT
  'patricia-melo',
  'Patricia Melo',
  'patricia.melo@ranchododidi.local',
  '$2b$10$XjjmH8lXnfPv.50.C24ogOi3LjG4PBD/RgxgASwGOEYPtoEJQK1sy',
  'GERENTE',
  'rancho-do-didi',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Usuario" WHERE "email" = 'patricia.melo@ranchododidi.local'
);

INSERT INTO "Mesa" ("id", "numero", "restauranteId", "criadoEm")
SELECT 'rancho-mesa-' || s.n, s.n, 'rancho-do-didi', CURRENT_TIMESTAMP
FROM generate_series(1, 8) AS s(n)
WHERE NOT EXISTS (
  SELECT 1 FROM "Mesa"
  WHERE "restauranteId" = 'rancho-do-didi' AND "numero" = s.n
);

-- Cardápio lido da foto. Pratos não entram no estoque. Bebidas começam com uma quantidade inicial.
INSERT INTO "Produto" ("id", "nome", "descricao", "categoria", "preco", "tipo", "ativo", "restauranteId")
SELECT
  novo.id,
  novo.nome,
  novo.descricao,
  novo.categoria::"CategoriaProduto",
  novo.preco,
  novo.tipo::"TipoProduto",
  novo.ativo,
  novo."restauranteId"
FROM (VALUES
  ('rancho-combo-casa', 'Combo da casa 2 a 3 pessoas', 'Mistura: peixe, bife ou frango. Acompanha arroz, feijão, batata frita e salada.', 'PRATO', 95.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-chapa-bruta', 'Chapa bruta da casa 2 a 4 pessoas', 'Mistura: carne seca, contrafilé ou carne bruta. Acompanha arroz, feijão, batata frita, mandioca e salada.', 'PRATO', 110.90, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-parmegiana-chef-2', 'Parmegiana do chef 2 pessoas', 'Mistura: peixe, carne ou frango. Acompanha arroz, feijão, batata frita e salada.', 'PRATO', 119.90, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-parmegiana-fit-2', 'Parmegiana fit 2 pessoas', 'Mistura: berinjela ou abobrinha. Acompanha salada e omelete.', 'PRATO', 69.90, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-picanha', 'Picanha bruta na chapa', 'Acompanha arroz, feijão, batata frita e salada.', 'PRATO', 149.90, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-peixe-bife-frango', 'Peixe, bife ou frango', 'Acompanha arroz, feijão, batata frita e salada.', 'PRATO', 80.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-parmegiana-chef', 'Parmegiana do chef', 'Acompanha arroz, feijão, batata frita e salada.', 'PRATO', 67.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-parmegiana-fit', 'Parmegiana fit', 'Mistura: berinjela ou abobrinha. Acompanha salada e omelete.', 'PRATO', 40.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-file-peixe', 'Filé de peixe', 'Porção.', 'ENTRADA', 60.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-batata-mandioca', 'Batata, mandioca, calabresa ou polenta', 'Porção, à escolha.', 'ENTRADA', 40.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-porcao-mista', 'Porção mista', 'Porção.', 'ENTRADA', 55.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-carne-seca', 'Carne seca à moda', 'Porção.', 'ENTRADA', 60.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-contra-file', 'Contrafilé', 'Porção.', 'ENTRADA', 80.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-torresmo', 'Torresmo', 'Porção.', 'ENTRADA', 50.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-frango-pass', 'Frango à passarinho', 'Porção.', 'ENTRADA', 45.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-meio-file', 'Meio filé', 'Porção.', 'ENTRADA', 40.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-meia-guarnicao', 'Meia calabresa, mandioca ou batata frita', 'Porção, à escolha.', 'ENTRADA', 25.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-ovo', 'Ovo frito', 'Guarnição.', 'ENTRADA', 8.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-guarnicao', 'Guarnição', 'Arroz, feijão ou salada, e linguiça frita.', 'ENTRADA', 20.00, 'PREPARADO', true, 'rancho-do-didi'),
  ('rancho-agua', 'Água mineral 500ml', NULL, 'BEBIDA', 6.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-suco', 'Suco de polpa', NULL, 'BEBIDA', 10.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-refri-lata', 'Refrigerante lata', NULL, 'BEBIDA', 10.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-refri-2l', 'Refrigerante 2 litros', NULL, 'BEBIDA', 20.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-refri-600', 'Refrigerante 600ml', NULL, 'BEBIDA', 13.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-h2o', 'H2O 500ml', NULL, 'BEBIDA', 10.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-heineken', 'Cerveja Heineken', NULL, 'BEBIDA', 22.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-skol', 'Cerveja Skol ou Original', NULL, 'BEBIDA', 18.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-cerveja-zero', 'Cerveja zero', NULL, 'BEBIDA', 12.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-vinho', 'Taça de vinho', NULL, 'BEBIDA', 15.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-cachaca', 'Cachaça da casa', NULL, 'BEBIDA', 10.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-caipirinha', 'Caipirinha de vodka ou pinga', NULL, 'BEBIDA', 25.00, 'DIRETO', true, 'rancho-do-didi'),
  ('rancho-caipirinha-saque', 'Caipirinha de saquê', NULL, 'BEBIDA', 30.00, 'DIRETO', true, 'rancho-do-didi')
) AS novo("id", "nome", "descricao", "categoria", "preco", "tipo", "ativo", "restauranteId")
WHERE NOT EXISTS (
  SELECT 1 FROM "Produto" WHERE "Produto"."id" = novo."id"
);

INSERT INTO "Estoque" ("id", "produtoId", "quantidade", "minimo")
SELECT 'estoque-' || "id", "id", 24, 6
FROM "Produto"
WHERE "id" LIKE 'rancho-%' AND "tipo" = 'DIRETO'
  AND NOT EXISTS (SELECT 1 FROM "Estoque" WHERE "Estoque"."produtoId" = "Produto"."id");
