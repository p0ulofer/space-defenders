"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SpaceBackground from "@/components/SpaceBackground";
import { authService } from "@/utils/authService";

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(false); // Padrão: Cadastro (Registro) conforme solicitado
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      if (isLoginMode) {
        // Fluxo de Login
        await authService.login(email, password);
        setSuccessMsg("ACESSO AUTORIZADO! INICIANDO...");
        setTimeout(() => {
          router.push("/play");
        }, 1000);
      } else {
        // Fluxo de Cadastro + Auto-login
        if (name.trim().length < 3) {
          throw new Error("O nome deve ter pelo menos 3 caracteres.");
        }
        await authService.register(name, email, password);
        setSuccessMsg("PILOTO CADASTRADO! INICIANDO...");
        setTimeout(() => {
          router.push("/play");
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro inesperado.");
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setErrorMsg("");
    setSuccessMsg("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="relative min-h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-black p-4">
      {/* Background Starfield Canvas Component */}
      <SpaceBackground />

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-black/90 border-4 border-[#65c5de] rounded-md p-6 sm:p-8 shadow-[0_0_30px_rgba(101,197,222,0.3)] relative z-10 select-none flex flex-col md:flex-row items-center gap-8 md:gap-12">
        
        {/* Left Section: Logo & Info */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-6 select-none hover:scale-105 transition-transform duration-300 w-full max-w-[320px] mx-auto">
            <Image
              src="/logo.webp"
              alt="Space Defenders Logo"
              width={320}
              height={160}
              priority
              sizes="(max-width: 640px) 100vw, 320px"
              style={{ width: "100%", height: "auto" }}
              className="drop-shadow-[0_0_15px_rgba(101,197,222,0.5)]"
            />
          </div>
          <h2 className="text-[#65c5de] text-xs sm:text-sm tracking-widest font-pixel uppercase">
            {isLoginMode ? "SISTEMA DE IDENTIFICAÇÃO" : "ALISTAMENTO DE RECRUTA"}
          </h2>
          <p className="text-zinc-500 font-pixel text-[8px] leading-relaxed uppercase mt-4 max-w-xs hidden md:block">
            {isLoginMode
              ? "FORNEÇA SUA ASSINATURA DE CRIPTOGRAFIA PARA ACESSAR OS CONTROLES DE VOO."
              : "INICIE SEU REGISTRO DE CADETE PARA PROTEGER OS SETORES DA ORBITA TERRESTRE."}
          </p>
        </div>

        {/* Right Section: Form */}
        <div className="w-full md:max-w-md flex-1">
          {/* Form */}
          <form onSubmit={handleSubmit} className="text-left">
            
            {/* Name Field (Only in Register mode) */}
            {!isLoginMode && (
              <div className="mb-4">
                <label className="block text-[#65c5de] text-[9px] sm:text-[10px] font-pixel mb-2 uppercase">
                  Nome do Piloto
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EX: STAR-LORD"
                  required
                  disabled={isLoading}
                  className="w-full bg-black/80 border-4 border-[#2d8fb4] focus:border-[#65c5de] outline-none text-white p-3 font-pixel text-[10px] sm:text-xs rounded-sm transition-colors"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-[#65c5de] text-[9px] sm:text-[10px] font-pixel mb-2 uppercase">
                Endereço de E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EX: PILOTO@SPACE.COM"
                required
                disabled={isLoading}
                className="w-full bg-black/80 border-4 border-[#2d8fb4] focus:border-[#65c5de] outline-none text-white p-3 font-pixel text-[10px] sm:text-xs rounded-sm transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label className="block text-[#65c5de] text-[9px] sm:text-[10px] font-pixel mb-2 uppercase">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                required
                disabled={isLoading}
                className="w-full bg-black/80 border-4 border-[#2d8fb4] focus:border-[#65c5de] outline-none text-white p-3 font-pixel text-[10px] sm:text-xs rounded-sm transition-colors"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/80 border-2 border-red-500 text-red-400 font-pixel text-[8px] sm:text-[9px] leading-relaxed uppercase rounded-sm">
                ALERTA: {errorMsg}
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 bg-cyan-950/80 border-2 border-[#65c5de] text-[#65c5de] font-pixel text-[8px] sm:text-[9px] leading-relaxed uppercase rounded-sm">
                SISTEMA: {successMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white bg-[#65c5de] border-b-6 border-r-6 border-[#2d8fb4] hover:bg-[#4bb7d3] active:border-b-2 active:border-r-2 active:translate-y-[4px] active:translate-x-[2px] disabled:opacity-50 disabled:cursor-not-allowed py-4 px-6 text-xs sm:text-sm tracking-widest transition-all duration-100 font-pixel uppercase cursor-pointer rounded-sm shadow-md"
            >
              {isLoading ? "PROCESSANDO..." : isLoginMode ? "DECOLAR" : "CADASTRAR E JOGAR"}
            </button>
          </form>

          {/* Toggle Mode Link */}
          <div className="mt-6 text-[9px] sm:text-[10px] font-pixel text-zinc-500 uppercase text-center md:text-left">
            {isLoginMode ? (
              <>
                Novo piloto por aqui?{" "}
                <button
                  onClick={toggleMode}
                  disabled={isLoading}
                  className="text-[#65c5de] hover:underline cursor-pointer focus:outline-none"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já possui registro?{" "}
                <button
                  onClick={toggleMode}
                  disabled={isLoading}
                  className="text-[#65c5de] hover:underline cursor-pointer focus:outline-none"
                >
                  Entrar
                </button>
              </>
            )}
          </div>

          {/* Back Link */}
          <div className="mt-4 text-center md:text-left">
            <Link
              href="/"
              className="inline-block text-[8px] sm:text-[9px] font-pixel text-zinc-600 hover:text-zinc-400 uppercase tracking-widest"
            >
              &lt; VOLTAR AO MENU
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom overlay for retro grid feel */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />
    </div>
  );
}
