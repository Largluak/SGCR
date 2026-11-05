# SGCR — Sistema de Gestão de Comandas

Sistema web para restaurantes de pequeno porte. O garçom abre comandas por mesa, lança o cardápio e fecha a conta no celular. O gerente cuida do cardápio, do estoque de bebidas e dos relatórios de vendas.

O projeto segue o relatório técnico do SGCR: frontend em Next.js (instalável como PWA), API REST em NestJS e PostgreSQL. O protótipo visual de referência está em [sgcr-nine.vercel.app](https://sgcr-nine.vercel.app/). A versão deste repositório, para o orientador e a banca, está em [https://sgcr-comandas.vercel.app](https://sgcr-comandas.vercel.app).

## O que o sistema faz

- Login por perfil. O garçom cai no salão, o gerente cai no painel e o desenvolvedor cai na visão do sistema.
- Mesas com status livre, ocupada ou aguardando pagamento.
- Comanda com lançamento, alteração de quantidade e total calculado.
- Fechamento total ou parcial por itens, com dinheiro, cartão ou Pix. A divisão por pessoa só aparece na tela.
- Cardápio com produto direto (bebida) ou preparado (prato). Só o direto baixa estoque.
- Alerta quando o estoque fica no mínimo ou abaixo.
- Relatórios mensal, trimestral e semestral em Excel, só com comandas fechadas. O gerente baixa o arquivo na tela de relatórios.

Cada casa tem o próprio cardápio, as próprias mesas e a própria equipe. Ficam de fora, como trabalho futuro do relatório: ficha técnica de insumos, uso offline com sincronização, nota fiscal e maquininha.

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
| Desenvolvedor | desenvolvedor@sgcr.local | desenvolvedor123 |
| Gerente | carla.souza@ardosia.local | gerente123 |
| Garçom | joao.ribeiro@ardosia.local | garcom123 |

As senhas ficam gravadas com hash. Troque `JWT_SECRET` no `backend/.env` se for sair do uso local.

Em Gestão → Equipe o gerente cadastra os garçons. Em Gestão → Aparência troca o nome, a foto e a cor de destaque do restaurante. O painel continua claro, o salão continua escuro, e as cores de confirmar, cancelar e alerta permanecem as mesmas.

O desenvolvedor é a conta de quem mantém o sistema. Em Sistema ele vê os restaurantes cadastrados, abre a gestão de cada casa e cria ou remove gerentes. Cada gerente aparece ligado ao restaurante que comanda. O garçom e o gerente só enxergam a própria casa. O desenvolvedor não aparece na equipe.

O Rancho do Didi entra com a gerente Patricia Melo, 8 mesas e o cardápio da foto. Há comandas de exemplo de julho a novembro, duas delas ainda abertas, para a casa não aparecer vazia. As bebidas começam com 24 unidades, porque a foto não informa a quantidade, e as vendas de exemplo baixam esse estoque. A cor de destaque é o terracota do cardápio, `#C45C26`. O acesso dela não fica na tela de login, para não ficar público.

## Testes

```bash
npm test
```

Os testes da API cobrem baixa e devolução de estoque, fechamento parcial, fechamento total, recusa de item já pago e o bloqueio do perfil garçom nas funções do gerente.

## Versão publicada

Abra no navegador: [https://sgcr-comandas.vercel.app](https://sgcr-comandas.vercel.app)

Os acessos de demonstração da tabela acima valem nesse endereço. O site e a API estão na Vercel (plano Hobby) e o PostgreSQL está no Neon (plano Free).

Para levar uma alteração sua até esse endereço, na pasta do projeto:

```bash
git pull origin main
git push github main
```

O segundo comando é o que a Vercel acompanha. O `origin` deste clone é o remoto do Cursor.

Nome e cor do restaurante ficam gravados no banco. A foto enviada em Aparência, nesta versão publicada, ainda depende de arquivo em disco e pode sumir num novo deploy.
