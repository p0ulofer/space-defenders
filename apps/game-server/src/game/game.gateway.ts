import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoom } from './game-room';

let roomCounter = 0;

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly rooms: Map<string, GameRoom> = new Map();
  private server: Server;

  // Mapeia socket.id → { roomId, playerId }
  private readonly socketMap: Map<
    string,
    { roomId: string; playerId: string }
  > = new Map();

  afterInit(server: Server) {
    this.server = server;
    console.log('🎮 GameGateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);

    const mapping = this.socketMap.get(client.id);
    if (mapping) {
      const room = this.rooms.get(mapping.roomId);
      if (room) {
        room.removePlayer(mapping.playerId);
        console.log(
          `🚪 Player ${mapping.playerId} removed from room ${mapping.roomId}`,
        );

        // Se a sala ficou vazia, destruir
        if (room.playerCount === 0) {
          room.stop();
          this.rooms.delete(mapping.roomId);
          console.log(`🗑️ Room ${mapping.roomId} destroyed (empty)`);
        }
      }
      this.socketMap.delete(client.id);
    }
  }

  @SubscribeMessage('game:join')
  handleJoin(
    @MessageBody()
    data: { roomId?: string; playerId: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    let roomId = data.roomId;

    // Encontrar ou criar sala disponível
    if (!roomId || !this.rooms.has(roomId)) {
      roomId = this.findOrCreateAvailableRoom();
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('game:error', { message: 'Sala não encontrada' });
      return;
    }

    // Entrar na sala do Socket.io
    client.join(roomId);

    // Adicionar jogador na lógica de jogo
    const added = room.addPlayer(data.playerId, data.name);
    if (!added) {
      client.emit('game:error', { message: 'Sala cheia' });
      return;
    }

    // Mapear socket → player/room
    this.socketMap.set(client.id, {
      roomId,
      playerId: data.playerId,
    });

    client.emit('game:joined', { roomId });
    console.log(
      `✅ Player "${data.name}" (${data.playerId}) joined room ${roomId} (${room.playerCount}/2)`,
    );
  }

  @SubscribeMessage('game:input')
  handleInput(
    @MessageBody()
    data: {
      roomId: string;
      playerId: string;
      input: { type: string; direction?: number };
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Se o roomId não foi enviado, buscar pelo mapeamento
    let roomId = data.roomId;
    if (!roomId) {
      const mapping = this.socketMap.get(client.id);
      if (mapping) roomId = mapping.roomId;
    }

    const room = this.rooms.get(roomId);
    if (!room) return;
    room.handleInput(data.playerId, data.input);
  }

  // Encontra sala disponível ou cria uma nova
  private findOrCreateAvailableRoom(): string {
    // Procurar sala existente com espaço
    for (const [id, room] of this.rooms.entries()) {
      if (room.playerCount < 2) {
        return id;
      }
    }

    // Criar nova sala
    roomCounter++;
    const newId = `room-${roomCounter}`;
    const newRoom = new GameRoom(newId, (event, payload) => {
      this.server.to(newId).emit(event, payload);
    });
    this.rooms.set(newId, newRoom);
    console.log(`🏠 Created new room: ${newId}`);
    return newId;
  }
}
