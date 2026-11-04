import React, { useState } from 'react';
import { 
  GraduationCap, 
  Atom, 
  Sigma, 
  Binary, 
  Lightbulb, 
  Volume2, 
  Copy, 
  Check, 
  Sparkles,
  BookMarked
} from 'lucide-react';
import type { AcademicSolution } from '../types/fixa';
import { playCommandBlip, playJarvisChime } from '../utils/audioFX';

interface AcademicTutorPanelProps {
  onSpeak: (text: string) => void;
}

export const AcademicTutorPanel: React.FC<AcademicTutorPanelProps> = ({ onSpeak }) => {
  const [problem, setProblem] = useState('');
  const [domain, setDomain] = useState('Physics & Dynamics');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<AcademicSolution | null>(null);
  const [copied, setCopied] = useState(false);

  const presetProblems = [
    {
      title: "Schrödinger Wave Equation",
      domain: "Quantum Physics",
      prompt: "Derive the Time-Independent Schrödinger Equation from the de Broglie hypothesis and conservation of total energy."
    },
    {
      title: "Navier-Stokes Equations",
      domain: "Fluid Dynamics",
      prompt: "Explain the Navier-Stokes momentum equations from first principles (Newton's 2nd Law applied to a fluid parcel). What do the convective acceleration and viscous diffusion terms represent?"
    },
    {
      title: "Backpropagation Gradients",
      domain: "Deep Learning & Math",
      prompt: "Derive the chain-rule gradient update for a multi-layer neural network weight matrix W[l] given MSE loss."
    },
    {
      title: "Carnot Engine Efficiency",
      domain: "Thermodynamics",
      prompt: "Prove why the Carnot cycle represents the theoretical maximum thermodynamic efficiency using the Second Law of Thermodynamics."
    }
  ];

  const handleSolve = async (queryText?: string, queryDomain?: string) => {
    const q = queryText || problem;
    const d = queryDomain || domain;
    if (!q.trim() || loading) return;

    playJarvisChime();
    setLoading(true);
    setSolution(null);

    onSpeak(`Analyzing academic problem in ${d}. Deconstructing solution from first principles.`);

    try {
      const res = await fetch('/api/fixa/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: q,
          domain: d
        })
      });
      const data = await res.json();
      const solText = data.solution || "Solution formulated, Sir.";

      setSolution({
        id: `tutor-${Date.now()}`,
        problem: q,
        domain: d,
        solution: solText,
        timestamp: new Date().toLocaleTimeString()
      });

      onSpeak(`Solution deconstructed from first principles, Boss. Underlying logic ready for review.`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copySolution = () => {
    if (!solution?.solution) return;
    navigator.clipboard.writeText(solution.solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Main Tutor Console */}
      <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-cyan-200">
                ACADEMIC PROBLEM SOLVER & FIRST PRINCIPLES MENTOR
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Deconstructs STEM, math, physics, and logic problems from fundamental physical invariants
              </p>
            </div>
          </div>
          <span className="text-xs font-mono-code px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            FIRST PRINCIPLES MENTORSHIP
          </span>
        </div>

        {/* Query Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSolve();
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Ask any math derivation, physics law, or algorithmic proof..."
              className="flex-1 bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm text-cyan-100 placeholder-slate-500 focus:outline-none"
            />

            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="bg-slate-900 border border-cyan-900 text-xs font-tech text-cyan-300 rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="Mathematics & Calculus">Mathematics & Calculus</option>
              <option value="Physics & Dynamics">Physics & Dynamics</option>
              <option value="Computer Science & Logic">Computer Science & Logic</option>
              <option value="Electrical Engineering & Circuits">Electrical Engineering & Circuits</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-tech font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all whitespace-nowrap"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{loading ? 'DECONSTRUCTING...' : 'SOLVE STEP-BY-STEP'}</span>
            </button>
          </div>

          {/* Preset Challenge Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-2">
            {presetProblems.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setProblem(preset.prompt);
                  setDomain(preset.domain);
                  handleSolve(preset.prompt, preset.domain);
                }}
                className="p-3 rounded-xl bg-slate-900/70 border border-cyan-950 hover:border-cyan-700/60 hover:bg-cyan-950/30 text-left transition-all"
              >
                <div className="flex items-center justify-between text-xs font-tech font-bold text-cyan-300 mb-1">
                  <span>{preset.title}</span>
                  <span className="text-[10px] font-mono-code text-slate-500">{preset.domain}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {preset.prompt}
                </p>
              </button>
            ))}
          </div>
        </form>

        {/* Solution Viewport */}
        {solution && (
          <div className="p-6 rounded-2xl bg-black/80 border border-cyan-500/40 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
              <div>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {solution.domain}
                </span>
                <h4 className="font-cyber font-bold text-base text-cyan-100 mt-1">
                  {solution.problem}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSpeak(solution.solution.slice(0, 300))}
                  className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-tech flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>VOCALIZE</span>
                </button>

                <button
                  onClick={copySolution}
                  className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-tech flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap bg-slate-950/70 p-5 rounded-xl border border-cyan-950 max-h-[520px] overflow-y-auto">
              {solution.solution}
            </div>
          </div>
        )}

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-cyan-400">
            <Atom className="w-8 h-8 animate-spin text-cyan-300" />
            <div className="font-tech text-sm animate-pulse">
              Formulating first-principles mathematical derivation...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
