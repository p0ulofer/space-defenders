"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SpaceBackground from "@/components/SpaceBackground";
import { authService } from "@/utils/authService";

export default function PlaySelection() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push("/auth");
    } else {
      setIsAuthenticated(true);
      // Busca o leaderboard do backend
      authService
        .getLeaderboard()
        .then((data) => {
          setLeaderboard(data);
          setIsLoadingLeaderboard(false);
        })
        .catch((err) => {
          console.error(err);
          setLeaderboardError(true);
          setIsLoadingLeaderboard(false);
        });
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="relative min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-black font-pixel text-[#65c5de] text-xs">
        <SpaceBackground />
        <span className="relative z-10 animate-pulse">VERIFICANDO CREDENCIAIS...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-black p-4">
      {/* Background Starfield Canvas Component */}
      <SpaceBackground />

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 max-w-3xl w-full text-center">
        {/* Game Logo (Smaller size than menu) */}
        <div className="mb-10 select-none hover:scale-105 transition-transform duration-300 w-full max-w-[480px]">
          <Image
            src="/logo.webp"
            alt="Space Defenders Logo"
            width={480}
            height={240}
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            style={{ width: "100%", height: "auto" }}
            className="drop-shadow-[0_0_15px_rgba(101,197,222,0.5)]"
          />
        </div>

        {/* Selection Cards Container */}
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-8 w-full max-w-2xl justify-center mb-8">
          {/* PLAY SOLO CARD */}
          <Link href="/play/solo" className="flex-1 flex">
            <span
              className="flex flex-col w-full text-left bg-black/60 border-4 border-[#65c5de] hover:border-white rounded-md p-6 shadow-[0_0_15px_rgba(101,197,222,0.2)] hover:shadow-[0_0_25px_rgba(101,197,222,0.5)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
            >
              <span className="block text-[#65c5de] group-hover:text-white text-base mb-3 font-pixel tracking-wider">
                PLAY SOLO
              </span>
              <span className="block text-zinc-400 group-hover:text-zinc-200 text-[10px] leading-relaxed font-pixel uppercase">
                DEFENDA O ESPAÇO SOZINHO. ACUMULE PONTOS E ESTABELEÇA SEU RECORD NO RECORD BOARD LOCAL.
              </span>
            </span>
          </Link>

          {/* MULTIPLAYER CARD */}
          <Link href="/play/multiplayer" className="flex-1 flex">
            <span
              className="flex flex-col w-full text-left bg-black/60 border-4 border-[#65c5de] hover:border-white rounded-md p-6 shadow-[0_0_15px_rgba(101,197,222,0.2)] hover:shadow-[0_0_25px_rgba(101,197,222,0.5)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
            >
              <span className="block text-[#65c5de] group-hover:text-white text-base mb-3 font-pixel tracking-wider">
                MULTIPLAYER
              </span>
              <span className="block text-zinc-400 group-hover:text-zinc-200 text-[10px] leading-relaxed font-pixel uppercase">
                JOGUE EM DUPLA COOPERATIVA ONLINE. ENFRENTE VAGAS DE ALIENS JUNTO COM OUTRO JOGADOR EM TEMPO REAL.
              </span>
            </span>
          </Link>
        </div>

        {/* LEADERBOARD CARD */}
        <div className="w-full max-w-2xl bg-black/80 border-4 border-[#2d8fb4] rounded-md p-5 sm:p-6 mb-8 shadow-[0_0_20px_rgba(45,143,180,0.3)]">
          <h3 className="text-[#65c5de] text-[10px] sm:text-xs font-pixel tracking-widest uppercase mb-4 text-center">
             CLASSIFICAÇÃO DOS PILOTOS (TOP 5) 
          </h3>
          {isLoadingLeaderboard ? (
            <div className="text-zinc-500 font-pixel text-[8px] sm:text-[9px] text-center animate-pulse uppercase py-2">
              Buscando dados no painel galáctico...
            </div>
          ) : leaderboardError ? (
            <div className="text-red-500 font-pixel text-[8px] sm:text-[9px] text-center uppercase py-2">
              Erro de comunicação com o painel de pontuações.
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-zinc-500 font-pixel text-[8px] sm:text-[9px] text-center uppercase py-2">
              Nenhuma pontuação registrada neste setor galáctico.
            </div>
          ) : (
            <div className="flex flex-col gap-2 font-pixel text-[8px] sm:text-[9px]">
              {leaderboard.slice(0, 5).map((item: any, index: number) => (
                <div key={item.id} className="flex justify-between items-center border-b border-[#2d8fb4]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-600" : "text-zinc-500"}>
                      #{index + 1}
                    </span>
                    <span className="text-white uppercase truncate max-w-[120px] sm:max-w-[200px]">
                      {item.user?.name || "ANÔNIMO"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500 text-[6px] sm:text-[8px]">WAVE {item.wave}</span>
                    <span className="text-[#65c5de]">{item.score.toString().padStart(6, "0")} PTS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BACK BUTTON */}
        <div className="w-72">
          <Link href="/" className="w-full">
            <span
              className="block w-full text-white bg-[#65c5de] border-b-6 border-r-6 border-[#2d8fb4] hover:bg-[#4bb7d3] active:border-b-2 active:border-r-2 active:translate-y-[4px] active:translate-x-[2px] py-4 px-6 text-sm tracking-widest transition-all duration-100 font-pixel uppercase cursor-pointer rounded-sm shadow-md"
            >
              VOLTAR
            </span>
          </Link>
        </div>
      </main>

      {/* Bottom overlay for retro grid feel */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />
    </div>
  );
}
