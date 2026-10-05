# API do SGCR

A API REST fica nesta pasta. A forma de instalar, subir o banco e rodar o sistema está no [README da raiz](../README.md).

```bash
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run start:dev
```

A API escuta em `http://127.0.0.1:4311`.
