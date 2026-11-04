import React, { useState } from 'react';
import { 
  PhoneIncoming, 
  PhoneCall, 
  PhoneOff, 
  ShieldAlert, 
  FileText, 
  Download, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Sparkles,
  Send
} from 'lucide-react';
import type { CallLog } from '../types/fixa';
import { playCallRingTone, playJarvisChime, playCommandBlip } from '../utils/audioFX';

interface CallScreeningPanelProps {
  onSpeak: (text: string) => void;
}

export const CallScreeningPanel: React.FC<CallScreeningPanelProps> = ({ onSpeak }) => {
  const [activeCall, setActiveCall] = useState<{
    number: string;
    label: string;
    inProgress: boolean;
    stage: 'ringing' | 'connected' | 'completed';
    transcript: { speaker: 'caller' | 'fixa'; text: string; time: string }[];
  } | null>(null);

  const [callerInput, setCallerInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<CallLog['summary'] | null>(null);

  const [callHistory, setCallHistory] = useState<CallLog[]>([
    {
      id: 'call-101',
      callerNumber: '+91 98765-43210',
      callerName: 'Apex Financial Services',
      timestamp: 'Today, 10:14 AM',
      status: 'blocked',
      transcript: [
        { speaker: 'caller', text: 'Hello, am I speaking to the owner? We have an exclusive pre-approved loan of 15 Lakhs at zero processing fee.', time: '10:14:02' },
        { speaker: 'fixa', text: 'Greetings. I am FIXA, personal executive AI to the device owner. My Boss does not entertain unsolicited financial solicitations. Please remove this number from your registry.', time: '10:14:08' },
        { speaker: 'caller', text: 'Sir but this is a limited time rate...', time: '10:14:14' },
        { speaker: 'fixa', text: 'The request has been formally declined and logged into carrier-level spam deflection. Ending connection.', time: '10:14:19' }
      ],
      summary: {
        caller: 'Apex Financial Services (+91 98765-43210)',
        location: 'Mumbai Central Gateway, Maharashtra',
        reason: 'Unsolicited commercial credit loan solicitation',
        keyPoints: [
          'Offered 15 Lakhs INR unsecured personal loan.',
          'FIXA stated Boss policy against cold calling.',
          'Caller attempted secondary push; FIXA terminated line.'
        ],
        urgency: 'Spam/Malicious',
        recommendedAction: 'Permanent carrier block & telecom regulatory report',
        sentiment: 'Aggressive / Telemarketing'
      }
    },
    {
      id: 'call-102',
      callerNumber: '+1 415-555-0199',
      callerName: 'Sarah Jenkins (Horizon AI Labs)',
      timestamp: 'Yesterday, 04:32 PM',
      status: 'urgent',
      transcript: [
        { speaker: 'caller', text: 'Hi, this is Sarah from Horizon AI Labs in San Francisco. I am calling regarding the autonomous systems architecture proposal.', time: '16:32:05' },
        { speaker: 'fixa', text: 'Good day Ms. Jenkins. I am FIXA. My Boss is currently in deep focus mode. Could you confirm the project timeline and preferred callback window?', time: '16:32:12' },
        { speaker: 'caller', text: 'Yes, our engineering team reviewed the specs and wants to schedule a sync tomorrow at 3 PM PST. Callback number is 415-555-0199.', time: '16:32:20' },
        { speaker: 'fixa', text: 'Information recorded and flagged as High Priority. A calendar brief has been dispatched to my Boss. Thank you.', time: '16:32:27' }
      ],
      summary: {
        caller: 'Sarah Jenkins (Horizon AI Labs)',
        location: 'San Francisco, CA, USA',
        reason: 'Follow-up on autonomous systems architecture proposal sync',
        keyPoints: [
          'Engineering team reviewed technical specifications.',
          'Requested sync tomorrow at 3:00 PM PST.',
          'Provided direct callback line.'
        ],
        urgency: 'High Priority',
        recommendedAction: 'Schedule calendar slot & review specs proposal before 3 PM',
        sentiment: 'Cooperative / Executive'
      }
    }
  ]);

  const simulateIncomingCall = (number: string, label: string, initialCallerSpeech: string) => {
    playCallRingTone();
    setActiveCall({
      number,
      label,
      inProgress: true,
      stage: 'ringing',
      transcript: []
    });
    setCurrentSummary(null);

    // Auto answer after 1.8 seconds like FIXA autonomous daemon
    setTimeout(() => {
      playJarvisChime();
      setActiveCall(prev => {
        if (!prev) return null;
        return {
          ...prev,
          stage: 'connected',
          transcript: [
            {
              speaker: 'fixa',
              text: "Greetings. I am FIXA, autonomous executive assistant to the device owner. Your call is being screened and recorded for verification. Please state your name, organization, and the purpose of your call.",
              time: new Date().toLocaleTimeString()
            }
          ]
        };
      });

      onSpeak("Greetings. I am FIXA, autonomous executive assistant to the device owner. Please state your name and purpose of your call.");

      // Caller speaks their first statement after a brief pause
      setTimeout(() => {
        sendCallerTurn(initialCallerSpeech, number);
      }, 3500);
    }, 1800);
  };

  const sendCallerTurn = async (callerText: string, callNumber?: string) => {
    if (!callerText.trim()) return;
    playCommandBlip();

    const timestamp = new Date().toLocaleTimeString();
    const updatedTranscript = [
      ...(activeCall?.transcript || []),
      { speaker: 'caller' as const, text: callerText, time: timestamp }
    ];

    setActiveCall(prev => prev ? ({ ...prev, transcript: updatedTranscript }) : null);
    setCallerInput('');
    setIsAiResponding(true);

    try {
      // Call server-side Gemini screening endpoint
      const res = await fetch('/api/fixa/call-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerSpeech: callerText,
          history: updatedTranscript,
        })
      });
      const data = await res.json();
      const reply = data.reply || "Thank you for the information. I have recorded your message for my Boss.";
      
      const newTranscript = [
        ...updatedTranscript,
        { speaker: 'fixa' as const, text: reply, time: new Date().toLocaleTimeString() }
      ];

      setActiveCall(prev => prev ? ({ ...prev, transcript: newTranscript }) : null);
      onSpeak(reply);

      // If call is concluding or flagged, finalize summary
      if (data.screeningStage === 'flagged_spam' || data.screeningStage === 'concluded' || newTranscript.length >= 6) {
        setTimeout(() => {
          finalizeCall(callNumber || activeCall?.number || "Unknown Caller", newTranscript);
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiResponding(false);
    }
  };

  const finalizeCall = async (number: string, transcript: any[]) => {
    playCommandBlip();
    setActiveCall(prev => prev ? ({ ...prev, stage: 'completed' }) : null);

    try {
      const res = await fetch('/api/fixa/call-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          callerNumber: number,
          timestamp: new Date().toLocaleString(),
        })
      });
      const summary = await res.json();
      setCurrentSummary(summary);

      const newLog: CallLog = {
        id: `call-${Date.now()}`,
        callerNumber: number,
        callerName: summary.caller,
        timestamp: 'Just now',
        status: summary.urgency === 'Spam/Malicious' ? 'blocked' : summary.urgency === 'High Priority' ? 'urgent' : 'screened',
        transcript,
        summary
      };

      setCallHistory(prev => [newLog, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const exportSummaryAsText = (summary: CallLog['summary'], number: string) => {
    if (!summary) return;
    const report = `=====================================================
FIXA AUTONOMOUS CALL SCREENING INTELLIGENCE REPORT
=====================================================
Target / Caller : ${summary.caller} (${number})
Location        : ${summary.location}
Urgency Status  : ${summary.urgency}
Sentiment       : ${summary.sentiment}
Primary Reason  : ${summary.reason}

KEY DISCUSSION POINTS:
${summary.keyPoints.map((pt, i) => `[${i + 1}] ${pt}`).join('\n')}

ACTIONABLE DIRECTIVE:
${summary.recommendedAction}

Generated by FIXA Zero-Disclosure Autonomous Daemon
=====================================================`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FIXA_Call_Report_${number.replace(/\D/g, '') || 'summary'}.txt`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Simulation Launcher & Status */}
      <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyan-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cyber font-bold text-lg text-cyan-200">
                AUTONOMOUS CALL SCREENING & INTERCEPTION
              </h3>
              <p className="text-xs text-slate-400 font-tech">
                Filters unknown and spam callers, records audio dialog, and generates structured intelligence briefings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono-code text-emerald-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AI INTERCEPTOR: ARMED</span>
          </div>
        </div>

        {/* Trigger incoming call simulations */}
        <div>
          <div className="text-xs font-tech uppercase text-cyan-400 mb-3 tracking-wider flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>LAUNCH LIVE INCOMING CALL SIMULATION:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => simulateIncomingCall(
                "+91 98112-33445",
                "Spam Credit Card Telesales",
                "Hello, calling from Royal Bank. We have a pre-approved platinum credit card with lifetime free lounge access. Shall I confirm your address?"
              )}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-red-900/50 hover:border-red-500/60 text-left transition-all hover:bg-red-950/20 group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-tech font-bold text-sm text-red-300">
                  ⚠️ Telemarketer / Spam
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                  SIMULATE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                +91 98112-33445 (Credit card tele-sales bot)
              </p>
            </button>

            <button
              onClick={() => simulateIncomingCall(
                "+1 650-899-7722",
                "Executive Investor Sync",
                "Good morning, this is David Zhao from Vertex Venture Capital. Calling to confirm the term sheet review meeting with the Boss."
              )}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-blue-900/50 hover:border-blue-500/60 text-left transition-all hover:bg-blue-950/20 group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-tech font-bold text-sm text-blue-300">
                  💼 High-Priority Executive
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  SIMULATE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                +1 650-899-7722 (Vertex VC Term Sheet Sync)
              </p>
            </button>

            <button
              onClick={() => simulateIncomingCall(
                "+91 88002-11993",
                "Delivery Courier Agent",
                "Bhaiya, BlueDart courier se bol raha hoon. Aapke building ke gate par hoon, parcel collect kar lijiye."
              )}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-teal-900/50 hover:border-teal-500/60 text-left transition-all hover:bg-teal-950/20 group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-tech font-bold text-sm text-teal-300">
                  📦 Delivery Agent (Hindi)
                </span>
                <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800">
                  SIMULATE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                +91 88002-11993 (Gate parcel verification)
              </p>
            </button>
          </div>
        </div>

        {/* Live Active Call Screen HUD */}
        {activeCall && (
          <div className="p-5 rounded-2xl bg-black/90 border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.25)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-cyan-900/50 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 animate-pulse">
                  <PhoneIncoming className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-cyber font-bold text-cyan-200 text-base">
                    {activeCall.number}
                  </div>
                  <div className="text-xs text-slate-400 font-tech">
                    {activeCall.label} // STAGE: {activeCall.stage.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono-code text-red-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>REC // 256-BIT ENCRYPTED</span>
                </div>
                <button
                  onClick={() => finalizeCall(activeCall.number, activeCall.transcript)}
                  className="px-3 py-1.5 rounded-lg bg-red-950 text-red-300 border border-red-700/60 hover:bg-red-900 text-xs font-tech flex items-center gap-1.5"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>TERMINATE & SUMMARIZE</span>
                </button>
              </div>
            </div>

            {/* Live Transcript Stream */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-cyan-950 space-y-3 max-h-64 overflow-y-auto">
              {activeCall.transcript.map((t, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${t.speaker === 'fixa' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] font-mono-code text-slate-500 mb-0.5">
                    {t.speaker === 'fixa' ? '🛡️ FIXA AUTONOMOUS ASSISTANT' : '📞 CALLER SPEECH'} • {t.time}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed ${
                      t.speaker === 'fixa'
                        ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-100'
                        : 'bg-slate-900 border border-slate-700 text-slate-200'
                    }`}
                  >
                    {t.text}
                  </div>
                </div>
              ))}

              {isAiResponding && (
                <div className="flex items-center gap-2 text-xs font-tech text-cyan-400 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>FIXA reasoning & synthesizing verbal response...</span>
                </div>
              )}
            </div>

            {/* Interactive Caller Response Simulator Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (callerInput.trim()) sendCallerTurn(callerInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={callerInput}
                onChange={(e) => setCallerInput(e.target.value)}
                placeholder="Type caller reply to test live conversation (e.g., 'Main SBI branch se bol raha hoon...')"
                className="flex-1 bg-slate-900 border border-cyan-900 focus:border-cyan-400 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={isAiResponding}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-tech font-bold flex items-center gap-1.5"
              >
                <span>SEND</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Live Structured Intelligence Report for current call */}
        {currentSummary && (
          <div className="p-6 rounded-2xl bg-slate-900/90 border-2 border-emerald-500/50 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h4 className="font-cyber font-bold text-base text-emerald-200">
                  STRUCTURED CALL INTELLIGENCE BRIEFING
                </h4>
              </div>
              <button
                onClick={() => exportSummaryAsText(currentSummary, activeCall?.number || 'call')}
                className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900 text-xs font-tech flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT BRIEFING (.TXT)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] font-mono-code text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-400" /> CALLER IDENTIFICATION
                </div>
                <div className="font-tech font-bold text-sm text-emerald-100 mt-1">
                  {currentSummary.caller}
                </div>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] font-mono-code text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> GEOGRAPHIC GATEWAY
                </div>
                <div className="font-tech font-bold text-sm text-emerald-100 mt-1">
                  {currentSummary.location}
                </div>
              </div>

              <div className="bg-black/40 p-3 rounded-xl border border-emerald-950">
                <div className="text-[10px] font-mono-code text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-emerald-400" /> THREAT / URGENCY
                </div>
                <div className="font-tech font-bold text-sm text-amber-300 mt-1">
                  {currentSummary.urgency} ({currentSummary.sentiment})
                </div>
              </div>
            </div>

            <div className="bg-black/50 p-4 rounded-xl border border-emerald-950 space-y-2">
              <div className="text-xs font-tech font-semibold text-emerald-300 uppercase">
                PRIMARY REASON FOR CALLING:
              </div>
              <p className="text-xs text-slate-200">
                {currentSummary.reason}
              </p>
            </div>

            <div className="bg-black/50 p-4 rounded-xl border border-emerald-950 space-y-2">
              <div className="text-xs font-tech font-semibold text-emerald-300 uppercase">
                KEY DISCUSSION POINTS:
              </div>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                {currentSummary.keyPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800 text-xs font-tech flex items-center justify-between">
              <span className="text-cyan-200">
                <span className="font-bold text-cyan-400 uppercase">RECOMMENDED ACTION:</span> {currentSummary.recommendedAction}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Screened Calls Archive */}
      <div className="bg-slate-950/80 border border-cyan-700/40 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
          <h4 className="font-cyber font-bold text-sm text-cyan-300 tracking-wider">
            ARCHIVE OF SCREENED INCOMING CALLS ({callHistory.length})
          </h4>
          <span className="text-xs font-mono-code text-slate-400">
            AUTO-CLASSIFIED BY FIXA
          </span>
        </div>

        <div className="space-y-4">
          {callHistory.map((call) => (
            <div
              key={call.id}
              className="p-4 rounded-xl bg-slate-900/70 border border-cyan-950 hover:border-cyan-800 transition-colors flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${call.status === 'blocked' ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}>
                    <PhoneOff className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-tech font-bold text-sm text-slate-200">
                      {call.callerName || call.callerNumber}
                    </div>
                    <div className="text-xs font-mono-code text-slate-400">
                      {call.callerNumber} • {call.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono-code px-2 py-0.5 rounded uppercase ${
                    call.status === 'blocked' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {call.status}
                  </span>
                  {call.summary && (
                    <button
                      onClick={() => exportSummaryAsText(call.summary, call.callerNumber)}
                      className="text-xs font-tech text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Report
                    </button>
                  )}
                </div>
              </div>

              {call.summary && (
                <div className="text-xs text-slate-300 space-y-1 font-sans">
                  <div className="text-slate-400 font-semibold font-tech">
                    Reason: <span className="text-slate-200 font-normal">{call.summary.reason}</span>
                  </div>
                  <div className="text-slate-400 font-semibold font-tech">
                    Resolution: <span className="text-cyan-300 font-normal">{call.summary.recommendedAction}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
