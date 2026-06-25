"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SpaceBackground from "@/components/SpaceBackground";
import { authService } from "@/utils/authService";
import { io, Socket } from "socket.io-client";

// ── Types ──

interface PlayerSnapshot {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lives: number;
  score: number;
  invincible: number;
  frame: number;
}

interface EnemySnapshot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  frame: number;
  group: "left" | "right";
}

interface BulletSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isPlayerBullet: boolean;
  ownerId: string;
}

interface GameSnapshot {
  players: PlayerSnapshot[];
  enemies: EnemySnapshot[];
  bullets: BulletSnapshot[];
  wave: number;
  status: "waiting" | "playing" | "gameover";
}

interface Particle {       
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

// ── Constants ──
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GAME_SERVER_URL = "http://192.168.1.206:4000";

// Helper helper client-side explosion spawner
function createExplosion(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      alpha: 1.0,
      size: 2 + Math.random() * 3,
    });
  }
  return particles;
}

export default function MultiplayerPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const playerIdRef = useRef<string>("");
  const roomIdRef = useRef<string>("");
  const snapshotRef = useRef<GameSnapshot | null>(null);
  const prevSnapshotRef = useRef<GameSnapshot | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const inputLoopRef = useRef<number | null>(null);

  const [status, setStatus] = useState<"connecting" | "waiting" | "playing" | "gameover" | "error">("connecting");
  const [showMenu, setShowMenu] = useState(false);
  const [wave, setWave] = useState(1);
  const [myScore, setMyScore] = useState(0);
  const [myLives, setMyLives] = useState(3);
  const [playerCount, setPlayerCount] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const enemyImgRef = useRef<HTMLImageElement | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 1024 ||
        ("ontouchstart" in window) ||
        navigator.maxTouchPoints > 0
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMoveLeftStart = () => {
    keysRef.current["ArrowLeft"] = true;
  };
  const handleMoveLeftEnd = () => {
    keysRef.current["ArrowLeft"] = false;
  };
  const handleMoveRightStart = () => {
    keysRef.current["ArrowRight"] = true;
  };
  const handleMoveRightEnd = () => {
    keysRef.current["ArrowRight"] = false;
  };
  const handleShootStart = () => {
    keysRef.current[" "] = true;
  };
  const handleShootEnd = () => {
    keysRef.current[" "] = false;
  };

  // ── Load sprites ──
  useEffect(() => {
    const playerImg = new Image();
    playerImg.src = "/player_spritesheet.png";
    const enemyImg = new Image();
    enemyImg.src = "/enemy_spritesheet.png";

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === 2) {
        playerImgRef.current = playerImg;
        enemyImgRef.current = enemyImg;
        setImagesLoaded(true);
      }
    };
    playerImg.onload = onLoad;
    enemyImg.onload = onLoad;
  }, []);

  // ── Auth check ──
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    playerIdRef.current = user.id?.toString() || Math.random().toString(36).substring(2, 12);
  }, [router]);

  // ── Socket connection ──
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const socket = io(GAME_SERVER_URL, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to game server");
      socket.emit("game:join", {
        playerId: playerIdRef.current,
        name: user.name || "PILOTO",
      });
    });

    socket.on("game:joined", (data: { roomId: string }) => {
      roomIdRef.current = data.roomId;
      setStatus("waiting");
    });

    socket.on("game:snapshot", (snapshot: GameSnapshot) => {
      // ── Process client-side visual particles based on snapshot diffing ──
      if (snapshotRef.current) {
        prevSnapshotRef.current = snapshotRef.current;

        // 1. Aliens destroyed check
        const prevEnemies = prevSnapshotRef.current.enemies || [];
        const currEnemies = snapshot.enemies || [];
        for (const prevEnemy of prevEnemies) {
          const stillExists = currEnemies.some(
            (currEnemy) => currEnemy.id === prevEnemy.id
          );
          if (!stillExists) {
            particlesRef.current.push(
              ...createExplosion(
                prevEnemy.x + prevEnemy.width / 2,
                prevEnemy.y + prevEnemy.height / 2,
                "#65c5de"
              )
            );
          }
        }

        // 2. Players hit/damaged check
        const prevPlayers = prevSnapshotRef.current.players || [];
        for (const currPlayer of snapshot.players) {
          const prevPlayer = prevPlayers.find((p) => p.id === currPlayer.id);
          if (prevPlayer && currPlayer.lives < prevPlayer.lives) {
            particlesRef.current.push(
              ...createExplosion(
                currPlayer.x + currPlayer.width / 2,
                currPlayer.y + currPlayer.height / 2,
                "#ff4d4d"
              )
            );
          }
        }
      }

      snapshotRef.current = snapshot;

      // Update React state for HUD
      setWave(snapshot.wave);
      setPlayerCount(snapshot.players.length);

      if (snapshot.status === "playing") {
        setStatus("playing");
      } else if (snapshot.status === "gameover") {
        setStatus("gameover");
      }

      // Find my player in snapshot
      const me = snapshot.players.find((p) => p.id === playerIdRef.current);
      if (me) {
        setMyScore(me.score);
        setMyLives(me.lives);
      }
    });

    socket.on("game:error", (err: { message: string }) => {
      console.error("Game error:", err.message);
      setStatus("error");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from game server");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── Keyboard input ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        if (status === "playing") {
          setShowMenu((prev) => !prev);
        }
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "A", "d", "D"].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [status]);

  // ── Input send loop (60Hz) ──
  useEffect(() => {
    const sendInputs = () => {
      const socket = socketRef.current;
      if (!socket || status !== "playing") {
        inputLoopRef.current = requestAnimationFrame(sendInputs);
        return;
      }

      const keys = keysRef.current;
      const roomId = roomIdRef.current;
      const playerId = playerIdRef.current;

      if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        socket.emit("game:input", { roomId, playerId, input: { type: "move", direction: -1 } });
      }
      if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        socket.emit("game:input", { roomId, playerId, input: { type: "move", direction: 1 } });
      }
      if (keys[" "]) {
        socket.emit("game:input", { roomId, playerId, input: { type: "shoot" } });
      }

      inputLoopRef.current = requestAnimationFrame(sendInputs);
    };

    inputLoopRef.current = requestAnimationFrame(sendInputs);
    return () => {
      if (inputLoopRef.current) cancelAnimationFrame(inputLoopRef.current);
    };
  }, [status]);

  // ── Canvas rendering loop ──
  useEffect(() => {
    if (!imagesLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    let animFrameId: number;

    const render = () => {
      const snapshot = snapshotRef.current;

      // Clear
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      if (!snapshot) {
        // Show connecting text
        ctx.fillStyle = "#65c5de";
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.fillText("CONECTANDO AO SERVIDOR...", GAME_WIDTH / 2, GAME_HEIGHT / 2);
        animFrameId = requestAnimationFrame(render);
        return;
      }

      const playerImg = playerImgRef.current;
      const enemyImg = enemyImgRef.current;

      // Draw enemies
      for (const enemy of snapshot.enemies) {
        if (enemyImg) {
          const sx = (enemy.frame ?? 0) * 100;
          const sy = 0;
          const sWidth = 100;
          const sHeight = 100;
          ctx.drawImage(
            enemyImg,
            sx,
            sy,
            sWidth,
            sHeight,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
          );
        } else {
          ctx.fillStyle = "#65c5de";
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
      }

      // Draw players
      for (const player of snapshot.players) {
        const isMe = player.id === playerIdRef.current;
        const isInvincible = player.invincible > 0;

        // Skip rendering dead players
        if (player.lives <= 0) continue;

        // Blinking effect for invincibility
        if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) continue;

        if (playerImg) {
          const sx = (player.frame ?? 0) * 400;
          const sy = 0;
          const sWidth = 400;
          const sHeight = 400;
          ctx.drawImage(
            playerImg,
            sx,
            sy,
            sWidth,
            sHeight,
            player.x,
            player.y,
            player.width,
            player.height
          );
        } else {
          ctx.fillStyle = isMe ? "#00ff88" : "#ffaa00";
          ctx.fillRect(player.x, player.y, player.width, player.height);
        }

        // Player name tag
        ctx.fillStyle = isMe ? "#00ff88" : "#ffcc00";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(player.name, player.x + player.width / 2, player.y - 8);
      }

      // Draw bullets
      for (const bullet of snapshot.bullets) {
        let color = "#ffcc00";
        if (!bullet.isPlayerBullet) {
          color = "#ff4d4d";
        } else {
          color = bullet.ownerId === playerIdRef.current ? "#00ff88" : "#ffcc00";
        }

        const bw = bullet.width || 4;
        const bh = bullet.height || 16;
        const vx = bullet.vx ?? 0;
        const vy = bullet.vy ?? -10;

        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(Math.atan2(vy, vx) + Math.PI / 2);

        ctx.fillStyle = color;
        ctx.fillRect(-bw / 2, -bh / 2, bw, bh);

        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
        ctx.restore();
      }

      // Draw & Update Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02; // decay rate
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
      }

      // Game Over text on canvas
      if (snapshot.status === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "#ff4d4d";
        ctx.font = "32px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
        ctx.fillStyle = "#65c5de";
        ctx.font = "14px monospace";
        ctx.fillText(`WAVE ${snapshot.wave}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
  }, [imagesLoaded]);

  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-black">
      <SpaceBackground />

      {/* Top HUD */}
      <div className="relative z-10 w-full max-w-[800px] px-4 flex justify-between items-center mb-2 font-pixel select-none text-[10px] sm:text-xs">
        <div className="text-zinc-400">
          SCORE: <span className="text-[#65c5de]">{myScore.toString().padStart(6, "0")}</span>
        </div>
        <div className="text-zinc-400 text-center">
          WAVE: <span className="text-white">{wave}</span>
          {" | "}
          <span className="text-[#ffcc00]">JOGADORES: {playerCount}</span>
        </div>
        <div className="text-zinc-400 flex items-center gap-1">
          LIVES:{" "}
          <span className="text-red-500 text-sm flex gap-0.5 leading-none">
            {Array.from({ length: 3 }).map((_, idx) => (
              <span key={idx} className={idx < myLives ? "opacity-100" : "opacity-20"}>
                ♥
              </span>
            ))}
          </span>
          {isMobile && status === "playing" && (
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="ml-2 bg-[#65c5de] hover:bg-[#4bb7d3] border-b-2 border-r-2 border-[#2d8fb4] text-white p-1.5 rounded-sm active:translate-y-[1px] active:translate-x-[1px] active:border-b active:border-r transition-all select-none touch-none flex items-center justify-center"
            >
              {showMenu ? (
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              ) : (
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative z-10 w-full max-w-[800px] aspect-[4/3] border-4 border-[#2d8fb4] bg-black/80 rounded-md overflow-hidden shadow-[0_0_30px_rgba(45,143,180,0.3)]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Loading overlay */}
        {!imagesLoaded && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center font-pixel text-xs text-[#65c5de] select-none">
            CARREGANDO ATIVOS...
          </div>
        )}

        {/* Connecting overlay */}
        {status === "connecting" && imagesLoaded && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center font-pixel text-xs text-[#65c5de] select-none animate-pulse">
            CONECTANDO AO SERVIDOR DE JOGO...
          </div>
        )}

        {/* Waiting for players overlay */}
        {status === "waiting" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center font-pixel text-xs select-none z-20">
            <div className="text-[#65c5de] text-base mb-3 animate-pulse tracking-widest">
              AGUARDANDO JOGADORES...
            </div>
            <div className="text-zinc-400 text-[10px]">
              {playerCount}/2 PILOTOS NA SALA
            </div>
          </div>
        )}

        {/* Exit Menu Overlay (Multiplayer) */}
        {showMenu && status === "playing" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 z-20 animate-fade-in select-none">
            <div className="bg-[#0b0c10]/95 border-4 border-[#65c5de] rounded-md p-8 max-w-sm w-full text-center shadow-[0_0_25px_rgba(101,197,222,0.4)]">
              <h2 className="text-[#65c5de] text-xl mb-4 tracking-widest font-pixel uppercase animate-pulse">
                MENU DE PARTIDA
              </h2>
              
              <p className="text-zinc-400 text-[10px] font-pixel mb-6 uppercase">
                O jogo continua rodando em segundo plano!
              </p>

              <div className="flex flex-col gap-4">
                {/* RESUME BUTTON */}
                <button
                  onClick={() => setShowMenu(false)}
                  className="w-full text-white bg-[#65c5de] border-b-4 border-r-4 border-[#2d8fb4] hover:bg-[#4bb7d3] active:border-b-2 active:border-r-2 active:translate-y-[2px] active:translate-x-[1px] py-3 px-4 text-xs tracking-wider transition-all duration-100 font-pixel uppercase cursor-pointer rounded-sm shadow-md"
                >
                  RETOMAR PARTIDA
                </button>

                {/* VOLTAR MENU BUTTON */}
                <Link href="/play" className="w-full">
                  <span className="block w-full text-white bg-[#ff4d4d] border-b-4 border-r-4 border-[#cc3333] hover:bg-[#ff6666] active:border-b-2 active:border-r-2 active:translate-y-[2px] active:translate-x-[1px] py-3 px-4 text-xs tracking-wider transition-all duration-100 font-pixel uppercase cursor-pointer rounded-sm shadow-md text-center">
                    SAIR PARA O LOBBY
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Game Over overlay */}
        {status === "gameover" && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 z-20 animate-fade-in select-none">
            <div className="bg-[#0b0c10]/90 border-4 border-[#ff4d4d] rounded-md p-8 max-w-sm w-full text-center shadow-[0_0_25px_rgba(255,77,77,0.5)]">
              <h2 className="text-[#ff4d4d] text-xl mb-4 tracking-widest font-pixel uppercase animate-pulse">
                GAME OVER
              </h2>
              <div className="text-zinc-400 text-[10px] font-pixel mb-6 uppercase">
                PONTUAÇÃO FINAL:
                <div className="text-white text-base mt-1 text-[#65c5de]">{myScore}</div>
              </div>

              {/* Scoreboard */}
              {snapshotRef.current && (
                <div className="mb-6">
                  {snapshotRef.current.players.map((p) => (
                    <div key={p.id} className="flex justify-between font-pixel text-[9px] text-zinc-300 mb-1">
                      <span className={p.id === playerIdRef.current ? "text-[#00ff88]" : "text-[#ffcc00]"}>
                        {p.name}
                      </span>
                      <span className="text-[#65c5de]">{p.score} PTS</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <Link href="/play" className="w-full">
                  <span className="block w-full text-white bg-[#65c5de] border-b-4 border-r-4 border-[#2d8fb4] hover:bg-[#4bb7d3] active:border-b-2 active:border-r-2 active:translate-y-[2px] active:translate-x-[1px] py-3 px-4 text-xs tracking-wider transition-all duration-100 font-pixel uppercase cursor-pointer rounded-sm shadow-md">
                    VOLTAR AO LOBBY
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {status === "error" && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 z-20 select-none">
            <div className="bg-[#0b0c10]/90 border-4 border-[#ff4d4d] rounded-md p-8 max-w-sm w-full text-center">
              <h2 className="text-[#ff4d4d] text-lg mb-4 font-pixel uppercase">
                ERRO DE CONEXÃO
              </h2>
              <p className="text-zinc-400 text-[10px] font-pixel mb-6 uppercase">
                NÃO FOI POSSÍVEL CONECTAR AO SERVIDOR DE JOGO.
              </p>
              <Link href="/play" className="w-full">
                <span className="block w-full text-white bg-[#ff4d4d] border-b-4 border-r-4 border-[#cc3333] hover:bg-[#ff6666] py-3 px-4 text-xs tracking-wider transition-all duration-100 font-pixel uppercase cursor-pointer rounded-sm shadow-md">
                  VOLTAR
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Controls help */}
      <div className="relative z-10 mt-3 font-pixel text-[8px] sm:text-[10px] text-zinc-500 uppercase select-none">
        Mover: A/D ou Setas | Atirar: Espaço
      </div>

      {/* Mobile touch controls */}
      {isMobile && (
        <div className="relative z-20 w-full max-w-[800px] flex justify-between items-center px-6 mt-4 select-none">
          {/* Direcionais */}
          <div className="flex gap-4">
            <button
              onTouchStart={handleMoveLeftStart}
              onTouchEnd={handleMoveLeftEnd}
              onMouseDown={handleMoveLeftStart}
              onMouseUp={handleMoveLeftEnd}
              onMouseLeave={handleMoveLeftEnd}
              className="bg-[#65c5de] hover:bg-[#4bb7d3] border-b-4 border-r-4 border-[#2d8fb4] text-white font-pixel text-lg py-3 px-6 active:border-b-2 active:border-r-2 active:translate-y-[2px] active:translate-x-[1px] transition-all duration-100 rounded-sm shadow-md cursor-pointer touch-none"
            >
              ◀
            </button>
            <button
              onTouchStart={handleMoveRightStart}
              onTouchEnd={handleMoveRightEnd}
              onMouseDown={handleMoveRightStart}
              onMouseUp={handleMoveRightEnd}
              onMouseLeave={handleMoveRightEnd}
              className="bg-[#65c5de] hover:bg-[#4bb7d3] border-b-4 border-r-4 border-[#2d8fb4] text-white font-pixel text-lg py-3 px-6 active:border-b-2 active:border-r-2 active:translate-y-[2px] active:translate-x-[1px] transition-all duration-100 rounded-sm shadow-md cursor-pointer touch-none"
            >
              ▶
            </button>
          </div>

          {/* Botão de Tiro */}
          <div>
            <button
              onTouchStart={handleShootStart}
              onTouchEnd={handleShootEnd}
              onMouseDown={handleShootStart}
              onMouseUp={handleShootEnd}
              onMouseLeave={handleShootEnd}
              className="bg-[#65c5de] hover:bg-[#4bb7d3] border-b-4 border-r-4 border-[#2d8fb4] text-white font-pixel text-xs tracking-wider py-4 px-8 active:border-b-2 active:border-r-2 active:translate-y-[2px] active:translate-x-[1px] transition-all duration-100 rounded-sm shadow-md cursor-pointer uppercase touch-none"
            >
              ATIRAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
