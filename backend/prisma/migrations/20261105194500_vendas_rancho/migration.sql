-- Vendas de demonstração do Rancho do Didi. Não mexe nas comandas da Ardósia.
-- O bloco só entra se a primeira comanda ainda não existir.

INSERT INTO "Comanda" (
  "id", "mesaId", "status", "pessoas", "aguardandoPagamento", "abertaEm", "fechadaEm"
)
SELECT
  v.id,
  v.mesa,
  v.status::"StatusComanda",
  v.pessoas,
  v.aguardando,
  v.aberta,
  v.fechada
FROM (
  SELECT 'rancho-venda-01'::text AS id, 'rancho-mesa-2'::text AS mesa, 'FECHADA'::text AS status, 4::int AS pessoas, false AS aguardando, timestamp '2026-07-12 13:00:00' AS aberta, timestamp '2026-07-12 14:20:00' AS fechada
  UNION ALL SELECT 'rancho-venda-02', 'rancho-mesa-5', 'FECHADA', 2, false, timestamp '2026-07-26 19:10:00', timestamp '2026-07-26 20:30:00'
  UNION ALL SELECT 'rancho-venda-03', 'rancho-mesa-1', 'FECHADA', 3, false, timestamp '2026-08-08 12:40:00', timestamp '2026-08-08 14:00:00'
  UNION ALL SELECT 'rancho-venda-04', 'rancho-mesa-4', 'FECHADA', 2, false, timestamp '2026-08-22 20:00:00', timestamp '2026-08-22 21:15:00'
  UNION ALL SELECT 'rancho-venda-05', 'rancho-mesa-3', 'FECHADA', 4, false, timestamp '2026-09-05 13:20:00', timestamp '2026-09-05 15:00:00'
  UNION ALL SELECT 'rancho-venda-06', 'rancho-mesa-6', 'FECHADA', 2, false, timestamp '2026-09-18 19:40:00', timestamp '2026-09-18 21:00:00'
  UNION ALL SELECT 'rancho-venda-07', 'rancho-mesa-7', 'FECHADA', 3, false, timestamp '2026-09-27 12:10:00', timestamp '2026-09-27 13:40:00'
  UNION ALL SELECT 'rancho-venda-08', 'rancho-mesa-2', 'FECHADA', 5, false, timestamp '2026-10-04 13:00:00', timestamp '2026-10-04 15:10:00'
  UNION ALL SELECT 'rancho-venda-09', 'rancho-mesa-8', 'FECHADA', 2, false, timestamp '2026-10-11 20:15:00', timestamp '2026-10-11 21:40:00'
  UNION ALL SELECT 'rancho-venda-10', 'rancho-mesa-1', 'FECHADA', 4, false, timestamp '2026-10-19 12:30:00', timestamp '2026-10-19 14:20:00'
  UNION ALL SELECT 'rancho-venda-11', 'rancho-mesa-5', 'FECHADA', 2, false, timestamp '2026-10-28 19:00:00', timestamp '2026-10-28 20:20:00'
  UNION ALL SELECT 'rancho-venda-12', 'rancho-mesa-3', 'FECHADA', 3, false, timestamp '2026-11-02 13:10:00', timestamp '2026-11-02 14:40:00'
  UNION ALL SELECT 'rancho-venda-13', 'rancho-mesa-4', 'FECHADA', 2, false, timestamp '2026-11-04 20:05:00', timestamp '2026-11-04 21:30:00'
  UNION ALL SELECT 'rancho-venda-14', 'rancho-mesa-6', 'FECHADA', 4, false,
    (date_trunc('day', CURRENT_TIMESTAMP) + interval '12 hours 20 minutes')::timestamp,
    (date_trunc('day', CURRENT_TIMESTAMP) + interval '13 hours 50 minutes')::timestamp
  UNION ALL SELECT 'rancho-venda-15', 'rancho-mesa-8', 'FECHADA', 2, false,
    (date_trunc('day', CURRENT_TIMESTAMP) + interval '11 hours')::timestamp,
    (date_trunc('day', CURRENT_TIMESTAMP) + interval '12 hours 10 minutes')::timestamp
  UNION ALL SELECT 'rancho-venda-16', 'rancho-mesa-1', 'ABERTA', 3, false,
    (CURRENT_TIMESTAMP - interval '70 minutes')::timestamp,
    NULL::timestamp
  UNION ALL SELECT 'rancho-venda-17', 'rancho-mesa-2', 'ABERTA', 2, true,
    (CURRENT_TIMESTAMP - interval '25 minutes')::timestamp,
    NULL::timestamp
) v
WHERE NOT EXISTS (SELECT 1 FROM "Comanda" c WHERE c.id = v.id);

INSERT INTO "Pagamento" ("id", "comandaId", "forma", "valor", "criadoEm")
SELECT v.id, v.comanda, v.forma::"FormaPagamento", v.valor, v.quando
FROM (
  SELECT 'rancho-pag-01'::text AS id, 'rancho-venda-01'::text AS comanda, 'PIX'::text AS forma, 183.00::numeric AS valor, timestamp '2026-07-12 14:20:00' AS quando
  UNION ALL SELECT 'rancho-pag-02', 'rancho-venda-02', 'CARTAO', 194.00, timestamp '2026-07-26 20:30:00'
  UNION ALL SELECT 'rancho-pag-03', 'rancho-venda-03', 'DINHEIRO', 235.90, timestamp '2026-08-08 14:00:00'
  UNION ALL SELECT 'rancho-pag-04', 'rancho-venda-04', 'PIX', 179.90, timestamp '2026-08-22 21:15:00'
  UNION ALL SELECT 'rancho-pag-05', 'rancho-venda-05', 'CARTAO', 326.90, timestamp '2026-09-05 15:00:00'
  UNION ALL SELECT 'rancho-pag-06', 'rancho-venda-06', 'PIX', 116.00, timestamp '2026-09-18 21:00:00'
  UNION ALL SELECT 'rancho-pag-07', 'rancho-venda-07', 'DINHEIRO', 198.00, timestamp '2026-09-27 13:40:00'
  UNION ALL SELECT 'rancho-pag-08', 'rancho-venda-08', 'CARTAO', 345.00, timestamp '2026-10-04 15:10:00'
  UNION ALL SELECT 'rancho-pag-09', 'rancho-venda-09', 'PIX', 160.00, timestamp '2026-10-11 21:40:00'
  UNION ALL SELECT 'rancho-pag-10', 'rancho-venda-10', 'CARTAO', 259.80, timestamp '2026-10-19 14:20:00'
  UNION ALL SELECT 'rancho-pag-11', 'rancho-venda-11', 'DINHEIRO', 173.90, timestamp '2026-10-28 20:20:00'
  UNION ALL SELECT 'rancho-pag-12', 'rancho-venda-12', 'PIX', 264.00, timestamp '2026-11-02 14:40:00'
  UNION ALL SELECT 'rancho-pag-13', 'rancho-venda-13', 'CARTAO', 157.00, timestamp '2026-11-04 21:30:00'
  UNION ALL SELECT 'rancho-pag-14', 'rancho-venda-14', 'PIX', 216.00,
    (date_trunc('day', CURRENT_TIMESTAMP) + interval '13 hours 50 minutes')::timestamp
  UNION ALL SELECT 'rancho-pag-15', 'rancho-venda-15', 'DINHEIRO', 89.90,
    (date_trunc('day', CURRENT_TIMESTAMP) + interval '12 hours 10 minutes')::timestamp
) v
WHERE NOT EXISTS (SELECT 1 FROM "Pagamento" p WHERE p.id = v.id);

INSERT INTO "ItemComanda" (
  "id", "comandaId", "produtoId", "quantidade", "precoUnitario", "statusPagamento", "pagamentoId"
)
SELECT
  v.id,
  v.comanda,
  v.produto,
  v.qtd,
  v.preco,
  v.status::"StatusPagamentoItem",
  v.pagamento
FROM (
  SELECT 'rancho-item-01a'::text AS id, 'rancho-venda-01'::text AS comanda, 'rancho-combo-casa'::text AS produto, 1::int AS qtd, 95.00::numeric AS preco, 'PAGO'::text AS status, 'rancho-pag-01'::text AS pagamento
  UNION ALL SELECT 'rancho-item-01b', 'rancho-venda-01', 'rancho-heineken', 4, 22.00, 'PAGO', 'rancho-pag-01'
  UNION ALL SELECT 'rancho-item-02a', 'rancho-venda-02', 'rancho-parmegiana-chef', 2, 67.00, 'PAGO', 'rancho-pag-02'
  UNION ALL SELECT 'rancho-item-02b', 'rancho-venda-02', 'rancho-refri-lata', 2, 10.00, 'PAGO', 'rancho-pag-02'
  UNION ALL SELECT 'rancho-item-02c', 'rancho-venda-02', 'rancho-batata-mandioca', 1, 40.00, 'PAGO', 'rancho-pag-02'
  UNION ALL SELECT 'rancho-item-03a', 'rancho-venda-03', 'rancho-chapa-bruta', 1, 110.90, 'PAGO', 'rancho-pag-03'
  UNION ALL SELECT 'rancho-item-03b', 'rancho-venda-03', 'rancho-caipirinha', 3, 25.00, 'PAGO', 'rancho-pag-03'
  UNION ALL SELECT 'rancho-item-03c', 'rancho-venda-03', 'rancho-torresmo', 1, 50.00, 'PAGO', 'rancho-pag-03'
  UNION ALL SELECT 'rancho-item-04a', 'rancho-venda-04', 'rancho-picanha', 1, 149.90, 'PAGO', 'rancho-pag-04'
  UNION ALL SELECT 'rancho-item-04b', 'rancho-venda-04', 'rancho-vinho', 2, 15.00, 'PAGO', 'rancho-pag-04'
  UNION ALL SELECT 'rancho-item-05a', 'rancho-venda-05', 'rancho-parmegiana-chef-2', 1, 119.90, 'PAGO', 'rancho-pag-05'
  UNION ALL SELECT 'rancho-item-05b', 'rancho-venda-05', 'rancho-peixe-bife-frango', 1, 80.00, 'PAGO', 'rancho-pag-05'
  UNION ALL SELECT 'rancho-item-05c', 'rancho-venda-05', 'rancho-skol', 4, 18.00, 'PAGO', 'rancho-pag-05'
  UNION ALL SELECT 'rancho-item-05d', 'rancho-venda-05', 'rancho-porcao-mista', 1, 55.00, 'PAGO', 'rancho-pag-05'
  UNION ALL SELECT 'rancho-item-06a', 'rancho-venda-06', 'rancho-parmegiana-fit', 2, 40.00, 'PAGO', 'rancho-pag-06'
  UNION ALL SELECT 'rancho-item-06b', 'rancho-venda-06', 'rancho-suco', 2, 10.00, 'PAGO', 'rancho-pag-06'
  UNION ALL SELECT 'rancho-item-06c', 'rancho-venda-06', 'rancho-ovo', 2, 8.00, 'PAGO', 'rancho-pag-06'
  UNION ALL SELECT 'rancho-item-07a', 'rancho-venda-07', 'rancho-carne-seca', 1, 60.00, 'PAGO', 'rancho-pag-07'
  UNION ALL SELECT 'rancho-item-07b', 'rancho-venda-07', 'rancho-contra-file', 1, 80.00, 'PAGO', 'rancho-pag-07'
  UNION ALL SELECT 'rancho-item-07c', 'rancho-venda-07', 'rancho-agua', 3, 6.00, 'PAGO', 'rancho-pag-07'
  UNION ALL SELECT 'rancho-item-07d', 'rancho-venda-07', 'rancho-guarnicao', 2, 20.00, 'PAGO', 'rancho-pag-07'
  UNION ALL SELECT 'rancho-item-08a', 'rancho-venda-08', 'rancho-combo-casa', 2, 95.00, 'PAGO', 'rancho-pag-08'
  UNION ALL SELECT 'rancho-item-08b', 'rancho-venda-08', 'rancho-heineken', 5, 22.00, 'PAGO', 'rancho-pag-08'
  UNION ALL SELECT 'rancho-item-08c', 'rancho-venda-08', 'rancho-frango-pass', 1, 45.00, 'PAGO', 'rancho-pag-08'
  UNION ALL SELECT 'rancho-item-09a', 'rancho-venda-09', 'rancho-file-peixe', 1, 60.00, 'PAGO', 'rancho-pag-09'
  UNION ALL SELECT 'rancho-item-09b', 'rancho-venda-09', 'rancho-meio-file', 1, 40.00, 'PAGO', 'rancho-pag-09'
  UNION ALL SELECT 'rancho-item-09c', 'rancho-venda-09', 'rancho-caipirinha-saque', 2, 30.00, 'PAGO', 'rancho-pag-09'
  UNION ALL SELECT 'rancho-item-10a', 'rancho-venda-10', 'rancho-chapa-bruta', 1, 110.90, 'PAGO', 'rancho-pag-10'
  UNION ALL SELECT 'rancho-item-10b', 'rancho-venda-10', 'rancho-parmegiana-fit-2', 1, 69.90, 'PAGO', 'rancho-pag-10'
  UNION ALL SELECT 'rancho-item-10c', 'rancho-venda-10', 'rancho-refri-600', 3, 13.00, 'PAGO', 'rancho-pag-10'
  UNION ALL SELECT 'rancho-item-10d', 'rancho-venda-10', 'rancho-batata-mandioca', 1, 40.00, 'PAGO', 'rancho-pag-10'
  UNION ALL SELECT 'rancho-item-11a', 'rancho-venda-11', 'rancho-picanha', 1, 149.90, 'PAGO', 'rancho-pag-11'
  UNION ALL SELECT 'rancho-item-11b', 'rancho-venda-11', 'rancho-cerveja-zero', 2, 12.00, 'PAGO', 'rancho-pag-11'
  UNION ALL SELECT 'rancho-item-12a', 'rancho-venda-12', 'rancho-peixe-bife-frango', 2, 80.00, 'PAGO', 'rancho-pag-12'
  UNION ALL SELECT 'rancho-item-12b', 'rancho-venda-12', 'rancho-skol', 3, 18.00, 'PAGO', 'rancho-pag-12'
  UNION ALL SELECT 'rancho-item-12c', 'rancho-venda-12', 'rancho-torresmo', 1, 50.00, 'PAGO', 'rancho-pag-12'
  UNION ALL SELECT 'rancho-item-13a', 'rancho-venda-13', 'rancho-parmegiana-chef', 1, 67.00, 'PAGO', 'rancho-pag-13'
  UNION ALL SELECT 'rancho-item-13b', 'rancho-venda-13', 'rancho-file-peixe', 1, 60.00, 'PAGO', 'rancho-pag-13'
  UNION ALL SELECT 'rancho-item-13c', 'rancho-venda-13', 'rancho-vinho', 2, 15.00, 'PAGO', 'rancho-pag-13'
  UNION ALL SELECT 'rancho-item-14a', 'rancho-venda-14', 'rancho-combo-casa', 1, 95.00, 'PAGO', 'rancho-pag-14'
  UNION ALL SELECT 'rancho-item-14b', 'rancho-venda-14', 'rancho-heineken', 3, 22.00, 'PAGO', 'rancho-pag-14'
  UNION ALL SELECT 'rancho-item-14c', 'rancho-venda-14', 'rancho-porcao-mista', 1, 55.00, 'PAGO', 'rancho-pag-14'
  UNION ALL SELECT 'rancho-item-15a', 'rancho-venda-15', 'rancho-parmegiana-fit-2', 1, 69.90, 'PAGO', 'rancho-pag-15'
  UNION ALL SELECT 'rancho-item-15b', 'rancho-venda-15', 'rancho-suco', 2, 10.00, 'PAGO', 'rancho-pag-15'
  UNION ALL SELECT 'rancho-item-16a', 'rancho-venda-16', 'rancho-picanha', 1, 149.90, 'PENDENTE', NULL::text
  UNION ALL SELECT 'rancho-item-16b', 'rancho-venda-16', 'rancho-caipirinha', 2, 25.00, 'PENDENTE', NULL::text
  UNION ALL SELECT 'rancho-item-16c', 'rancho-venda-16', 'rancho-batata-mandioca', 1, 40.00, 'PENDENTE', NULL::text
  UNION ALL SELECT 'rancho-item-17a', 'rancho-venda-17', 'rancho-contra-file', 1, 80.00, 'PENDENTE', NULL::text
  UNION ALL SELECT 'rancho-item-17b', 'rancho-venda-17', 'rancho-refri-lata', 2, 10.00, 'PENDENTE', NULL::text
) v
WHERE NOT EXISTS (SELECT 1 FROM "ItemComanda" i WHERE i.id = v.id);

UPDATE "Estoque" e
SET quantidade = GREATEST(e.quantidade - v.qtd, 0)
FROM (
  SELECT i."produtoId", SUM(i.quantidade)::int AS qtd
  FROM "ItemComanda" i
  JOIN "Produto" p ON p.id = i."produtoId" AND p.tipo = 'DIRETO'
  WHERE i.id LIKE 'rancho-item-%'
  GROUP BY i."produtoId"
) v
WHERE e."produtoId" = v."produtoId"
  AND NOT EXISTS (
    SELECT 1 FROM "MovimentacaoEstoque" m
    WHERE m.id = 'rancho-mov-' || v."produtoId"
  );

INSERT INTO "MovimentacaoEstoque" ("id", "estoqueId", "tipo", "quantidade", "motivo", "criadoEm")
SELECT
  'rancho-mov-' || v."produtoId",
  e.id,
  'SAIDA'::"TipoMovimentacao",
  v.qtd,
  'Vendas lançadas no cardápio',
  CURRENT_TIMESTAMP
FROM (
  SELECT i."produtoId", SUM(i.quantidade)::int AS qtd
  FROM "ItemComanda" i
  JOIN "Produto" p ON p.id = i."produtoId" AND p.tipo = 'DIRETO'
  WHERE i.id LIKE 'rancho-item-%'
  GROUP BY i."produtoId"
) v
JOIN "Estoque" e ON e."produtoId" = v."produtoId"
WHERE NOT EXISTS (
  SELECT 1 FROM "MovimentacaoEstoque" m
  WHERE m.id = 'rancho-mov-' || v."produtoId"
);
