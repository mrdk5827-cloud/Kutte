import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Mic, 
  PhoneCall, 
  Globe, 
  GraduationCap, 
  FileText, 
  ShieldCheck, 
  Sliders, 
  Volume2, 
  VolumeX, 
  FileCode2, 
  Clock, 
  Wifi, 
  Battery, 
  ShieldAlert, 
  Sparkles,
  Layers,
  ChevronRight,
  Terminal,
  Activity,
  Users,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import type { FixaState, ActiveModule, VoiceCommand, Contact } from './types/fixa';
import { FixaFaceCanvas } from './components/FixaFaceCanvas';
import { VoiceHUD } from './components/VoiceHUD';
import { SystemAccessPanel } from './components/SystemAccessPanel';
import { VoiceAutomationPanel } from './components/VoiceAutomationPanel';
import { ContactsPanel } from './components/ContactsPanel';
import { FloatingAssistantWidget } from './components/FloatingAssistantWidget';
import { CallScreeningPanel } from './components/CallScreeningPanel';
import { ResearchEnginePanel } from './components/ResearchEnginePanel';
import { AcademicTutorPanel } from './components/AcademicTutorPanel';
import { StudyNotesPanel } from './components/StudyNotesPanel';
import { SecuritySafeguardsPanel } from './components/SecuritySafeguardsPanel';
import { ArchitectureBlueprintModal } from './components/ArchitectureBlueprintModal';
import { FixaVoiceEngine } from './utils/speechService';
import { playJarvisChime, playCommandBlip, playAlertSound } from './utils/audioFX';
import { 
  getStoredContacts, 
  matchContactByName, 
  triggerDirectCall, 
  triggerWhatsAppMessage,
  parseCallCommand,
  parseWhatsAppCommand
} from './utils/contactService';

export default function App() {
  const [fixaState, setFixaState] = useState<FixaState>('idle');
  const [activeTab, setActiveTab] = useState<ActiveModule>('voice_apps');
  const [isMuted, setIsMuted] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [isFloatingWidgetOpen, setIsFloatingWidgetOpen] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>(getStoredContacts);
  const [voiceFeedback, setVoiceFeedback] = useState("FIXA Systems online. Namaste Boss! Main aapki aawaz sunne ke liye tayyar hoon.");
  const [currentTime, setCurrentTime] = useState('');
  const [commandsHistory, setCommandsHistory] = useState<VoiceCommand[]>([
    {
      id: 'cmd-init',
      timestamp: '08:00:00',
      transcript: 'System boot sequence',
      response: 'All neural subsystems initialized. Ready for your command, Boss.',
      category: 'system'
    }
  ]);

  const [latestAnswer, setLatestAnswer] = useState<{ question: string; answer: string; spoken: string } | null>(null);

  const voiceEngineRef = useRef<FixaVoiceEngine | null>(null);

  // Initialize clock & voice engine
  useEffect(() => {
    voiceEngineRef.current = new FixaVoiceEngine((state) => {
      setFixaState(state);
    });

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  const speak = (text: string) => {
    if (isMuted) return;
    setVoiceFeedback(text);
    if (voiceEngineRef.current) {
      voiceEngineRef.current.speak(text);
    }
  };

  const handleVoiceCommand = async (rawCmd: string) => {
    if (!rawCmd || !rawCmd.trim()) return;

    // Direct audio replay request from UI card
    if (rawCmd.startsWith('speak_answer:')) {
      const toSpeak = rawCmd.replace('speak_answer:', '').trim();
      speak(toSpeak);
      return;
    }

    playJarvisChime();
    setFixaState('analyzing');
    const lower = rawCmd.toLowerCase().trim();

    const logCommand = (transcript: string, response: string, category: VoiceCommand['category'] = 'system') => {
      const newCmd: VoiceCommand = {
        id: `cmd-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        transcript,
        response,
        category,
      };
      setCommandsHistory(prev => [newCmd, ...prev]);
    };

    if (rawCmd === "test_female_voice") {
      const sweetVoiceIntro = "Namaste Boss! Main FIXA hoon. Meri aawaz ab bilkul ek sundar aur madhur ladki ki tarah configure ho chuki hai. Main aapke sabhi tasks ke liye bilkul taiyaar hoon!";
      speak(sweetVoiceIntro);
      setFixaState('idle');
      return;
    }

    // 1. DYNAMIC WHATSAPP SENDER: "______ ko massage kar do ki ______" (NAME & MESSAGE CAN BE ANYTHING)
    const parsedWa = parseWhatsAppCommand(rawCmd);
    if (parsedWa) {
      const targetName = parsedWa.targetName;
      const messageContent = parsedWa.message;
      const matchedContact = matchContactByName(targetName, contacts);
      if (matchedContact) {
        const finalMsg = messageContent || `Hello ${matchedContact.name}, main FIXA AI ke through connect kar raha hoon.`;
        speak(`Ji Boss, ${matchedContact.name} ke liye WhatsApp message taiyar hai, send kar rahi hoon.`);
        triggerWhatsAppMessage(matchedContact, finalMsg);
        logCommand(rawCmd, `WhatsApp to ${matchedContact.name}: "${finalMsg}"`, "app");
        setFixaState('idle');
        return;
      } else if (targetName) {
        speak(`Boss, ${targetName} aapke contacts mein save nahi hai. Main unka WhatsApp open kar rahi hoon.`);
        triggerWhatsAppMessage({ phone: '' }, messageContent || `Hello ${targetName}`);
        logCommand(rawCmd, `WhatsApp to ${targetName} (Unsaved): "${messageContent}"`, "app");
        setFixaState('idle');
        return;
      }
    }

    // 2. DYNAMIC VOICE CALL SENDER: "______ ko call karo" (NAME CAN BE ANYTHING)
    const parsedCall = parseCallCommand(rawCmd);
    const isDirectCallCommand = parsedCall || (lower.startsWith('call ') && !lower.includes('screen') && !lower.includes('kya'));
    if (isDirectCallCommand) {
      const targetName = parsedCall ? parsedCall.targetName : rawCmd.replace(/^call\s+/i, '').replace(/ko$/i, '').trim();
      const digitsOnly = targetName.replace(/\D/g, '');
      if (digitsOnly.length >= 10) {
        speak(`Ji Boss, number ${digitsOnly} par call mila rahi hoon.`);
        triggerDirectCall({ phone: digitsOnly });
        logCommand(rawCmd, `Calling phone number ${digitsOnly}`, "call");
        setFixaState('idle');
        return;
      }

      const matchedContact = matchContactByName(targetName, contacts);
      if (matchedContact) {
        speak(`Ji Boss, ${matchedContact.name} ko call mila rahi hoon.`);
        triggerDirectCall(matchedContact);
        logCommand(rawCmd, `Calling ${matchedContact.name} (${matchedContact.phone})`, "call");
        setFixaState('idle');
        return;
      } else if (targetName && targetName.length > 1) {
        speak(`Boss, ${targetName} aapki contacts list mein nahi mile. Kripya Contacts tab se unka number save kar lijiye.`);
        setActiveTab('contacts');
        logCommand(rawCmd, `Contact "${targetName}" not found. Opened Contacts panel.`, "call");
        setFixaState('idle');
        return;
      }
    }

    // 3. HARDWARE & APPLICATION SHORTCUTS (Only on explicit request)
    if (lower === 'youtube chalao' || lower === 'open youtube' || lower === 'youtube open karo' || lower === 'youtube launch karo') {
      speak("Ji Boss, YouTube abhi open kar rahi hoon!");
      window.open('https://www.youtube.com', '_blank', 'noopener,noreferrer');
      logCommand(rawCmd, "Ji Boss, YouTube abhi chala rahi hoon!", "app");
      setFixaState('idle');
      return;
    }

    if (lower === 'camera on karo' || lower === 'open camera' || lower === 'camera chalao') {
      setActiveTab('hud');
      speak("Ji Boss, camera optical sensors activate kar diye hain.");
      logCommand(rawCmd, "Camera viewfinder online hai, Boss.", "app");
      setFixaState('idle');
      return;
    }

    if (lower === 'torch jalao' || lower === 'torch on karo' || lower === 'torch band karo' || lower === 'flashlight on karo') {
      speak("High-beam illumination diodes on kar diye hain, Boss.");
      logCommand(rawCmd, "Illumination toggle ho gaya hai, Boss.", "system");
      setFixaState('idle');
      return;
    }

    // 4. FLOATING HUD PANEL TOGGLE
    if ((lower.includes('floating') || lower.includes('float')) && (lower.includes('on') || lower.includes('off') || lower.includes('band') || lower.includes('hatao') || lower.includes('chalao') || lower.includes('kholo') || lower.includes('open'))) {
      if (lower.includes('off') || lower.includes('band') || lower.includes('hatao') || lower.includes('close')) {
        setIsFloatingWidgetOpen(false);
        speak("Floating assistant panel band kar diya hai, Boss.");
        logCommand(rawCmd, "Floating HUD deactivated.", "system");
      } else {
        setIsFloatingWidgetOpen(true);
        speak("Ji Boss! Floating assistant panel screen par nikaal diya hai, aapki image ke saath.");
        logCommand(rawCmd, "Floating HUD activated.", "system");
      }
      setFixaState('idle');
      return;
    }

    // 5. EXPLICIT TAB NAVIGATION (Only when user specifically asks to switch or open a panel)
    if ((lower.includes('call screen') || lower.includes('screener')) && (lower.includes('kholo') || lower.includes('open') || lower.includes('tab') || lower.includes('panel'))) {
      setActiveTab('call_screener');
      speak("Autonomous Call Screening protocol engage kar diya hai, Boss.");
      logCommand(rawCmd, "Call screening active hai, Boss.", "call");
      setFixaState('idle');
      return;
    }

    if ((lower.includes('study notes') || lower.includes('flashcard')) && (lower.includes('kholo') || lower.includes('open') || lower.includes('tab') || lower.includes('panel'))) {
      setActiveTab('study_notes');
      speak("Study notes aur flashcards engine open kar diya hai, Boss.");
      logCommand(rawCmd, "Study notes engine ready hai, Boss.", "academic");
      setFixaState('idle');
      return;
    }

    if (lower.includes('research lab') || lower.includes('research panel kholo') || lower.includes('research tab open karo')) {
      setActiveTab('research_engine');
      speak("Deep research laboratory open kar diya hai, Boss.");
      logCommand(rawCmd, "Research engine ready hai, Boss.", "research");
      setFixaState('idle');
      return;
    }

    if ((lower.includes('contact') || lower.includes('phonebook')) && (lower.includes('kholo') || lower.includes('open') || lower.includes('tab') || lower.includes('list'))) {
      setActiveTab('contacts');
      speak("Ji Boss, Contacts aur Phonebook open kar diya hai.");
      logCommand(rawCmd, "Opened Contacts panel", "call");
      setFixaState('idle');
      return;
    }

    // 6. FOR ALL QUESTIONS, FACTUAL INQUIRIES, MATH, KNOWLEDGE & CONVERSATION:
    // DIRECT ACCURATE ANSWER RETRIEVED FROM SERVER INTELLIGENCE
    try {
      const res = await fetch('/api/fixa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: rawCmd })
      });
      const data = await res.json();
      const answerText = data.text || "Main aapka prashna samajh gayi hoon, Boss.";
      const spoken = data.voiceFeedback || answerText;

      setLatestAnswer({
        question: rawCmd,
        answer: answerText,
        spoken: spoken,
      });

      speak(spoken);
      logCommand(rawCmd, spoken, 'system');
    } catch (e) {
      console.error("Chat API error:", e);
      speak("Main aapka uttar analyze kar rahi hoon, Boss.");
    } finally {
      setFixaState('idle');
    }
  };

  const navigationTabs = [
    { id: 'voice_apps' as ActiveModule, label: 'VOICE & APPS', icon: Mic, badge: 'MODULE 2' },
    { id: 'contacts' as ActiveModule, label: 'CONTACTS & WHATSAPP', icon: Users, badge: 'CALL/MSG' },
    { id: 'call_screener' as ActiveModule, label: 'CALL SCREENER', icon: PhoneCall, badge: 'MODULE 3' },
    { id: 'research_engine' as ActiveModule, label: 'RESEARCH LAB', icon: Globe, badge: 'MODULE 4' },
    { id: 'academic_tutor' as ActiveModule, label: 'ACADEMIC TUTOR', icon: GraduationCap, badge: 'MODULE 5' },
    { id: 'study_notes' as ActiveModule, label: 'STUDY NOTES', icon: FileText, badge: 'MODULE 6' },
    { id: 'hud' as ActiveModule, label: 'SYSTEM & HARDWARE', icon: Sliders, badge: 'MODULE 1' },
    { id: 'security_vault' as ActiveModule, label: 'ZERO-DISCLOSURE', icon: ShieldCheck, badge: 'MODULES 7-8' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-[#e0f2fe] relative selection:bg-cyan-500 selection:text-black">
      {/* Background Cyber Grid & Scanline FX */}
      <div className="fixed inset-0 cyber-grid pointer-events-none opacity-40" />
      <div className="fixed inset-0 cyber-scanlines opacity-25" />

      {/* Futuristic Ambient Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP HUD BAR */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-cyan-800/40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-black font-cyber font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                F
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cyber font-black text-lg tracking-widest text-cyan-200 glow-text-cyan">
                  FIXA
                </h1>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  JARVIS AI V4.8
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-slate-400 hidden sm:block">
                NEURAL AUTONOMOUS ASSISTANT // ZERO-DISCLOSURE RUNTIME
              </p>
            </div>
          </div>

          {/* Telemetry Status Gauges */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-mono-code text-slate-400">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>CORE LATENCY: <strong className="text-cyan-300">12ms</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>SECURITY: <strong className="text-emerald-300">STAGE 5 AIR-GAP</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 font-bold">{currentTime || '00:00:00 UTC'}</span>
            </div>
          </div>

          {/* Actions: Floating Panel ON/OFF, Blueprint & Audio toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                playCommandBlip();
                const nextState = !isFloatingWidgetOpen;
                setIsFloatingWidgetOpen(nextState);
                speak(nextState ? "Ji Boss, floating assistant panel screen par on kar diya hai." : "Floating assistant panel band kar diya hai, Boss.");
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-tech font-bold flex items-center gap-1.5 transition-all shadow-md ${
                isFloatingWidgetOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle Floating Assistant Panel (On Screen Overlay)"
            >
              <span className={`w-2 h-2 rounded-full ${isFloatingWidgetOpen ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="hidden sm:inline">FLOATING HUD:</span>
              <span>{isFloatingWidgetOpen ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => { playCommandBlip(); setBlueprintOpen(true); }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-tech font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all hover:scale-105"
            >
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">TECHNICAL BLUEPRINT</span>
              <span className="sm:hidden">SPECS</span>
            </button>

            <button
              onClick={() => {
                playCommandBlip();
                setIsMuted(!isMuted);
                if (!isMuted && voiceEngineRef.current) {
                  voiceEngineRef.current.stopSpeaking();
                }
              }}
              className="p-2 rounded-xl bg-slate-900 border border-cyan-900 hover:border-cyan-700 text-slate-300 hover:text-cyan-300 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8 relative z-10">
        {/* CENTERPIECE HERO: Holographic Dotted AI Face & Voice Controller */}
        <section className="bg-gradient-to-b from-slate-950/90 to-slate-900/60 border border-cyan-700/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(6,182,212,0.12)] relative overflow-hidden">
          {/* Subtle background radar circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-[500px] h-[500px] border border-cyan-500 rounded-full animate-ping [animation-duration:8s]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Dotted Holographic AI Face Canvas */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative group">
                <FixaFaceCanvas
                  state={fixaState}
                  size={320}
                  interactive={true}
                />
                <div className="text-center mt-3">
                  <div className="font-cyber font-bold text-sm tracking-wider text-cyan-300 glow-text-cyan flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>REAL HUMAN FACE // PURE BLUE DOTS</span>
                  </div>
                  <p className="text-[11px] font-mono-code text-cyan-400/80 mt-0.5">
                    750+ 3D POINT CLOUD • PURE DOTS ONLY • SUNDAR FEMALE VOICE 🌸
                  </p>
                </div>
              </div>
            </div>

            {/* Voice Waveform Controller & Live Jarvis Status */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-cyber text-xs uppercase tracking-widest text-cyan-300">
                    VOICE-ACTIVATED REAL-TIME INTERFACE
                  </span>
                </div>
                <span className="text-[10px] font-mono-code text-slate-400">
                  GEMINI 3.8 FLASH ENGINE
                </span>
              </div>

              {/* Central Voice HUD Component */}
              <VoiceHUD
                state={fixaState}
                onStateChange={setFixaState}
                onVoiceCommand={handleVoiceCommand}
                voiceFeedback={voiceFeedback}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
                latestAnswer={latestAnswer}
              />

              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] font-tech text-slate-400 uppercase">Quick Voice Prompts:</span>
                <button
                  onClick={() => handleVoiceCommand("YouTube chalao")}
                  className="text-xs font-tech px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 hover:border-cyan-500 transition-all"
                >
                  "YouTube chalao"
                </button>
                <button
                  onClick={() => handleVoiceCommand("Camera on karo")}
                  className="text-xs font-tech px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 hover:border-cyan-500 transition-all"
                >
                  "Camera on karo"
                </button>
                <button
                  onClick={() => handleVoiceCommand("Check system diagnostics")}
                  className="text-xs font-tech px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 hover:border-cyan-500 transition-all"
                >
                  "System diagnostics"
                </button>
                <button
                  onClick={() => handleVoiceCommand("Screen unknown calls")}
                  className="text-xs font-tech px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 hover:border-cyan-500 transition-all"
                >
                  "Screen unknown calls"
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MODULAR NAVIGATION TABS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playCommandBlip();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all whitespace-nowrap text-xs font-tech font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]'
                      : 'bg-slate-950/60 border-cyan-950 hover:border-cyan-800 text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[9px] font-mono-code px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-cyan-500 text-black font-extrabold' : 'bg-slate-900 text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE TAB CONTENT MODULE */}
          <div className="transition-all duration-300">
            {activeTab === 'voice_apps' && (
              <VoiceAutomationPanel
                onExecuteCommand={handleVoiceCommand}
                commandsHistory={commandsHistory}
                onSpeak={speak}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactsPanel
                contacts={contacts}
                onUpdateContacts={setContacts}
                onSpeak={speak}
                onExecuteCommand={handleVoiceCommand}
              />
            )}

            {activeTab === 'call_screener' && (
              <CallScreeningPanel onSpeak={speak} />
            )}

            {activeTab === 'research_engine' && (
              <ResearchEnginePanel onSpeak={speak} />
            )}

            {activeTab === 'academic_tutor' && (
              <AcademicTutorPanel onSpeak={speak} />
            )}

            {activeTab === 'study_notes' && (
              <StudyNotesPanel onSpeak={speak} />
            )}

            {activeTab === 'hud' && (
              <SystemAccessPanel />
            )}

            {activeTab === 'security_vault' && (
              <SecuritySafeguardsPanel
                onSpeak={speak}
                onAlertTrigger={() => {
                  setFixaState('alert');
                  setTimeout(() => setFixaState('idle'), 4000);
                }}
              />
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-cyan-950 bg-black/60 py-6 px-4 text-center text-xs text-slate-500 font-mono-code">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            FIXA PERSONAL AI ASSISTANT // ARCHITECTED WITH EXTREME PRECISION
          </div>
          <div className="text-cyan-400/80">
            ZERO-DISCLOSURE ARCHITECTURE // GEMINI 3.8 FLASH ENGINE
          </div>
        </div>
      </footer>

      {/* FLOATING HUD ASSISTANT WIDGET (OVERLAY WITH CORNER USER IMAGE & ACTIVE LISTENER) */}
      <FloatingAssistantWidget
        isOpen={isFloatingWidgetOpen}
        onClose={() => setIsFloatingWidgetOpen(false)}
        state={fixaState}
        onVoiceCommand={handleVoiceCommand}
        voiceFeedback={voiceFeedback}
        contacts={contacts}
        onUpdateContacts={setContacts}
        latestAnswer={latestAnswer}
      />

      {/* ARCHITECTURE BLUEPRINT MODAL */}
      <ArchitectureBlueprintModal
        isOpen={blueprintOpen}
        onClose={() => setBlueprintOpen(false)}
      />
    </div>
  );
}
