import React, { useState, useRef, useEffect } from 'react';
import { Note, Language } from '../types';
import { translations } from '../translations';
import { 
  Plus, Search, FileCode, Trash2, 
  Files, Brain, MessageSquare, ChevronDown,
  Moon, Sun, Terminal, Globe, Check
} from 'lucide-react';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  onDeleteNote: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenLive: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onAddNote,
  onDeleteNote,
  searchQuery,
  setSearchQuery,
  onOpenLive,
  darkMode,
  setDarkMode,
  language,
  setLanguage
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = translations[language];
  
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.updatedAt - a.updatedAt);

  const availableLanguages: { code: Language; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'ko', name: 'Korean', native: '한국어' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex h-full border-r dark:border-white/[0.04] bg-[#fcfcfc] dark:bg-[#0a0a0a]">
      {/* Activity Bar */}
      <div className="w-[64px] bg-white dark:bg-[#080808] border-r dark:border-white/[0.04] flex flex-col items-center py-8 gap-8 shrink-0 relative">
        <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-xl shadow-brand-600/10 transition-all">
          <Terminal size={22} />
        </div>
        
        <div className="w-8 h-[1px] bg-slate-100 dark:bg-white/[0.04]" />
        
        <div className="flex flex-col gap-6">
          <button className="p-2.5 text-brand-600 dark:text-brand-500 bg-brand-500/5 rounded-xl transition-all">
            <Files size={22} />
          </button>
          <button 
            onClick={onOpenLive}
            className="p-2.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
          ><MessageSquare size={22} /></button>
          <button className="p-2.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
            <Brain size={22} />
          </button>
        </div>
        
        <div className="mt-auto flex flex-col items-center gap-4 pb-4">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className={`p-2.5 rounded-xl transition-all flex flex-col items-center gap-1 ${isLangMenuOpen ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
              title="Change Language"
            >
              <Globe size={22} />
              <span className="text-[8px] font-bold uppercase">{language}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute bottom-0 left-16 w-48 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-premium z-[300] py-2 animate-in slide-in-from-left-2 duration-200">
                <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b dark:border-white/[0.04] mb-1">
                  Select Language
                </div>
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center justify-between text-xs transition-all ${
                      language === lang.code 
                        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{lang.native}</span>
                      <span className="text-[9px] opacity-60">{lang.name}</span>
                    </div>
                    {language === lang.code && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
          >
            {darkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>
      </div>

      <div className="w-68 flex flex-col overflow-hidden bg-[#fcfcfc] dark:bg-[#0a0a0a]">
        <div className="px-6 py-8 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">{t.navigator}</h2>
          <button 
            onClick={onAddNote} 
            className="p-2 text-brand-600 dark:text-brand-500 hover:bg-brand-500/10 rounded-lg active:scale-90 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="px-5 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-brand-600" size={14} />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] rounded-2xl text-[11px] dark:text-white outline-none focus:ring-4 focus:ring-brand-500/5 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto vscode-scroll px-3 pb-8">
          <div className="px-4 py-3 flex items-center gap-2 text-[9px] font-bold text-slate-400 dark:text-slate-700 uppercase tracking-widest mb-2">
            <ChevronDown size={12} /> {t.sourceFiles}
          </div>
          <div className="space-y-1">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group relative px-4 py-3 flex items-center gap-4 cursor-pointer rounded-2xl transition-all ${
                  activeNoteId === note.id 
                    ? 'bg-white dark:bg-white/[0.03] text-brand-700 dark:text-brand-400 shadow-sm border border-slate-200/50 dark:border-white/[0.04]' 
                    : 'hover:bg-slate-100/50 dark:hover:bg-white/[0.01] text-slate-500 dark:text-slate-500'
                }`}
              >
                <div className={activeNoteId === note.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-300 dark:text-slate-800'}>
                  <FileCode size={18} />
                </div>
                <span className="flex-1 truncate text-xs font-medium">
                  {note.title || 'Untitled'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                  className="p-1.5 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;