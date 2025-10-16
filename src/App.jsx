import React, { useState, useRef } from "react";
import { Conversation } from "@elevenlabs/client";

export default function App() {
  const [conn, setConn] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const BACKEND = import.meta.env.VITE_CONVERSATION_BACKEND;
  const AGENT_ID = import.meta.env.VITE_AGENT_ID;

  const startCall = async () => {
    setConnecting(true);
    setError(null);
    try {
      const resp = await fetch(
        `${BACKEND}/api/get-conversation-token?agent_id=${AGENT_ID}`
      );
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Error al pedir token");
      }
      const { token } = await resp.json();

      // Crear conversación WebRTC
      const conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        conversationToken: token,
      });

      // 🔊 Conectar audio entrante
      conversation.addEventListener("track", (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.stream;
        }
      });

      setConn(conversation);
      console.log("✅ WebRTC conectado");
    } catch (err) {
      console.error("❌ Error al conectar WebRTC:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setConnecting(false);
    }
  };

  const endCall = async () => {
    try {
      if (conn) {
        await conn.close();
        setConn(null);
        console.log("🛑 Llamada finalizada por el usuario");
      }
    } catch (err) {
      console.error("Error finalizando llamada:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-3 tracking-wide text-emerald-400">
        🎧 Mozart WebRTC (ElevenLabs Agent)
      </h1>
      <p className="text-gray-400 mb-6 text-center">
        Asistente conversacional con voz en tiempo real.
      </p>

      <audio ref={audioRef} autoPlay playsInline />

      {/* Estado visual */}
      {!conn ? (
        <button
          onClick={startCall}
          disabled={connecting}
          className={`px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-all duration-300 ${
            connecting
              ? "bg-gray-600 cursor-not-allowed animate-pulse"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {connecting ? "Conectando…" : "Iniciar conversación"}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="animate-pulse text-emerald-400 text-lg font-semibold">
            🟢 Conectado con Mozart
          </div>

          {/* Micrófono animado simple */}
          <div className="w-20 h-20 rounded-full bg-emerald-500 animate-pulse shadow-lg flex items-center justify-center text-3xl">
            🎙️
          </div>

          <button
            onClick={endCall}
            className="px-8 py-4 rounded-full font-semibold text-lg bg-rose-600 hover:bg-rose-700 shadow-lg transition-all duration-300"
          >
            Finalizar llamada
          </button>
        </div>
      )}

      {error && (
        <p className="mt-6 text-rose-400 bg-rose-950/40 px-4 py-2 rounded-lg text-sm">
          ⚠️ Error: {error}
        </p>
      )}

      <footer className="absolute bottom-4 text-xs text-gray-500">
        Mozart AI © {new Date().getFullYear()} — ElevenLabs WebRTC
      </footer>
    </div>
  );
}









