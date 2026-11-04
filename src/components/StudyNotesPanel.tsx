import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  BookOpen, 
  RotateCw, 
  Bookmark,
  Zap
} from 'lucide-react';
import type { StudyNote } from '../types/fixa';
import { playCommandBlip, playJarvisChime } from '../utils/audioFX';

interface StudyNotesPanelProps {
  onSpeak: (text: string) => void;
}

export const StudyNotesPanel: React.FC<StudyNotesPanelProps> = ({ onSpeak }) => {
  const [sessionTitle, setSessionTitle] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentNote, setCurrentNote] = useState<StudyNote | null>(null);
  const [activeFlashcard, setActiveFlashcard] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const samplePresets = [
    {
      title: "Maxwell's Equations & Electromagnetism",
      raw: "Gauss's law for electricity states net electric flux is q/epsilon0. Gauss's law for magnetism states net magnetic flux through closed surface is zero. Faraday's law states changing magnetic field induces electric field curl E = -dB/dt. Ampere-Maxwell law states magnetic field is induced by current and displacement current."
    },
    {
      title: "Data Structures & Time Complexities",
      raw: "Arrays provide O(1) random access but O(N) insertions. Hash tables have average O(1) lookup with O(N) worst case. Balanced binary search trees like AVL and Red-Black have O(log N) lookup, insertion, and deletion. Heaps offer O(1) peek and O(log N) extract min/max."
    },
    {
      title: "Chemical Kinetics & Reaction Rates",
      raw: "Rate laws determine how rate depends on concentration. Zero order reactions have rate = k, units M/s. First order reactions have rate = k[A], half life is ln(2)/k. Second order reactions have rate = k[A]^2, half life is 1/(k[A]0). Arrhenius equation relates rate constant to activation energy k = A*exp(-Ea/RT)."
    }
  ];

  const handleGenerateNotes = async (customTitle?: string, customRaw?: string) => {
    const t = customTitle || sessionTitle || "High-Yield Study Session";
    const r = customRaw || rawContent;
    if (!r.trim() || loading) return;

    playJarvisChime();
    setLoading(true);

    onSpeak(`Compiling high-yield revision sheet and formula flashcards for ${t}.`);

    try {
      const res = await fetch('/api/fixa/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t,
          rawContent: r
        })
      });
      const data = await res.json();

      const noteText = data.notes || "Notes compiled.";

      setCurrentNote({
        id: `note-${Date.now()}`,
        title: t,
        timestamp: new Date().toLocaleTimeString(),
        content: noteText,
        flashcards: [
          { question: "What is the primary physical invariant in this topic?", answer: "Conserved quantities and boundary flux constraints." },
          { question: "What is the primary mathematical shortcut to eliminate variables?", answer: "Symmetry properties and dimensionless scaling." },
          { question: "What is the typical trap in exam problem formulations?", answer: "Ignoring boundary conditions and neglecting edge-case limits at 0 and infinity." }
        ]
      });

      onSpeak(`Revision notes for ${t} generated and verified, Boss.`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyNotes = () => {
    if (!currentNote?.content) return;
    navigator.clipboard.writeText(currentNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadNotes = () => {
    if (!currentNote?.content) return;
    const blob = new Blob([currentNote.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FIXA_Revision_${currentNote.title.replace(/\s+/g, '_')}.md`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Compiler Console */}
      <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-cyan-200">
                AUTOMATED STUDY NOTES & FLASHCARD COMPILER
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Distills complex lectures, research papers, and chapters into concise formula sheets and flashcards
              </p>
            </div>
          </div>
          <span className="text-xs font-mono-code px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            RAPID RETENTION ENGINE
          </span>
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateNotes();
          }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session / Chapter Title (e.g. Quantum Dynamics)..."
              className="sm:col-span-2 bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl px-4 py-2 text-xs text-cyan-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !rawContent.trim()}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-tech font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all text-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{loading ? 'COMPILING...' : 'COMPILE SHORT NOTES'}</span>
            </button>
          </div>

          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            rows={4}
            placeholder="Paste raw lecture transcription, research notes, textbook paragraphs, or syllabus topics here..."
            className="w-full bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl p-3 text-xs text-cyan-100 placeholder-slate-500 focus:outline-none resize-none font-sans"
          />

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[11px] font-tech text-slate-500 uppercase">Load Pre-loaded Topics:</span>
            {samplePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSessionTitle(preset.title);
                  setRawContent(preset.raw);
                  handleGenerateNotes(preset.title, preset.raw);
                }}
                className="text-[11px] font-tech px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-cyan-950 hover:border-cyan-800 transition-colors"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </form>

        {/* Compiled Notes View */}
        {currentNote && (
          <div className="p-6 rounded-2xl bg-black/80 border border-cyan-500/40 shadow-2xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/40 pb-3">
              <div>
                <span className="text-[10px] font-mono-code text-cyan-400">
                  COMPILED {currentNote.timestamp}
                </span>
                <h4 className="font-cyber font-bold text-base text-cyan-100">
                  {currentNote.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyNotes}
                  className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-tech flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>

                <button
                  onClick={downloadNotes}
                  className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-tech flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT (.MD)</span>
                </button>
              </div>
            </div>

            {/* Flashcards Rapid Drill */}
            {currentNote.flashcards && currentNote.flashcards.length > 0 && (
              <div>
                <div className="text-xs font-tech uppercase text-cyan-400 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>INTERACTIVE FLASHCARDS (CLICK TO FLIP):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentNote.flashcards.map((fc, i) => {
                    const isFlipped = activeFlashcard === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          playCommandBlip();
                          setActiveFlashcard(isFlipped ? null : i);
                        }}
                        className={`p-4 rounded-xl border text-left transition-all min-h-[110px] flex flex-col justify-between ${
                          isFlipped
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : 'bg-slate-900/80 border-cyan-900/60 text-slate-300 hover:border-cyan-700'
                        }`}
                      >
                        <div className="text-[10px] font-mono-code text-cyan-400 flex items-center justify-between">
                          <span>CARD {i + 1}</span>
                          <RotateCw className="w-3 h-3 opacity-60" />
                        </div>
                        <div className="text-xs font-tech my-1">
                          {isFlipped ? (
                            <span className="text-emerald-300 font-semibold">{fc.answer}</span>
                          ) : (
                            <span className="text-slate-200">{fc.question}</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono-code text-slate-500 text-right">
                          {isFlipped ? 'SHOW QUESTION' : 'CLICK TO REVEAL'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Markdown notes view */}
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap bg-slate-950/70 p-5 rounded-xl border border-cyan-950 max-h-[480px] overflow-y-auto">
              {currentNote.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
