# Space Defenders - Auth Service

Microsserviço de autenticação do projeto Space Defenders, construído com NestJS, Prisma e PostgreSQL.

## 📚 Documentação da API (Swagger)

A API conta com documentação interativa gerada automaticamente via Swagger.

### Rodando localmente

1. Suba a aplicação em modo desenvolvimento:

   ```bash
   npm run start:dev
   ```

2. Acesse a documentação no navegador:

   ```
   http://localhost:3001/docs
   ```

### Rodando com Docker

1. Suba os containers:

   ```bash
   docker compose up --build
   ```

2. Acesse a documentação no navegador:

   ```
   http://localhost:3001/docs
   ```

## 🔐 Testando rotas autenticadas

Algumas rotas exigem autenticação via JWT (identificadas pelo ícone de cadeado na UI do Swagger). Para testá-las:

1. Faça login pela rota `POST /auth/login` com um e-mail e senha válidos.
2. Copie o `access_token` retornado na resposta.
3. No topo da página do Swagger, clique no botão **Authorize**.
4. Cole o token no campo (sem precisar do prefixo `Bearer`, o Swagger adiciona automaticamente).
5. Clique em **Authorize** e depois em **Close**.
6. Agora as rotas protegidas podem ser testadas normalmente pela interface.

## 📋 Principais grupos de rotas

| Tag | Descrição |
|-----|-----------|
| `auth` | Login, verificação de e-mail, OAuth com Google, perfil do usuário autenticado |
| `users` | CRUD de usuários (criação, listagem, atualização, remoção) |

## ⚙️ Variáveis de ambiente relevantes

Certifique-se de que o arquivo `.env` está configurado com as variáveis necessárias (banco de dados, JWT, Google OAuth, Resend, etc.) antes de subir a aplicação.