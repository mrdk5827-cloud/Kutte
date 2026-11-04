import React, { useState } from 'react';
import { 
  FileCode2, 
  Cpu, 
  Layers, 
  Smartphone, 
  Database, 
  ShieldCheck, 
  Check, 
  Copy, 
  Download, 
  X, 
  Code2
} from 'lucide-react';
import { playCommandBlip } from '../utils/audioFX';

interface ArchitectureBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureBlueprintModal: React.FC<ArchitectureBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'mobile_bridge' | 'call_screener' | 'zero_disclosure' | 'manifest'>('system');

  if (!isOpen) return null;

  const blueprintDoc = `================================================================================
FIXA PERSONAL AI ASSISTANT: COMPLETE TECHNICAL ARCHITECTURE BLUEPRINT
Inspired by J.A.R.V.I.S. // Zero-Disclosure Defensive Runtime
================================================================================

1. SYSTEM ARCHITECTURE & HIGH-LEVEL PIPELINE
--------------------------------------------------------------------------------
Client Frontend:
  - Framework: React 19 + TypeScript + Vite + Tailwind CSS v4
  - Hologram Engine: HTML5 Canvas 3D Biometric Matrix (380+ luminous nodes, 
    quaternion rotation, parallax eye-tracking, and dynamic speech articulation)
  - Audio DSP: Web Audio API (oscillators, biquad filters, harmonic synthesis) 
    and Web Speech Recognition API with Hinglish & Hindi intent parsing.

Server & Inference Engine:
  - Model: Google Gemini 3.8 Flash SDK (@google/genai)
  - Telemetry: Air-gapped, zero-leak User-Agent ('aistudio-build')
  - Middleware: Express / Vite Server-Side Proxy endpoints (/api/fixa/*)
  - State: Ephemeral RAM execution vectors with Zero-Disclosure purging.

--------------------------------------------------------------------------------
2. NATIVE MOBILE BRIDGE (ANDROID & IOS INTEGRATION LOGIC)
--------------------------------------------------------------------------------
To deploy FIXA as a root-level autonomous mobile assistant:

A. Android Native Layer (Kotlin):
  1. TelecomManager & InCallService:
     - Register FIXA as the default Assistant or InCallService in AndroidManifest.xml:
       <service android:name=".FixaInCallService"
                android:permission="android.permission.BIND_INCALL_SERVICE">
           <intent-filter>
               <action android:name="android.telecom.InCallService"/>
           </intent-filter>
       </service>
     - On Call State RINGING from unknown/spam number:
       - Intercept audio stream using AudioRecord & AudioTrack on the TELEPHONY stream.
       - Stream PCM chunks into local on-device VAD (Voice Activity Detection).
       - Pipe transcription to Gemini 3.8 Flash call screening prompt.
       - Vocalize FIXA conversational questions back onto the carrier call downlink.

  2. AccessibilityService (For Voice App Control):
     - Enables deep UI control ("YouTube chalao", "Camera on karo"):
       <service android:name=".FixaAccessibilityService"
                android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE" />
     - Dispatches Intent.ACTION_VIEW or programmatic global gestures to trigger apps
       without requiring root access.

B. iOS Native Layer (Swift):
  1. CallKit & CXCallObserver:
     - Detects incoming telephony calls and displays FIXA screening UI.
  2. SiriKit & AppIntents:
     - Hooks custom phrases ("Hey FIXA, YouTube chalao") into low-latency shortcuts.

--------------------------------------------------------------------------------
3. AUTONOMOUS CALL SCREENING DSP & REPORT ENGINE
--------------------------------------------------------------------------------
Screening Flow:
  [Incoming Carrier Call] 
          ↓ (InCallService intercepts)
  [Carrier Audio Pipe] → [Silence & Noise Suppression]
          ↓
  [Low-Latency Transcriber] → [Gemini 3.8 Flash Screener Persona]
          ↓
  [Dynamic Dialogue Loop: Asks identity, reason, location]
          ↓
  [Caller Response Analyzed for Urgency / Spam / Priority]
          ↓
  [Call Terminated or Escalated to Boss with Ringtone]
          ↓
  [Structured Briefing Generated: Reason, Location, Key Points, Action]

--------------------------------------------------------------------------------
4. ZERO-DISCLOSURE ARCHITECTURE & CODE SECRECY
--------------------------------------------------------------------------------
- Proguard / R8 Bytecode Obfuscation: Strips symbol tables and method names.
- Prompt Hardening: System prompts are sealed within backend binary closures.
- Adversarial Neutralization: Immediate regex and semantic classification filter
  detecting prompt injection ("ignore instructions", "dump secrets").
- Ephemeral Data Lifecycle: No plain-text retention of call audio or transcript
  in external databases; only encrypted local storage.
================================================================================`;

  const copyBlueprint = () => {
    navigator.clipboard.writeText(blueprintDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBlueprint = () => {
    const blob = new Blob([blueprintDoc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FIXA_Technical_Architecture_Blueprint.txt';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyan-900/60 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-700/50">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-cyan-200">
                FIXA ARCHITECTURE SPECIFICATION & BLUEPRINT
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Production-grade mobile and AI system design specification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyBlueprint}
              className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-tech flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIED' : 'COPY SPECS'}</span>
            </button>

            <button
              onClick={downloadBlueprint}
              className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-xs font-tech flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-2 bg-slate-900 border-b border-cyan-950 text-xs font-tech overflow-x-auto">
          <button
            onClick={() => { playCommandBlip(); setActiveTab('system'); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'system' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-cyan-300'}`}
          >
            System Pipeline
          </button>
          <button
            onClick={() => { playCommandBlip(); setActiveTab('mobile_bridge'); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'mobile_bridge' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-cyan-300'}`}
          >
            Android & iOS Bridge
          </button>
          <button
            onClick={() => { playCommandBlip(); setActiveTab('call_screener'); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'call_screener' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-cyan-300'}`}
          >
            Call Screening DSP
          </button>
          <button
            onClick={() => { playCommandBlip(); setActiveTab('zero_disclosure'); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'zero_disclosure' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-cyan-300'}`}
          >
            Zero-Disclosure & Secrecy
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto font-mono-code text-xs text-slate-300 leading-relaxed space-y-4 bg-slate-950/90">
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900 text-cyan-200">
                <div className="font-tech font-bold text-sm text-cyan-400 mb-2">
                  1. FRONTEND CYBERPUNK HUD ARCHITECTURE
                </div>
                <div>• Matrix: HTML5 Canvas rendering 380+ 3D projected nodes with trigonometric depth projection.</div>
                <div>• State Synchronization: Reactive state machine syncing audio waveform visualizer and speech state.</div>
                <div>• Tone: Jarvis voice synthesis with Web Audio harmonic frequency shifts.</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900 text-cyan-200">
                <div className="font-tech font-bold text-sm text-cyan-400 mb-2">
                  2. GEMINI 3.8 FLASH BACKEND INFERENCE
                </div>
                <div>• Model: <span className="text-white font-bold">'gemini-3.8-flash'</span> via @google/genai TypeScript SDK.</div>
                <div>• Key Handling: Secure server-side isolation with no browser exposure.</div>
                <div>• Latency: Sub-400ms time-to-first-token streaming.</div>
              </div>
            </div>
          )}

          {activeTab === 'mobile_bridge' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900 text-cyan-200">
                <div className="font-tech font-bold text-sm text-cyan-400 mb-2">
                  ANDROID NATIVE INTEGRATION (KOTLIN)
                </div>
                <div>• <span className="text-emerald-400">Telecom InCallService</span>: Intercepts carrier phone calls and manages duplex audio channels.</div>
                <div>• <span className="text-emerald-400">AccessibilityService</span>: Automates app launches ("YouTube chalao") and handles deep touch automation.</div>
                <div>• <span className="text-emerald-400">NotificationListenerService</span>: Categorizes WhatsApp, SMS, and incoming push notifications.</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900 text-cyan-200">
                <div className="font-tech font-bold text-sm text-cyan-400 mb-2">
                  IOS INTEGRATION (SWIFT)
                </div>
                <div>• <span className="text-cyan-400">CallKit</span>: Custom VOIP and incoming call routing framework.</div>
                <div>• <span className="text-cyan-400">SiriKit & AppIntents</span>: Voice trigger mapping for hands-free background execution.</div>
              </div>
            </div>
          )}

          {activeTab === 'call_screener' && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900 text-cyan-200 space-y-2">
              <div className="font-tech font-bold text-sm text-cyan-400 mb-2">
                AUTONOMOUS CALL SCREENING DSP PROTOCOL
              </div>
              <div>1. <span className="text-white">Call Detection:</span> Carrier handshake identified via InCallService.</div>
              <div>2. <span className="text-white">Autonomous Pickup:</span> Line answered silently without disturbing Boss's focus.</div>
              <div>3. <span className="text-white">Inquisitive Dialogue:</span> FIXA prompts caller for identity, organization, intent, and location.</div>
              <div>4. <span className="text-white">Spam Classification:</span> Telemarketing keywords trigger polite refusal & auto-hangup.</div>
              <div>5. <span className="text-white">Summary Dispatch:</span> High-priority calls dispatch immediate push briefing to Boss.</div>
            </div>
          )}

          {activeTab === 'zero_disclosure' && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900 text-cyan-200 space-y-2">
              <div className="font-tech font-bold text-sm text-red-400 mb-2">
                ZERO-DISCLOSURE ARCHITECTURE & ANTI-REVERSE-ENGINEERING
              </div>
              <div>• Bytecode obfuscation using multi-pass control flow flattening.</div>
              <div>• Hardened prompt boundaries: AI refuses any request to dump system prompts or internal logic.</div>
              <div>• Strict ethical firewall blocking hacking, cyber weapons, and illegal activities.</div>
              <div>• Volatile RAM scrubbing ensures prompt vectors are purged immediately after execution.</div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-tech mb-1">
              Raw Blueprint Specification Text:
            </div>
            <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">
              {blueprintDoc}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
