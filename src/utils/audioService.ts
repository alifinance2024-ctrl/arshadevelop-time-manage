/**
 * Web Audio synthesizer for pleasant offline haptic and auditory feedback,
 * and Speech Recognition service (supporting browser Web Speech API fa-IR
 * and local offline Whisper processor).
 */

class AudioService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Plays a pleasant chime when a task is completed
   */
  playSuccessChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.28); // C6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  }

  /**
   * Recording start chirp
   */
  playStartRecordChirp(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Recording stop chirp
   */
  playStopRecordChirp(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.09);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }
}

export const audioService = new AudioService();

/**
 * Checks if browser has native speech recognition
 */
export function isBrowserSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Native SpeechRecognition interface fallback
 */
export interface SpeechRecognitionListener {
  onStart: () => void;
  onResult: (text: string, isFinal: boolean) => void;
  onError: (err: string) => void;
  onEnd: () => void;
}

export class OfflineSpeechController {
  private recognition: any = null;
  private isListening = false;

  constructor(private listeners: SpeechRecognitionListener) {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'fa-IR';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.listeners.onStart();
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const combined = finalTranscript || interimTranscript;
          if (combined) {
            this.listeners.onResult(combined, Boolean(finalTranscript));
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          this.listeners.onError(event.error);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.listeners.onEnd();
        };
      }
    }
  }

  start(): void {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('SpeechRecognition start failed:', e);
      }
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('SpeechRecognition stop failed:', e);
      }
    }
  }
}
