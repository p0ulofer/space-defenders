# 🌐 Space Defenders — Web Client

Aplicação Web frontend do **Space Defenders**, construída com **Next.js 15**, **React** e **Tailwind CSS**. Contém o painel de classificação (Leaderboard), autenticação retrô e os modos de jogo **Solo** e **Multiplayer Online**.

---

## 📋 Funcionalidades

* **Autenticação Retrô:** Cadastro e Login em tela unificada inspirada em fliperamas antigos, com redirecionamento automático pós-cadastro.
* **Modo Solo:** Jogo rodando localmente no navegador por meio de um loop de física de alto desempenho a 60 FPS (`requestAnimationFrame`), com gravação de recordes automatizada.
* **Modo Multiplayer:** Conexão instantânea via WebSockets (Socket.io) com lógica autoritativa no servidor a 60Hz. Permite jogar cooperativamente com até 2 jogadores em tempo real.
* **Partículas Físicas Locais:** O cliente renderiza partículas físicas a 60 FPS para efeitos de explosões (quando aliens morrem ou jogadores sofrem dano), poupando banda da rede.
* **Lasers Neon Inclinados (Aimbot Visual):** Balas de ambos os modos de jogo rotacionam de acordo com seu vetor de velocidade para apontar na direção exata do alien alvo, completas com sombras neon neon/brilhantes.
* **Leaderboard Geral:** Placar de líderes consumindo a API de autenticação exibindo o Top 5 geral na tela de seleção.

---

## ⚙️ Instalação

```bash
# Navegue até a pasta web
cd apps/web

# Instale as dependências
npm install
```

---

## ▶️ Executando a Aplicação

```bash
# Executar servidor de desenvolvimento
npm run dev

# Compilar para produção
npm run build
npm run start
```

O aplicativo roda na porta: `http://localhost:3000`

---

## 🗂️ Estrutura do Código (`apps/web/src/`)

```
src/
├── app/
│   ├── auth/page.tsx               # Cadastro e Login Retrô
│   ├── play/
│   │   ├── page.tsx                # Lobby com Leaderboard e seleção de modo
│   │   ├── solo/
│   │   │   ├── page.tsx            # Game loop e canvas do modo Solo
│   │   │   └── engine/             # Física, movimentação e spawner do Solo
│   │   └── multiplayer/
│   │       └── page.tsx            # Cliente multiplayer Socket.io, renderizador e partículas
│   ├── page.tsx                    # Home Lobby/Lançador principal
│   └── layout.tsx
├── components/
│   └── SpaceBackground.tsx         # Fundo animado estrelado parallax
├── utils/
│   └── authService.ts              # Cliente HTTP para API de Auth e Scores
└── index.css                       # Design tokens e fontes retrô/pixeladas
```
