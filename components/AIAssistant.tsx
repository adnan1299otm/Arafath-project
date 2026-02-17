import React, { useState, useRef, useEffect } from 'react';
import { Note, ChatMessage, GroundingChunk, Language, AIAction } from '../types';
import { translations } from '../translations';
import { performAITask } from '../services/geminiService';
import { Send, Sparkles, X, Loader2, Brain, Globe, ExternalLink, Bot, User, Zap } from 'lucide-react';

interface AIAssistantProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ note, isOpen, onClose, language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useThink, setUseThink] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  if (!isOpen || !note) return null;

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const mode = (useThink ? 'think' : useSearch ? 'search' : 'chat') as AIAction;
      const result = await performAITask(mode, { ...note, content: input + "\n Context: " + note.content }, language);
      
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        text: result.text, 
        grounding: result.grounding as GroundingChunk[],
        isThinking: useThink 
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: t.error,
        isThinking: false
      }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className={`
      fixed inset-y-0 right-0 z-[100] flex flex-col bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-3xl shadow-premium transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) transform
      w-full sm:w-[500px]
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      border-l dark:border-white/[0.04]
    `}>
      {/* Header */}
      <div className="p-6 lg:p-8 flex items-center justify-between border-b dark:border-white/[0.04]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-600/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wide uppercase text-slate-900 dark:text-white">{t.neuralAssistant}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-soft" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{t.activeIntelligence}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-all">
          <X size={22} />
        </button>
      </div>

      {/* Logic Toggles */}
      <div className="flex px-6 py-4 bg-[#fafafa] dark:bg-black/20 gap-2 shrink-0">
        <button 
          onClick={() => {setUseThink(!useThink); setUseSearch(false);}}
          className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${useThink ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
        >
          <Brain size={14} /> {t.deepAnalysis}
        </button>
        <button 
          onClick={() => {setUseSearch(!useSearch); setUseThink(false);}}
          className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${useSearch ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
        >
          <Globe size={14} /> {t.knowledgeBase}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto vscode-scroll px-6 lg:px-8 py-8 space-y-8" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-10 opacity-30">
            <Bot size={44} className="text-slate-400 mb-6" />
            <p className="text-[12px] font-bold uppercase tracking-widest text-slate-900 dark:text-white">{t.aiWaiting}</p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed font-medium">
              {t.aiWaitingSub}
            </p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 lg:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-100 dark:bg-white/10 text-slate-400' : 'bg-brand-600 text-white'}`}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            
            <div className={`max-w-[85%]`}>
              <div className={`p-5 rounded-[28px] text-[14px] leading-[1.7] font-medium shadow-premium ${
                msg.role === 'user' 
                  ? 'bg-slate-900 dark:bg-brand-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 border dark:border-white/[0.04] rounded-tl-none'
              }`}>
                {msg.isThinking && <div className="text-[10px] font-bold text-brand-500 dark:text-brand-400 mb-3 uppercase tracking-widest flex items-center gap-2"><Brain size={12}/> {t.aiThinking}</div>}
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.grounding && msg.grounding.length > 0 && (
                  <div className="mt-6 pt-5 border-t dark:border-white/5">
                    <p className="text-[9px] font-bold text-slate-400 mb-3 uppercase tracking-widest">{t.groundingCitations}</p>
                    <div className="space-y-2">
                      {msg.grounding.map((chunk, idx) => chunk.web && (
                        <a key={idx} href={chunk.web.uri || '#'} target="_blank" className="flex items-center gap-2 text-[11px] text-brand-600 dark:text-brand-500 hover:underline py-2.5 px-3.5 bg-white dark:bg-black/40 rounded-xl border dark:border-white/5 truncate transition-all">
                          <ExternalLink size={12} /> {chunk.web.title || chunk.web.uri}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4 lg:gap-6">
             <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shrink-0">
               <Bot size={18} />
             </div>
             <div className="bg-slate-50 dark:bg-white/[0.03] px-5 py-4 rounded-[28px] flex items-center gap-4">
               <div className="flex gap-1.5">
                 <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.synthesizing}</span>
             </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-6 lg:p-8 bg-white dark:bg-[#0c0c0c] border-t dark:border-white/[0.04]">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={t.typePrompt}
            className="w-full bg-slate-50 dark:bg-white/[0.02] border-none rounded-[24px] px-6 py-5 pr-14 outline-none text-sm font-medium transition-all resize-none shadow-inner-soft dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-800"
            rows={2}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3.5 bottom-3.5 p-3 bg-brand-600 text-white rounded-[18px] hover:bg-brand-700 disabled:opacity-20 transition-all shadow-xl shadow-brand-600/20 active:scale-90"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;