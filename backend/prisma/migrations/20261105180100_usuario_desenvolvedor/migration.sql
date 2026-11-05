INSERT INTO "Usuario" ("id", "nome", "email", "senhaHash", "perfil", "criadoEm")
SELECT
  'desenvolvedor',
  'Desenvolvedor',
  'desenvolvedor@sgcr.local',
  '$2b$10$p9n.3VGeiqWzE.mB1Cl5l.ooxqSkhqiirwNXd5CwIKRN9iSa4DChO',
  'DESENVOLVEDOR',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Usuario" WHERE "email" = 'desenvolvedor@sgcr.local'
);
