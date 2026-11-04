import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Send, CheckCircle } from 'lucide-react';
import type { FixaState } from '../types/fixa';
import { playCommandBlip, playJarvisChime } from '../utils/audioFX';

interface VoiceHUDProps {
  state: FixaState;
  onStateChange: (state: FixaState) => void;
  onVoiceCommand: (text: string) => void;
  voiceFeedback?: string;
  isMuted?: boolean;
  onToggleMute?: () => void;
  latestAnswer?: { question: string; answer: string; spoken: string } | null;
}

export const VoiceHUD: React.FC<VoiceHUDProps> = ({
  state,
  onStateChange,
  onVoiceCommand,
  voiceFeedback = "FIXA Systems fully operational. Ready for voice or text prompt, Boss.",
  isMuted = false,
  onToggleMute,
  latestAnswer,
}) => {
  const [inputText, setInputText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Single ultra-fast hardware-accelerated canvas visualizer (no React re-renders)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const drawVisualizer = () => {
      t += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const color = state === 'speaking' 
        ? '#38bdf8' 
        : state === 'listening' 
        ? '#06b6d4' 
        : state === 'alert'
        ? '#f43f5e'
        : '#0284c7';

      // 1. Oscilloscope wave line
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = color;
      ctx.beginPath();
      const midY = canvas.height / 2;
      const step = 4;

      for (let x = 0; x <= canvas.width; x += step) {
        let amp = 2.5;
        if (state === 'listening') amp = 9;
        else if (state === 'speaking') amp = 12;
        else if (state === 'analyzing') amp = 6;

        const y = midY + Math.sin(t + (x / 14)) * amp * Math.cos(t * 0.4 + (x / 30));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. High-speed audio equalizer bars (right-side mini bars)
      const numBars = 16;
      const barW = 2.5;
      const startX = canvas.width - (numBars * 4) - 4;
      ctx.fillStyle = color;

      for (let i = 0; i < numBars; i++) {
        let barH = 4;
        if (state === 'speaking') {
          barH = 6 + Math.abs(Math.sin(t * 2 + i * 0.8)) * 20;
        } else if (state === 'listening') {
          barH = 5 + Math.abs(Math.sin(t * 1.5 + i * 0.5)) * 16;
        } else {
          barH = 3 + Math.abs(Math.sin(t * 0.5 + i * 0.3)) * 6;
        }
        const bx = startX + i * 4;
        const by = canvas.height - barH - 2;
        ctx.fillRect(bx, by, barW, barH);
      }

      animId = requestAnimationFrame(drawVisualizer);
    };

    drawVisualizer();
    return () => cancelAnimationFrame(animId);
  }, [state]);

  const handleStartMic = () => {
    playJarvisChime();
    onStateChange('listening');
    // Simulated or real web speech recognition trigger
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.lang = 'en-US';
          rec.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            onVoiceCommand(transcript);
          };
          rec.onerror = () => {
            onStateChange('idle');
          };
          rec.onend = () => {
            if (state === 'listening') onStateChange('idle');
          };
          rec.start();
          return;
        } catch (e) {
          // fallback
        }
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    playCommandBlip();
    const cmd = inputText.trim();
    setInputText('');
    onVoiceCommand(cmd);
  };

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col gap-3">
      {/* Waveform & Voice State Status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-cyan-900/40 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <button
              onClick={handleStartMic}
              className={`p-3 rounded-full transition-all duration-300 relative ${
                state === 'listening'
                  ? 'bg-cyan-500 text-black glow-cyan scale-110 animate-pulse'
                  : 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-200'
              }`}
              title="Click to speak (Voice Recognition)"
            >
              {state === 'listening' ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              {state === 'listening' && (
                <span className="absolute -inset-1 rounded-full border border-cyan-400 animate-ping opacity-75" />
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-tech text-xs tracking-wider text-cyan-400 font-semibold uppercase">
                {state === 'listening' ? 'LISTENING TO USER...' : state === 'speaking' ? 'FIXA VOCALIZING...' : state === 'analyzing' ? 'NEURAL ENGINE REASONING...' : 'STANDBY READY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono-code truncate max-w-[280px] sm:max-w-[420px]">
              {voiceFeedback}
            </p>
          </div>
        </div>

        {/* Audio Visualizer Bars & Canvas */}
        <div className="flex items-center gap-3">
          <canvas
            ref={canvasRef}
            width={160}
            height={36}
            className="rounded bg-black/40 border border-cyan-950 shadow-inner"
          />

          {/* Test Sweet Female Voice Button */}
          <button
            type="button"
            onClick={() => {
              playJarvisChime();
              onVoiceCommand("test_female_voice");
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-950/60 border border-pink-500/40 text-pink-300 hover:bg-pink-900/50 hover:text-pink-100 text-xs font-tech transition-all shadow-[0_0_12px_rgba(244,114,182,0.25)]"
            title="Listen to Sweet Female Voice"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Awaaz Suniye 🌸</span>
          </button>

          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-400 border border-cyan-800/40 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Voice Prompt & Direct Text Command Input */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Speak or type command (e.g. 'YouTube chalao', 'Summarize quantum mechanics', 'Screen calls')..."
            className="w-full bg-slate-900/90 border border-cyan-700/40 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-cyan-100 placeholder-slate-500 font-tech focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
          />
          <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-slate-500 text-xs font-mono-code">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI CORE</span>
          </div>
        </div>

        <button
          type="submit"
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-tech font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>EXECUTE</span>
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Direct Accurate Answer Display Card */}
      {latestAnswer && (
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-tech text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                FIXA DIRECT ACCURATE ANSWER (सटीक उत्तर)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onVoiceCommand(`speak_answer:${latestAnswer.spoken}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[11px] font-tech border border-emerald-700/50 transition-colors"
              title="Awaaz sunein"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Awaaz Me Sunayein 🌸</span>
            </button>
          </div>

          <div className="text-xs font-tech text-slate-300 flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold">Question:</span>
            <span className="italic text-cyan-200">"{latestAnswer.question}"</span>
          </div>

          <div className="p-3 rounded-lg bg-black/60 border border-emerald-950/80 text-xs font-mono-code text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
            {latestAnswer.answer}
          </div>
        </div>
      )}
    </div>
  );
};
