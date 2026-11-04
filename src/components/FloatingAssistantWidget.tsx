import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneCall, 
  MessageSquare, 
  Tv, 
  Camera, 
  X, 
  Minimize2, 
  Maximize2, 
  Volume2, 
  Sparkles, 
  Send,
  Phone,
  UserPlus,
  HelpCircle,
  Smartphone,
  ChevronDown,
  Layers,
  CheckCircle,
  Trash2,
  Users,
  Plus
} from 'lucide-react';
import type { FixaState, Contact } from '../types/fixa';
import { playCommandBlip, playJarvisChime } from '../utils/audioFX';
import { triggerDirectCall, triggerWhatsAppMessage, saveContacts, cleanPhoneNumber } from '../utils/contactService';

interface FloatingAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  state: FixaState;
  onVoiceCommand: (text: string) => void;
  voiceFeedback: string;
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
  latestAnswer?: { question: string; answer: string; spoken: string } | null;
}

export const FloatingAssistantWidget: React.FC<FloatingAssistantWidgetProps> = ({
  isOpen,
  onClose,
  state,
  onVoiceCommand,
  voiceFeedback,
  contacts,
  onUpdateContacts,
  latestAnswer,
}) => {
  // Starts collapsed by default showing ONLY the image bubble as requested!
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [isListeningLocal, setIsListeningLocal] = useState(false);
  const [showAndroidOverlayGuide, setShowAndroidOverlayGuide] = useState(false);

  // Missing contact prompt state if user calls or messages an unsaved name
  const [missingContactData, setMissingContactData] = useState<{
    name: string;
    action: 'call' | 'whatsapp';
    message?: string;
  } | null>(null);
  const [unsavedNumber, setUnsavedNumber] = useState('');
  
  // Contacts list & custom contact state inside floating assistant
  const [showContactsList, setShowContactsList] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customRel, setCustomRel] = useState('Friend');
  const [whatsAppToast, setWhatsAppToast] = useState<string | null>(null);

  // Position state for draggable / dockable floating bubble
  const [position, setPosition] = useState({ x: 20, y: 140 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // User's provided image asset
  const userPhotoUrl = '/assets/aistudio/20251230_153402_2_1__71ad7abc.jpg';

  if (!isOpen) return null;

  const handleStartMic = () => {
    playJarvisChime();
    setIsListeningLocal(true);

    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = 'hi-IN';
          rec.continuous = false;
          rec.interimResults = false;
          rec.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            setIsListeningLocal(false);
            onVoiceCommand(transcript);
          };
          rec.onerror = () => setIsListeningLocal(false);
          rec.onend = () => setIsListeningLocal(false);
          rec.start();
          return;
        } catch {
          setIsListeningLocal(false);
        }
      }
    }
    // Fallback prompt trigger
    setIsListeningLocal(false);
    onVoiceCommand("test_female_voice");
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    playCommandBlip();
    const cmd = quickInput.trim();
    setQuickInput('');
    onVoiceCommand(cmd);
  };

  const handleProceedWithUnsavedNumber = (saveAsPermanent = false) => {
    if (!missingContactData || !unsavedNumber.trim()) return;
    playJarvisChime();

    if (saveAsPermanent) {
      const newContact: Contact = {
        id: `c-${Date.now()}`,
        name: missingContactData.name,
        phone: unsavedNumber.trim(),
        whatsapp: unsavedNumber.trim().replace(/\D/g, ''),
        relationship: 'Contact',
        avatarColor: 'from-cyan-500 to-blue-600',
        isFavorite: false,
      };
      const updated = [newContact, ...contacts];
      onUpdateContacts(updated);
      saveContacts(updated);
    }

    if (missingContactData.action === 'call') {
      triggerDirectCall({ phone: unsavedNumber });
    } else {
      triggerWhatsAppMessage({ phone: unsavedNumber }, missingContactData.message || '');
    }

    setMissingContactData(null);
    setUnsavedNumber('');
  };

  const handleDeleteContact = (id: string, name: string) => {
    playCommandBlip();
    const updated = contacts.filter((c) => c.id !== id);
    onUpdateContacts(updated);
    saveContacts(updated);
    setWhatsAppToast(`"${name}" contact successfully delete kar diya gaya.`);
    setTimeout(() => setWhatsAppToast(null), 4000);
  };

  const handleAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPhone.trim()) return;
    playCommandBlip();

    const newContact: Contact = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      phone: customPhone.trim(),
      whatsapp: cleanPhoneNumber(customPhone.trim()),
      relationship: customRel.trim(),
      avatarColor: 'from-cyan-500 to-blue-600',
      isFavorite: false,
    };

    const updated = [newContact, ...contacts];
    onUpdateContacts(updated);
    saveContacts(updated);

    setCustomName('');
    setCustomPhone('');
    setShowAddCustom(false);
  };

  const handleQuickCall = (contact: Contact) => {
    playJarvisChime();
    triggerDirectCall(contact);
  };

  const handleQuickWhatsApp = (contact: Contact) => {
    playJarvisChime();
    const defaultMsg = `Hello ${contact.name}, main FIXA AI Assistant ke through connect kar raha hoon.`;
    triggerWhatsAppMessage(contact, defaultMsg);
    setWhatsAppToast(`WhatsApp khul gaya hai! Message automatic type ho chuka hai: "${defaultMsg}"`);
    setTimeout(() => setWhatsAppToast(null), 5000);
  };

  return (
    <>
      {/* 
        ========================================================================
        1. DEFAULT FLOATING STATE: ONLY THE USER IMAGE BUBBLE ON SCREEN
        (Jab app me kahi bhi ho, sirf image dikhti hai. Click karne par open!)
        ========================================================================
      */}
      {!isExpanded && (
        <div
          className="fixed bottom-8 right-6 z-50 flex flex-col items-center group cursor-pointer select-none"
          onClick={() => {
            playCommandBlip();
            setIsExpanded(true);
          }}
          title="Click to open FIXA Voice Assistant Menu"
        >
          {/* Glowing Animated Hologram Aura */}
          <div className="relative">
            {/* Luminous Pulsing Halo */}
            <span className="absolute -inset-2 rounded-3xl bg-cyan-500/30 blur-md animate-pulse" />
            <span className="absolute -inset-1 rounded-3xl border-2 border-cyan-400 animate-ping opacity-60" />

            {/* The User Image Bubble Container */}
            <div className="relative w-16 h-20 sm:w-18 sm:h-24 rounded-2xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] bg-black transition-transform duration-300 group-hover:scale-110 active:scale-95">
              <img
                src={userPhotoUrl}
                alt="FIXA Floating Assistant (Dileep Kumar)"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Bottom Tag */}
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <span className="font-cyber font-black text-[9px] text-cyan-200 tracking-wider">
                  FIXA
                </span>
              </div>
            </div>

            {/* Active Speech Microphone Pill Badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartMic();
              }}
              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-cyan-500 text-black border-2 border-black shadow-lg hover:scale-110 transition-transform"
              title="Click to speak instantly"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-1.5 px-2 py-0.5 rounded-md bg-black/80 border border-cyan-800 text-[10px] font-tech text-cyan-300 shadow">
            Click to Open Menu
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        2. EXPANDED FULL ASSISTANT PANEL: WHEN IMAGE IS CLICKED
        (Khulne par sare options, Calling, WhatsApp, Voice Listener khulte hain)
        ========================================================================
      */}
      {isExpanded && (
        <div className="fixed bottom-6 right-4 sm:right-8 z-50 w-[94vw] max-w-[420px] bg-slate-950/95 border-2 border-cyan-400 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header with Photo, Status, and Collapse */}
          <div className="flex items-center justify-between p-3.5 border-b border-cyan-900/60 bg-gradient-to-r from-slate-900 to-cyan-950/50">
            <div className="flex items-center gap-2.5">
              {/* User Image in Header */}
              <div className="relative w-10 h-12 rounded-xl overflow-hidden border border-cyan-400 shrink-0">
                <img
                  src={userPhotoUrl}
                  alt="Dileep Kumar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-cyber font-bold text-xs text-cyan-200">
                    FIXA FLOATING ASSISTANT
                  </span>
                </div>
                <div className="text-[10px] font-tech text-slate-400">
                  DILEEP KUMAR • SCREEN OVERLAY
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAndroidOverlayGuide(!showAndroidOverlayGuide)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
                title="Android Home Screen Overlay Guide"
              >
                <Smartphone className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  playCommandBlip();
                  setIsExpanded(false); // Collapses back to just the floating image bubble!
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
                title="Collapse to Floating Image Bubble"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  playCommandBlip();
                  onClose();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
                title="Close Floating Widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Android Home Screen Guide Dropdown */}
          {showAndroidOverlayGuide && (
            <div className="p-3 bg-cyan-950/80 border-b border-cyan-800 text-[11px] font-mono-code text-cyan-200 space-y-1">
              <div className="font-tech font-bold text-xs text-cyan-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>PHONE HOME SCREEN OVERLAY (APP BAND HONE PAR BHI):</span>
              </div>
              <p className="text-[10px] text-slate-300">
                Android phone par app band karne ke baad bhi yeh image bubble home screen par float karne ke liye native <strong className="text-white">SYSTEM_ALERT_WINDOW (Floating Window Permission)</strong> use hoti hai.
              </p>
              <div className="text-[9px] text-emerald-300">
                ✓ Web app me yeh browser tab me hamesha float karta hai. Native APK me yeh FloatingWidgetService ke dwara homescreen par lock rehta hai.
              </div>
            </div>
          )}

          {/* Body */}
          <div className="p-4 flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto">
            {/* Sweet Voice & Transcript Status Card */}
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-cyan-900/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span className="font-tech text-xs font-bold text-pink-300">
                    Sundar Female Voice Active 🌸
                  </span>
                </div>
                <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {state.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-cyan-100 font-mono-code leading-relaxed bg-black/50 p-2.5 rounded-xl border border-cyan-950">
                "{voiceFeedback}"
              </p>

              {/* Main Microphone Action Button */}
              <button
                onClick={handleStartMic}
                className={`w-full py-2.5 px-4 rounded-xl font-tech font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isListeningLocal || state === 'listening'
                    ? 'bg-cyan-400 text-black glow-cyan animate-pulse'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>
                  {isListeningLocal || state === 'listening'
                    ? 'Main Sun Rahi Hoon, Boliye...'
                    : 'Bolne Ke Liye Click Karein'}
                </span>
              </button>
            </div>

            {/* Direct Accurate Answer Display Card */}
            {latestAnswer && (
              <div className="bg-slate-900/95 p-3 rounded-2xl border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="font-tech text-xs font-bold text-emerald-300">
                      SATIK UTTAR (DIRECT ANSWER):
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onVoiceCommand(`speak_answer:${latestAnswer.spoken}`)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900 text-[10px] font-tech transition-colors"
                    title="Awaaz sunein"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Sunayein 🌸</span>
                  </button>
                </div>

                <div className="text-[11px] font-mono-code text-cyan-200 bg-black/60 p-2.5 rounded-xl border border-cyan-950/80">
                  <div className="text-slate-400 text-[10px] mb-1">
                    <strong className="text-cyan-400">Prashna:</strong> {latestAnswer.question}
                  </div>
                  <div className="text-emerald-100 whitespace-pre-wrap leading-relaxed text-xs">
                    {latestAnswer.answer}
                  </div>
                </div>
              </div>
            )}

            {/* Unsaved Contact Prompt (If user asks to call/msg an unknown name) */}
            {missingContactData && (
              <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/60 text-xs flex flex-col gap-2">
                <div className="font-tech font-bold text-amber-300">
                  ⚠️ "{missingContactData.name}" contacts mein nahi mila:
                </div>
                <p className="text-[11px] text-slate-300">
                  Kripya number type karein taaki FIXA turant {missingContactData.action === 'call' ? 'Call' : 'WhatsApp'} connect kar sake:
                </p>
                <input
                  type="text"
                  value={unsavedNumber}
                  onChange={(e) => setUnsavedNumber(e.target.value)}
                  placeholder="Enter 10-digit mobile number..."
                  className="bg-black/80 border border-amber-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleProceedWithUnsavedNumber(false)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-tech font-bold text-xs"
                  >
                    Direct Connect
                  </button>
                  <button
                    onClick={() => handleProceedWithUnsavedNumber(true)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" /> Save & Connect
                  </button>
                </div>
              </div>
            )}

            {/* WhatsApp Auto-Type Toast / Confirmation */}
            {whatsAppToast && (
              <div className="p-2.5 rounded-xl bg-green-950/90 border border-green-500/60 text-xs text-green-200 flex items-start gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px] font-tech">
                  {whatsAppToast}
                </div>
              </div>
            )}

            {/* Saved Contacts & Delete Section inside Floating Widget */}
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-cyan-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowContactsList(!showContactsList)}
                  className="flex items-center gap-1.5 text-xs font-tech font-bold text-cyan-300 hover:text-cyan-100"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SAVED CONTACTS ({contacts.length})</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showContactsList ? 'rotate-180' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddCustom(!showAddCustom)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-900/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-700/60 text-[10px] font-tech"
                >
                  <Plus className="w-3 h-3" />
                  <span>Custom No. Add</span>
                </button>
              </div>

              {/* Quick Add Custom Contact Form */}
              {showAddCustom && (
                <form onSubmit={handleAddCustomSubmit} className="p-2.5 rounded-xl bg-black/60 border border-cyan-800 flex flex-col gap-2">
                  <div className="text-[10px] font-tech text-cyan-400 font-bold uppercase">
                    Add Custom Number:
                  </div>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Contact Name (e.g. Vikram, Uncle)..."
                    className="bg-slate-900 border border-cyan-900 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Mobile Number (e.g. 9876543210)..."
                    className="bg-slate-900 border border-cyan-900 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="px-2 py-1 rounded text-[10px] text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-[10px]"
                    >
                      Save Number
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts List with Permanent Delete Symbol */}
              {showContactsList && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded-xl bg-slate-950 border border-cyan-950 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.avatarColor || 'from-cyan-500 to-blue-600'} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-tech font-bold text-cyan-200 truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] font-mono-code text-slate-400">
                            {c.phone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuickCall(c)}
                          className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-600/60 hover:bg-emerald-900 text-emerald-300"
                          title={`Call ${c.name}`}
                        >
                          <Phone className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickWhatsApp(c)}
                          className="p-1.5 rounded-lg bg-green-950 border border-green-600/60 hover:bg-green-900 text-green-300"
                          title={`WhatsApp ${c.name} (Auto-types message)`}
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                        {/* Clear Delete Mark on every contact */}
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(c.id, c.name)}
                          className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-red-950/80 border border-red-500/60 hover:bg-red-900 text-red-300 hover:text-white text-[10px] font-tech font-bold shadow-[0_0_8px_rgba(239,68,68,0.25)]"
                          title={`Delete ${c.name}`}
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                          <span>Del</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exact Voice Command Formats (As requested by user) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-tech uppercase text-cyan-400 tracking-wider flex items-center justify-between">
                <span>VOICE COMMAND FORMATS (ANY NAME & ANY MESSAGE):</span>
              </div>

              <div className="space-y-1.5">
                {/* Calling Pattern */}
                <button
                  onClick={() => onVoiceCommand("Papa ko call karo")}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-cyan-950 hover:border-emerald-500 text-left transition-all text-xs font-tech text-cyan-100 group"
                >
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-300">
                        "[Name] ko call karo"
                      </div>
                      <div className="text-[10px] text-slate-400">
                        e.g. "Rahul ko call karo", "Suresh ko call karo"
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    TEST
                  </span>
                </button>

                {/* WhatsApp Pattern */}
                <button
                  onClick={() => onVoiceCommand("Rahul ko massage kar do ki main 10 baje milta hoon")}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-cyan-950 hover:border-green-500 text-left transition-all text-xs font-tech text-cyan-100 group"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-green-400 shrink-0" />
                    <div>
                      <div className="font-bold text-green-300">
                        "[Name] ko massage kar do ki [Message]"
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Name & message kucch bhi bol sakte hain
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-green-950 text-green-400 border border-green-800">
                    TEST
                  </span>
                </button>
              </div>
            </div>

            {/* Quick App Launches */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onVoiceCommand("YouTube chalao")}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-cyan-950 hover:border-red-500 text-xs font-tech text-slate-200"
              >
                <Tv className="w-3.5 h-3.5 text-red-400" />
                <span>"YouTube chalao"</span>
              </button>

              <button
                onClick={() => onVoiceCommand("Camera on karo")}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-cyan-950 hover:border-cyan-500 text-xs font-tech text-slate-200"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>"Camera on karo"</span>
              </button>
            </div>

            {/* Direct Text Input */}
            <form onSubmit={handleQuickSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Kuch bhi poochiye ya command dein (e.g. 'Bharat ki rajdhani kya hai?')..."
                className="flex-1 bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-tech transition-colors"
                title="Execute"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
