
import React, { useEffect, useRef, useState } from 'react';
import { Modality } from '@google/genai';
import { Volume2, X, Loader2, Sparkles } from 'lucide-react';
import { encodeAudio, decodeAudio, decodeAudioData, getAIClient, rotateKey } from '../services/geminiService';

interface LiveVoiceSessionProps {
  onClose: () => void;
  noteContext: string;
}

const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({ onClose, noteContext }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    const startSession = async () => {
      try {
        const ai = getAIClient();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        }
        if (!outAudioContextRef.current) {
          outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            systemInstruction: `You are an AI note assistant for Arafath project. Helping user with this context: ${noteContext}`,
          },
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              setIsActive(true);
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ 
                    media: { data: encodeAudio(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
                  });
                });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current!.destination);
            },
            onmessage: async (msg) => {
              const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && outAudioContextRef.current) {
                const ctx = outAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decodeAudio(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });
              }
              if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              if (isActive) onClose();
            },
            onerror: (e) => {
              console.error('Live API Error:', e);
              // Handle potential auth/quota errors during connection
              if (isConnecting && connectionAttempts < 2) {
                rotateKey();
                setConnectionAttempts(prev => prev + 1);
              } else {
                onClose();
              }
            }
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (e) {
        console.error('Failed to start Live session:', e);
        if (connectionAttempts < 2) {
          rotateKey();
          setConnectionAttempts(prev => prev + 1);
        } else {
          onClose();
        }
      }
    };

    startSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outAudioContextRef.current) outAudioContextRef.current.close();
    };
  }, [noteContext, onClose, connectionAttempts]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="p-8 text-center">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="text-brand-500 animate-pulse" size={24} />
              <span className="font-bold dark:text-white uppercase tracking-widest text-xs">Live Neural Session</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all">
              <X size={20} className="dark:text-white" />
            </button>
          </div>
          
          <div className="py-12 flex flex-col items-center">
            {isConnecting ? (
              <div className="flex flex-col items-center gap-6">
                <Loader2 className="animate-spin text-brand-600" size={48} />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Synchronizing API Hub</p>
              </div>
            ) : (
              <div className="relative">
                <div className={`absolute -inset-8 bg-brand-500/20 rounded-full animate-ping ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                <div className="w-28 h-28 bg-brand-600 rounded-[40px] flex items-center justify-center relative shadow-2xl shadow-brand-600/30">
                  <Volume2 size={44} className="text-white" />
                </div>
              </div>
            )}
            <h3 className="mt-12 text-xl font-bold dark:text-white tracking-tight">
              {isConnecting ? 'Establishing Uplink...' : 'Arafath, I\'m Listening'}
            </h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-4 px-8 leading-relaxed">
              Speak naturally. I can analyze your active workspace and answer complex technical queries in real-time.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t dark:border-white/5">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Terminate Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveVoiceSession;
