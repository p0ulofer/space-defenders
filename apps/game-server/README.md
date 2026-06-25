# 🎮 Space Defenders — Game Server

Servidor de jogo multiplayer em tempo real para o **Space Defenders**, construído com **NestJS** e **Socket.io**. Roda uma física autoritativa no servidor a **60Hz** (60 FPS) para assegurar jogabilidade idêntica ao modo solo.

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)

---

## ⚙️ Instalação

```bash
# Navegue até a pasta do servidor de jogo
cd apps/game-server

# Instale as dependências
npm install
```

---

## ▶️ Executando o Servidor

```bash
# Desenvolvimento (com hot reload)
npm run start:dev

# Compilação (build)
npm run build

# Execução em Produção
node dist/main.js
```

O servidor escuta conexões WebSocket na porta: `http://localhost:4000`

---

## 📡 Protocolo WebSocket (API de Comunicação)

### 📥 Eventos Recebidos (Client -> Server)

#### `game:join`
* **Descrição:** Solicita entrada em uma sala de jogo disponível (máximo 2 players por sala).
* **Payload:**
  ```json
  {
    "playerId": "uuid-do-player",
    "name": "Nome do Piloto"
  }
  ```

#### `game:input`
* **Descrição:** Envia inputs de movimentação ou tiro do jogador para processamento no servidor.
* **Payload:**
  ```json
  {
    "roomId": "room-1",
    "playerId": "uuid-do-player",
    "input": {
      "type": "move", 
      "direction": -1 
    }
  }
  ```
  * `type: "move"`: Modifica a posição X da nave (`direction: -1` para esquerda, `1` para direita).
  * `type: "shoot"`: Instancia uma nova bala vetorizada mirando o alienígena mais próximo (Aimbot autoritativo).

---

### 📤 Eventos Enviados (Server -> Client)

#### `game:joined`
* **Descrição:** Confirmação de entrada na sala.
* **Payload:**
  ```json
  {
    "roomId": "room-1"
  }
  ```

#### `game:snapshot`
* **Descrição:** Broadcast periódico enviado a 60Hz contendo o estado completo do jogo da sala para renderização no canvas.
* **Payload:**
  ```typescript
  {
    "players": [
      {
        "id": "uuid-player-1",
        "name": "Nome",
        "x": 350,
        "y": 500,
        "width": 64,
        "height": 64,
        "lives": 3,
        "score": 1200,
        "shootCooldown": 0,
        "invincible": 0,
        "frame": 0,
        "animCounter": 4
      }
    ],
    "enemies": [
      {
        "id": "enemy-1-0",
        "x": 100,
        "y": 80,
        "width": 56,
        "height": 56,
        "frame": 1,
        "group": "left"
      }
    ],
    "bullets": [
      {
        "x": 378,
        "y": 480,
        "width": 4,
        "height": 16,
        "vx": 0.8,
        "vy": -14.5,
        "isPlayerBullet": true,
        "ownerId": "uuid-player-1"
      }
    ],
    "wave": 2,
    "status": "playing" // "waiting" | "playing" | "gameover"
  }
  ```

#### `game:error`
* **Descrição:** Notifica erros no lobby (sala cheia, etc.).

---

## 🛠️ Arquitetura e Lógica Interna

* **`game.gateway.ts`:** Escuta e roteia conexões, desconexões e mensagens para suas respectivas salas de jogo (`GameRoom`).
* **`game-room.ts` (`GameRoom`):** Contém a máquina de estados autoritativa do jogo:
  * Loop de física a 60Hz (`setInterval` executando a cada ~16.6ms).
  * Lógica de spawn de aliens em dois blocos (`left` e `right`) que se movem de forma oposta.
  * Colisões de grupos de aliens e bouncing lateral em paredes.
  * Algoritmo de Aimbot: O tiro do jogador busca o alien mais próximo no plano 2D, calculando o vetor direcional `vx` e `vy`.
  * Detecção de colisão AABB (caixas delimitadoras reais).
  * Limites inferiores de Game Over.
