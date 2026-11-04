export type FixaState = 'idle' | 'listening' | 'speaking' | 'analyzing' | 'alert';

export type ActiveModule = 
  | 'hud'
  | 'voice_apps'
  | 'contacts'
  | 'call_screener'
  | 'research_engine'
  | 'academic_tutor'
  | 'study_notes'
  | 'security_vault'
  | 'blueprint';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  relationship?: string;
  avatarColor?: string;
  isFavorite?: boolean;
}

export interface VoiceCommand {
  id: string;
  timestamp: string;
  transcript: string;
  response: string;
  actionExecuted?: string;
  category: 'system' | 'app' | 'research' | 'academic' | 'call';
}

export interface CallLog {
  id: string;
  callerNumber: string;
  callerName?: string;
  timestamp: string;
  status: 'screened' | 'blocked' | 'urgent' | 'in_progress';
  transcript: { speaker: 'caller' | 'fixa'; text: string; time: string }[];
  summary?: {
    caller: string;
    location: string;
    reason: string;
    keyPoints: string[];
    urgency: string;
    recommendedAction: string;
    sentiment: string;
  };
}

export interface ResearchDossier {
  id: string;
  topic: string;
  timestamp: string;
  content: string;
  status: 'completed' | 'generating';
}

export interface AcademicSolution {
  id: string;
  problem: string;
  domain: string;
  solution: string;
  timestamp: string;
}

export interface StudyNote {
  id: string;
  title: string;
  timestamp: string;
  content: string;
  flashcards?: { question: string; answer: string }[];
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event: string;
  status: 'blocked' | 'sanitized' | 'authorized';
  details: string;
}
