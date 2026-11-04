import React, { useState } from 'react';
import { 
  Play, 
  ExternalLink, 
  Tv, 
  MessageSquare, 
  Compass, 
  Camera, 
  Music, 
  FileText, 
  Terminal, 
  Settings, 
  Sparkles, 
  CheckCircle,
  Volume2
} from 'lucide-react';
import type { VoiceCommand } from '../types/fixa';
import { playCommandBlip, playJarvisChime } from '../utils/audioFX';

interface VoiceAutomationPanelProps {
  onExecuteCommand: (cmd: string) => void;
  commandsHistory: VoiceCommand[];
  onSpeak: (text: string) => void;
}

export const VoiceAutomationPanel: React.FC<VoiceAutomationPanelProps> = ({
  onExecuteCommand,
  commandsHistory,
  onSpeak,
}) => {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const sampleVoicePrompts = [
    { text: "Rahul ko call karo", hint: "Calls contact by name directly", app: "Phone Call" },
    { text: "Papa ko phone lagao", hint: "Connects phone call to Papa instantly", app: "Phone Call" },
    { text: "Dileep ko WhatsApp message karo 'Main aa raha hoon'", hint: "Opens WhatsApp with contact & message", app: "WhatsApp" },
    { text: "Floating panel on karo", hint: "Displays screen overlay widget with user photo", app: "Floating HUD" },
    { text: "YouTube chalao", hint: "Launches YouTube & announces in sweet voice", app: "YouTube" },
    { text: "Camera on karo", hint: "Initializes optical viewfinder & edge detection", app: "Camera" },
    { text: "Torch jalao", hint: "Toggles high-beam illumination diodes", app: "Torch" },
    { text: "Call screen activate karo", hint: "Engages autonomous spam call interception", app: "Call Screener" },
  ];

  const appGrid = [
    { name: "YouTube", icon: Tv, url: "https://www.youtube.com", color: "from-red-600 to-rose-700", intent: "youtube chalao" },
    { name: "WhatsApp Web", icon: MessageSquare, url: "https://web.whatsapp.com", color: "from-emerald-600 to-teal-700", intent: "whatsapp chalao" },
    { name: "Google Maps", icon: Compass, url: "https://maps.google.com", color: "from-blue-600 to-cyan-700", intent: "maps open karo" },
    { name: "Spotify Music", icon: Music, url: "https://open.spotify.com", color: "from-green-600 to-emerald-800", intent: "spotify chalao" },
    { name: "Camera View", icon: Camera, action: "camera", color: "from-cyan-600 to-blue-700", intent: "camera on karo" },
    { name: "Study Notes", icon: FileText, action: "notes", color: "from-indigo-600 to-violet-700", intent: "notes banao" },
    { name: "Diagnostic Shell", icon: Terminal, action: "terminal", color: "from-slate-700 to-slate-900", intent: "system diagnostics check karo" },
    { name: "System Settings", icon: Settings, action: "settings", color: "from-amber-600 to-orange-700", intent: "device settings open karo" },
  ];

  const triggerVoiceCommand = (phrase: string, appName?: string) => {
    playJarvisChime();
    setLastAction(phrase);
    onExecuteCommand(phrase);
  };

  const launchApp = (app: typeof appGrid[0]) => {
    playCommandBlip();
    const spokenResponse = `Opening ${app.name} now, Boss. Launching neural application bridge.`;
    onSpeak(spokenResponse);
    setLastAction(`Launched ${app.name}`);

    if (app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    } else {
      onExecuteCommand(app.intent);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Voice Automation Control Deck */}
      <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-cyan-200">
                VOICE PIPELINE & NATIVE APP LAUNCHER
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Dual-lingual (English + Hindi/Hinglish) intent execution with audible Jarvis feedback
              </p>
            </div>
          </div>

          {lastAction && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-xs font-mono-code text-cyan-300">
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>LAST EXECUTED: "{lastAction}"</span>
            </div>
          )}
        </div>

        {/* Quick Voice Intent Trigger Chips */}
        <div>
          <div className="text-xs font-tech uppercase text-cyan-400 mb-3 tracking-wider flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5" />
            <span>CLICK TO TEST VOICE COMMANDS (ENGLISH & HINDI):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sampleVoicePrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => triggerVoiceCommand(item.text, item.app)}
                className="text-left p-3 rounded-xl bg-slate-900/70 border border-cyan-900/50 hover:border-cyan-500/60 hover:bg-cyan-950/40 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-tech font-bold text-sm text-cyan-200 group-hover:text-cyan-300 flex items-center gap-1.5">
                    <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                    "{item.text}"
                  </span>
                  <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {item.app}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans line-clamp-2">
                  {item.hint}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Connected Apps Grid */}
        <div className="mt-2">
          <div className="text-xs font-tech uppercase text-cyan-400 mb-3 tracking-wider">
            CONNECTED THIRD-PARTY APPS & SERVICES:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {appGrid.map((app, idx) => {
              const IconComp = app.icon;
              return (
                <button
                  key={idx}
                  onClick={() => launchApp(app)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-cyan-950 hover:border-cyan-700/60 hover:bg-slate-800/80 transition-all text-left group"
                >
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${app.color} text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-tech font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                      {app.name}
                    </div>
                    <div className="text-[10px] font-mono-code text-slate-400 truncate flex items-center gap-1">
                      <span>VOICE-READY</span>
                      {app.url && <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Voice Execution History Log */}
      <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
          <h4 className="font-cyber font-bold text-sm text-cyan-300 tracking-wider">
            VOICE COMMAND EXECUTION STREAM
          </h4>
          <span className="text-xs font-mono-code text-slate-400">
            TOTAL LOGGED: {commandsHistory.length}
          </span>
        </div>

        {commandsHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 font-tech text-sm">
            No voice commands executed yet. Click a test command above or speak via microphone!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {commandsHistory.map((cmd) => (
              <div
                key={cmd.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-cyan-950 hover:border-cyan-900 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                  <div>
                    <div className="font-tech text-sm font-semibold text-cyan-100">
                      "{cmd.transcript}"
                    </div>
                    <div className="text-xs text-slate-400 font-mono-code">
                      FIXA: "{cmd.response}"
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto text-[11px] font-mono-code text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-900">
                    {cmd.category.toUpperCase()}
                  </span>
                  <span>{cmd.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
