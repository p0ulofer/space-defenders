# 🚀 Space Defenders — Auth Service

API de autenticação do projeto Space Defenders, construída com **NestJS**, **Prisma** e **JWT**. Suporta login local e OAuth (Google, GitHub, Facebook).

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) (recomendado para o banco)

---

## ⚙️ Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/space-defenders.git
cd space-defenders/apps/auth

# Instale as dependências
npm install
```

---

## 🔑 Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.example .env
```

> Veja o `.env.example` para descrição de cada variável.

---

## 🗄️ Banco de Dados

### Subindo o MySQL com Docker

```bash
docker run --name space-defenders-db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=space_defenders \
  -p 3306:3306 \
  -d mysql:8
```

### Rodando as migrations

```bash
npx prisma migrate dev
```

### Visualizando o banco (Prisma Studio)

```bash
npx prisma studio
```

Abre em `http://localhost:5555` — interface visual para inspecionar e editar dados diretamente.

---

## 🌱 Seeds

### Rodando a seed (cria usuário Admin padrão)

```bash
npx prisma db seed
```

As credenciais do admin são definidas no `.env`:

| Campo | Variável |
|-------|----------|
| E-mail | `ADMIN_EMAIL` |
| Senha | `ADMIN_PASSWORD` |
| Role | `ADMIN` (fixo) |

Exemplo com os valores padrão do `.env.example`:

| Campo | Valor |
|-------|-------|
| E-mail | `admin@spacedefenders.com` |
| Senha | `12345678` |
| Role | `ADMIN` |

> Após rodar a seed, faça login com essas credenciais para obter um token com `role: ADMIN`.

---

## ▶️ Rodando o Serviço

```bash
# Desenvolvimento (com hot reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

O serviço sobe em: `http://localhost:3001`

---

## 📡 Rotas da API

### Autenticação

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `POST` | `/auth/login` | Público | Login com e-mail e senha |
| `GET` | `/auth/me` | JWT | Retorna o usuário autenticado |
| `GET` | `/auth/google` | Público | Login com Google |
| `GET` | `/auth/github` | Público | Login com GitHub |
| `GET` | `/auth/facebook` | Público | Login com Facebook |

#### Exemplo de login local

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@spacedefenders.com", "password": "12345678"}'
```

Resposta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-aqui",
    "email": "admin@spacedefenders.com",
    "name": "Admin",
    "role": "ADMIN"
  }
}
```

### Usuários

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `POST` | `/users` | Público | Cria novo usuário |
| `GET` | `/users` | JWT + ADMIN | Lista todos os usuários |
| `GET` | `/users/:id` | JWT + próprio ou ADMIN | Busca usuário por ID |
| `PATCH` | `/users/:id` | JWT + próprio ou ADMIN | Atualiza usuário |
| `DELETE` | `/users/:id` | JWT + ADMIN | Remove usuário |

### Pontuações e Leaderboard

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `POST` | `/scores` | JWT | Grava/salva o recorde do usuário autenticado |
| `GET` | `/scores/leaderboard` | Público | Retorna o Top 10 das pontuações gerais |
| `GET` | `/scores/me` | JWT | Retorna o histórico de scores do próprio usuário |

#### Exemplo de envio de pontuação (POST /scores)

```bash
curl -X POST http://localhost:3001/scores \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"score": 5600, "wave": 4}'
```

#### Usando o token nas requisições

```bash
curl http://localhost:3001/users \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔐 Autenticação e Autorização

O serviço usa **JWT Bearer Token** para autenticação e um sistema de **roles** para autorização.

### Roles disponíveis

| Role | Descrição |
|------|-----------|
| `USER` | Usuário padrão — acessa apenas o próprio perfil |
| `ADMIN` | Administrador — acesso total |

### Como funciona

1. O usuário faz login em `POST /auth/login` e recebe um `access_token`
2. O token deve ser enviado no header `Authorization: Bearer <token>` em todas as rotas protegidas
3. O `JwtAuthGuard` valida o token e popula `request.user`
4. O `RolesGuard` verifica se a role do usuário tem permissão para acessar a rota

### Inspecionando o token JWT

Cole o `access_token` em [jwt.io](https://jwt.io) para inspecionar o payload:

```json
{
  "sub": "uuid-do-usuario",
  "email": "admin@spacedefenders.com",
  "name": "Admin",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## 🔗 OAuth (Google, GitHub, Facebook)

Para habilitar o login social, preencha as variáveis no `.env`:

### Google
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto e ative a **Google+ API**
3. Em **Credenciais**, crie um **OAuth 2.0 Client ID**
4. Adicione `http://localhost:3001/auth/google/callback` como URI de redirecionamento

### GitHub
1. Acesse [github.com/settings/developers](https://github.com/settings/developers)
2. Clique em **New OAuth App**
3. Defina a **Authorization callback URL** como `http://localhost:3001/auth/github/callback`

### Facebook
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um app e adicione o produto **Facebook Login**
3. Configure a **URI de redirecionamento OAuth válida** como `http://localhost:3001/auth/facebook/callback`

---

## 🛠️ Estrutura do Projeto

```
apps/auth/src/
├── auth/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts     # Valida o token JWT
│   │   └── roles.guard.ts        # Verifica permissões por role
│   ├── decorators/
│   │   └── roles.decorator.ts    # @Roles(Role.ADMIN)
│   ├── jwt.strategy.ts           # Extrai e valida o payload do JWT
│   ├── auth.service.ts           # Lógica de login e validação
│   └── auth.controller.ts        # Rotas /auth
├── users/
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── users.service.ts          # CRUD de usuários
│   └── users.controller.ts       # Rotas /users
├── prisma/
│   ├── migrations/
│   ├── seed/                     # Seeds do banco
│   └── schema.prisma
└── app.module.ts
```

---

## 🐛 Troubleshooting

**`403 Forbidden` no `GET /users`**
- Confirme que o usuário no banco tem `role: ADMIN` (via Prisma Studio)
- Faça logout e login novamente — o token antigo não atualiza automaticamente
- Inspecione o token em [jwt.io](https://jwt.io) e verifique o campo `role`

**`404` no `GET /users/:id`**
- Confirme que o ID passado na URL existe no banco (`npx prisma studio`)
- O ID deve ser o UUID salvo no banco

**`TypeError: Cannot read properties of undefined (reading 'role')`**
- O `JwtAuthGuard` deve sempre vir antes do `RolesGuard`: `@UseGuards(JwtAuthGuard, RolesGuard)`
- Não registre o `RolesGuard` como `APP_GUARD` global sem também registrar o `JwtAuthGuard` antes

---

## 📦 Tecnologias

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [MySQL 8](https://www.mysql.com/)
- [JWT (jsonwebtoken)](https://jwt.io/)
- [Passport.js](http://www.passportjs.org/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)