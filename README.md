# SGCR — Sistema de Gestão de Comandas

Sistema web para restaurantes de pequeno porte. O garçom abre comandas por mesa, lança o cardápio e fecha a conta no celular. O gerente cuida do cardápio, do estoque de bebidas e dos relatórios de vendas.

O projeto segue o relatório técnico do SGCR: frontend em Next.js (instalável como PWA), API REST em NestJS e PostgreSQL. O protótipo visual de referência está em [sgcr-nine.vercel.app](https://sgcr-nine.vercel.app/). Esta versão roda primeiro na sua máquina. A hospedagem fica para um passo seguinte.

## O que o sistema faz

- Login por perfil. O garçom cai no salão; o gerente cai no painel.
- Mesas com status livre, ocupada ou aguardando pagamento.
- Comanda com lançamento, alteração de quantidade e total calculado.
- Fechamento total ou parcial por itens, com dinheiro, cartão ou Pix. A divisão por pessoa só aparece na tela.
- Cardápio com produto direto (bebida) ou preparado (prato). Só o direto baixa estoque.
- Alerta quando o estoque fica no mínimo ou abaixo.
- Relatórios mensal, trimestral e semestral, só com comandas fechadas.

Ficam de fora, como trabalho futuro do relatório: ficha técnica de insumos, uso offline com sincronização, vários restaurantes, nota fiscal e maquininha.

## O que instalar no seu computador

1. [Node.js 22](https://nodejs.org/)
2. [Git](https://git-scm.com/downloads)
3. [Docker Desktop](https://www.docker.com/products/docker-desktop/), para subir o PostgreSQL

No Windows, depois de instalar o Git, feche e abra o terminal para o comando `git` passar a ser reconhecido.

## Como rodar

Na pasta do projeto:

```bash
docker compose up -d
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
npm install --prefix backend
npm install --prefix frontend
npm run db:setup
```

Em dois terminais:

```bash
npm run dev:api
npm run dev:web
```

- Salão e painel: http://127.0.0.1:4310
- API: http://127.0.0.1:4311

O `db:setup` gera o cliente do Prisma, aplica as tabelas e carrega o restaurante de demonstração Ardósia (12 mesas, cardápio e comandas abertas).

### Acessos de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Gerente | carla.souza@ardosia.local | gerente123 |
| Garçom | joao.ribeiro@ardosia.local | garcom123 |

As senhas ficam gravadas com hash. Troque `JWT_SECRET` no `backend/.env` se for sair do uso local.

Em Gestão → Equipe o gerente cadastra os garçons. Em Gestão → Aparência troca o nome, a foto e a cor de destaque do restaurante. O painel continua claro, o salão continua escuro, e as cores de confirmar, cancelar e alerta permanecem as mesmas.

## Testes

```bash
npm test
```

Os testes da API cobrem baixa e devolução de estoque, fechamento parcial, fechamento total, recusa de item já pago e o bloqueio do perfil garçom nas funções do gerente.

## Hospedagem, depois

Quando o uso local estiver estável, o relatório prevê:

- frontend na Vercel
- API em um serviço Node contínuo, como Render ou Railway
- PostgreSQL gerenciado, como Neon

Defina `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN` e `NEXT_PUBLIC_API_URL` nesses serviços e rode `npm run prisma:deploy` e o seed só se quiser os dados de demonstração. A comunicação precisa ser HTTPS.
