// Speech Recognition & Beautiful Female Voice Speech Synthesis ("Sundar Ladki Ki Awaaz")

export class FixaVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isSpeaking = false;
  private onStateChange: ((state: 'idle' | 'listening' | 'speaking') => void) | null = null;
  private selectedVoiceURI: string | null = null;
  private pitch = 1.18; // Sweet, melodic, clear female pitch
  private rate = 1.0;   // Calm, natural, graceful cadence
  private cachedBestVoice: SpeechSynthesisVoice | null = null;

  constructor(onStateChange?: (state: 'idle' | 'listening' | 'speaking') => void) {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis || null;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'hi-IN'; // Prioritize Hindi / Indian English recognition
      }

      // Pre-warm and cache voices
      if (this.synth) {
        const updateCache = () => {
          this.cachedBestVoice = this.getBestFemaleVoice();
        };
        updateCache();
        this.synth.onvoiceschanged = updateCache;
      }
    }
    if (onStateChange) {
      this.onStateChange = onStateChange;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public getBestFemaleVoice(text?: string): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    if (this.cachedBestVoice && !text && !this.selectedVoiceURI) {
      return this.cachedBestVoice;
    }
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    if (this.selectedVoiceURI) {
      const custom = voices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (custom) return custom;
    }

    const isHindiText = text && /[\u0900-\u097F]|aap|boss|chalao|karo|banao|hai|hoon|kya|ji/i.test(text);

    // List of top preferred female voice indicators
    const femaleKeywords = [
      'female', 'woman', 'girl', 'lekha', 'veena', 'neerja', 'heera',
      'samantha', 'victoria', 'karen', 'zira', 'moira', 'fiona', 'tessa',
      'allison', 'ava', 'susan', 'serena', 'swara', 'priya', 'kalpana', 'geeta'
    ];

    const maleKeywords = [
      'male', 'man', 'boy', 'daniel', 'george', 'oliver', 'david', 'mark', 'guy', 'rishi', 'neil'
    ];

    const isFemale = (v: SpeechSynthesisVoice) => {
      const name = v.name.toLowerCase();
      const hasMale = maleKeywords.some(m => name.includes(m));
      if (hasMale) return false;
      return femaleKeywords.some(f => name.includes(f));
    };

    // 1. If Hindi text, prefer Hindi female voice
    if (isHindiText) {
      const hindiFemale = voices.find(v => (v.lang.startsWith('hi') || v.lang.startsWith('en-IN')) && isFemale(v));
      if (hindiFemale) return hindiFemale;
      const anyHindi = voices.find(v => v.lang.startsWith('hi'));
      if (anyHindi) return anyHindi;
    }

    // 2. High-quality sweet female voices across Indian & Global English
    const priorityFemale = voices.find(v => 
      v.name.includes('Google UK English Female') ||
      v.name.includes('Google हिन्दी') ||
      v.name.includes('Microsoft Heera') ||
      v.name.includes('Lekha') ||
      v.name.includes('Veena') ||
      v.name.includes('Neerja') ||
      v.name.includes('Samantha') ||
      v.name.includes('Victoria') ||
      v.name.includes('Karen') ||
      v.name.includes('Microsoft Zira')
    );
    if (priorityFemale) return priorityFemale;

    // 3. Any voice marked as female
    const anyFemale = voices.find(isFemale);
    if (anyFemale) return anyFemale;

    // 4. Any English or natural voice (avoiding male keywords)
    const nonMale = voices.find(v => {
      const name = v.name.toLowerCase();
      return !maleKeywords.some(m => name.includes(m)) && (v.lang.startsWith('en') || v.lang.startsWith('hi'));
    });
    if (nonMale) return nonMale;

    return voices[0] || null;
  }

  public setVoice(voiceURI: string): void {
    this.selectedVoiceURI = voiceURI;
  }

  public setPitch(pitch: number): void {
    this.pitch = Math.max(0.5, Math.min(2.0, pitch));
  }

  public setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  public speak(text: string, onEnd?: () => void): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.synth.cancel();

    // Clean text for sweet speech delivery
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    const voice = this.getBestFemaleVoice(cleanText);
    if (voice) {
      utterance.voice = voice;
    }

    // Melodic, warm, sweet female voice tuning
    utterance.pitch = this.pitch; // 1.18 provides sweet, feminine clarity
    utterance.rate = this.rate;   // 1.0 provides graceful, natural speed

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStateChange) this.onStateChange('speaking');
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange('idle');
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange('idle');
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      if (this.onStateChange) this.onStateChange('idle');
    }
  }

  public startListening(
    onResult: (transcript: string) => void,
    onError?: (err: any) => void
  ): boolean {
    if (!this.recognition) return false;

    try {
      this.stopSpeaking();
      if (this.onStateChange) this.onStateChange('listening');

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (this.onStateChange) this.onStateChange('idle');
        onResult(transcript);
      };

      this.recognition.onerror = (event: any) => {
        if (this.onStateChange) this.onStateChange('idle');
        if (onError) onError(event);
      };

      this.recognition.onend = () => {
        if (this.onStateChange) this.onStateChange('idle');
      };

      this.recognition.start();
      return true;
    } catch (e) {
      if (this.onStateChange) this.onStateChange('idle');
      if (onError) onError(e);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      if (this.onStateChange) this.onStateChange('idle');
    }
  }

  public isAvailable(): boolean {
    return !!this.recognition;
  }
}
