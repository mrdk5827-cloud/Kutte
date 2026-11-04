import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  Cpu, 
  BookOpen, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Share2,
  FileCheck
} from 'lucide-react';
import type { ResearchDossier } from '../types/fixa';
import { playCommandBlip, playJarvisChime } from '../utils/audioFX';

interface ResearchEnginePanelProps {
  onSpeak: (text: string) => void;
}

export const ResearchEnginePanel: React.FC<ResearchEnginePanelProps> = ({ onSpeak }) => {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'concise' | 'comprehensive' | 'deep_technical'>('comprehensive');
  const [loading, setLoading] = useState(false);
  const [currentDossier, setCurrentDossier] = useState<ResearchDossier | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleTopics = [
    "Quantum Error Correction in Neutral Atom Arrays",
    "Autonomous Edge AI Architectures for Android Runtimes",
    "CRISPR-Cas12 vs Cas9 Precision Editing Benchmarks",
    "Room Temperature Superconducting Materials Telemetry",
    "Zero-Knowledge Proofs in Decentralized Identity Verification"
  ];

  const handleResearch = async (selectedTopic?: string) => {
    const query = selectedTopic || topic;
    if (!query.trim() || loading) return;

    playJarvisChime();
    setLoading(true);
    setCurrentDossier({
      id: `res-${Date.now()}`,
      topic: query,
      timestamp: 'Generating...',
      content: '',
      status: 'generating'
    });

    onSpeak(`Initiating deep research protocol into ${query}. Synthesizing global telemetry.`);

    try {
      const res = await fetch('/api/fixa/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: query,
          depth
        })
      });
      const data = await res.json();
      const content = data.dossier || "Research dossier compiled.";

      setCurrentDossier({
        id: `res-${Date.now()}`,
        topic: query,
        timestamp: new Date().toLocaleTimeString(),
        content,
        status: 'completed'
      });

      onSpeak(`Research dossier on ${query} compiled and verified, Boss.`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!currentDossier?.content) return;
    navigator.clipboard.writeText(currentDossier.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDossier = () => {
    if (!currentDossier?.content) return;
    const blob = new Blob([currentDossier.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FIXA_Research_${currentDossier.topic.replace(/\s+/g, '_')}.md`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Research Deck */}
      <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-cyan-200">
                AUTONOMOUS RESEARCH ENGINE
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Multi-vector scientific synthesis, verified citations, and executive technical dossiers
              </p>
            </div>
          </div>
          <span className="text-xs font-mono-code px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            GEMINI 3.8 FLASH ENGINE
          </span>
        </div>

        {/* Input & Depth Configuration */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleResearch();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter research topic, technology, or scientific question..."
                className="w-full bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cyan-100 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={depth}
                onChange={(e: any) => setDepth(e.target.value)}
                className="bg-slate-900 border border-cyan-900 text-xs font-tech text-cyan-300 rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value="concise">Concise Brief</option>
                <option value="comprehensive">Comprehensive Dossier</option>
                <option value="deep_technical">Deep Technical Whitepaper</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-tech font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all whitespace-nowrap"
              >
                {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'SYNTHESIZING...' : 'COMMENCE RESEARCH'}</span>
              </button>
            </div>
          </div>

          {/* Quick topic pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[11px] font-tech text-slate-500 uppercase mr-1">Suggested:</span>
            {sampleTopics.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(t);
                  handleResearch(t);
                }}
                className="text-[11px] font-tech px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-cyan-950 hover:border-cyan-800 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </form>

        {/* Dossier Output View */}
        {currentDossier && (
          <div className="p-6 rounded-2xl bg-black/80 border border-cyan-500/40 shadow-2xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-3">
              <div>
                <div className="text-xs font-mono-code text-cyan-400">
                  DOSSIER REF: {currentDossier.id} // {currentDossier.timestamp}
                </div>
                <h4 className="font-cyber font-bold text-base text-cyan-100">
                  {currentDossier.topic}
                </h4>
              </div>

              {currentDossier.status === 'completed' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-tech flex items-center gap-1.5"
                    title="Copy Markdown"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED' : 'COPY'}</span>
                  </button>

                  <button
                    onClick={downloadDossier}
                    className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-tech flex items-center gap-1.5"
                    title="Download Dossier"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT (.MD)</span>
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-cyan-400">
                <Sparkles className="w-8 h-8 animate-spin text-cyan-300" />
                <div className="font-tech text-sm animate-pulse">
                  Querying neural vector caches & aggregating scientific benchmarks...
                </div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-5 rounded-xl border border-cyan-950 max-h-[500px] overflow-y-auto">
                {currentDossier.content}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
