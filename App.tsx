import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import AIAssistant from './components/AIAssistant';
import LiveVoiceSession from './components/LiveVoiceSession';
import { Note, AIAction, Language } from './types';
import { translations } from './translations';
import { performAITask, getLanguageFromTitle } from './services/geminiService';
import { 
  Sparkles, Star, BookOpen, Type, Plus, FileText, Loader2, Download, 
  Globe, BrainCircuit, AlertTriangle, Menu,
  Code2, Bug, X, Cpu, ChevronRight, Zap, Lightbulb
} from 'lucide-react';

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('lumina-notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-lang') as Language;
    return saved || 'en';
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('lumina-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('app-lang', language);
  }, [language]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;
  const detectedLanguage = activeNote ? getLanguageFromTitle(activeNote.title) : 'plaintext';
  const isCodeFile = detectedLanguage !== 'plaintext' && detectedLanguage !== 'markdown';

  const handleCreateProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProjectTitle.trim()) return;
    
    const newNote: Note = {
      id: uuidv4(),
      title: newProjectTitle,
      content: '',
      updatedAt: Date.now(),
      tags: [],
      isFavorite: false
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setNewProjectTitle('');
    setShowNewProjectModal(false);
    setIsSidebarOpen(false);
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const runAiTask = async (action: AIAction) => {
    if (!activeNote || isAiProcessing) return;
    setIsAiProcessing(true);
    setApiError(null);
    try {
      const result = await performAITask(action, activeNote, language);
      let content = activeNote.content;
      if (action === 'improve' || action === 'fix') {
        content = result.text;
      } else {
        const header = action === 'think' ? t.deepThink : action === 'search' ? t.search : action.toUpperCase();
        content += `\n\n---\n### ${header}\n${result.text}`;
      }
      handleUpdateNote(activeNote.id, { content });
    } catch (error: any) {
      setApiError(error.message);
    } finally { setIsAiProcessing(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#fdfdfd] dark:bg-[#080808] overflow-hidden">
      
      {/* Sidebar */}
      <div className={`
        fixed inset-0 z-50 lg:relative lg:translate-x-0 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex h-full
      `}>
        <Sidebar 
          notes={notes} activeNoteId={activeNoteId} 
          onSelectNote={(id) => { setActiveNoteId(id); setIsSidebarOpen(false); }} 
          onAddNote={() => setShowNewProjectModal(true)} 
          onDeleteNote={(id) => setNotes(n => n.filter(x => x.id !== id))}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          onOpenLive={() => { setIsLiveOpen(true); setIsSidebarOpen(false); }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          language={language}
          setLanguage={setLanguage}
        />
        {isSidebarOpen && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm -z-10 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
      </div>

      <main className="flex-1 flex flex-col bg-white dark:bg-[#080808] relative min-w-0">
        
        {/* Mobile Navbar */}
        <div className="lg:hidden h-16 border-b dark:border-white/[0.04] flex items-center justify-between px-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-20">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400"><Menu size={22} /></button>
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 font-sans">{t.projectName}</div>
          <button onClick={() => setIsAiOpen(true)} className="p-2 -mr-2 text-brand-500"><Zap size={20} /></button>
        </div>

        {activeNote ? (
          <>
            {/* Header Toolbar */}
            <header className="h-16 border-b dark:border-white/[0.04] flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-[#080808] shrink-0 z-10">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2 group">
                  <div className={`p-2 rounded-xl ${isCodeFile ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'}`}>
                    {isCodeFile ? <Code2 size={16} /> : <FileText size={16} />}
                  </div>
                  <span className="text-xs font-bold truncate max-w-[150px] dark:text-slate-200">{activeNote.title}</span>
                </div>
                
                <div className="h-6 w-px bg-slate-200 dark:bg-white/[0.08] hidden sm:block" />
                
                <div className="hidden lg:flex items-center gap-1">
                  <button onClick={() => runAiTask('summarize')} className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
                    <BookOpen size={18}/> <span className="text-[11px] font-medium">{t.summarize}</span>
                  </button>
                  <button onClick={() => runAiTask('improve')} className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
                    <Type size={18}/> <span className="text-[11px] font-medium">{t.improve}</span>
                  </button>
                  <button onClick={() => runAiTask('think')} className="flex items-center gap-2 px-3 py-2 text-brand-500 hover:bg-brand-500/5 rounded-xl transition-all">
                    <BrainCircuit size={18}/> <span className="text-[11px] font-medium">{t.deepThink}</span>
                  </button>
                  <button onClick={() => runAiTask('search')} className="flex items-center gap-2 px-3 py-2 text-blue-500 hover:bg-blue-500/5 rounded-xl transition-all">
                    <Globe size={18}/> <span className="text-[11px] font-medium">{t.search}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsAiOpen(true)} 
                  className="bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xl shadow-brand-600/20 active:scale-95 transition-all"
                >
                  <Zap size={15} /> <span className="hidden sm:inline">{t.aiChat}</span>
                </button>
              </div>
            </header>

            {/* Editor Canvas */}
            <div className="flex-1 overflow-y-auto vscode-scroll bg-white dark:bg-[#080808] px-6 lg:px-24 py-10 lg:py-16 flex flex-col gap-6">
              <input
                type="text" value={activeNote.title}
                onChange={(e) => handleUpdateNote(activeNote.id, { title: e.target.value })}
                className="w-full text-3xl lg:text-5xl font-bold bg-transparent outline-none dark:text-white placeholder-slate-200 dark:placeholder-slate-800 tracking-tight"
                placeholder={t.projectName}
              />
              <textarea
                value={activeNote.content}
                onChange={(e) => handleUpdateNote(activeNote.id, { content: e.target.value })}
                className={`w-full flex-1 text-lg lg:text-xl leading-[1.8] bg-transparent outline-none resize-none dark:text-slate-300 placeholder-slate-200 dark:placeholder-slate-800 ${isCodeFile ? 'font-mono text-base' : 'font-sans'}`}
                placeholder={isCodeFile ? `// ...` : "..."}
              />
            </div>

            {/* High-End Footer */}
            <footer className="h-10 flex items-center justify-between px-8 text-[10px] font-bold text-slate-400 border-t dark:border-white/[0.03] bg-[#fcfcfc] dark:bg-black/40 shrink-0">
              <div className="flex items-center gap-8 uppercase tracking-widest">
                <div className="flex items-center gap-2 text-emerald-500">
                  <div className="w-1.5 h-1.5 bg-current rounded-full pulse-soft" />
                  {t.workspaceReady}
                </div>
                <div className="hidden sm:block">{activeNote.content.length} {t.characters}</div>
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-500">
                  <Cpu size={12} /> {detectedLanguage}
                </div>
              </div>
              <div className="text-brand-500 tracking-widest">{t.projectName}</div>
            </footer>

            <AIAssistant note={activeNote} isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} language={language} />
            {isLiveOpen && <LiveVoiceSession noteContext={activeNote.content} onClose={() => setIsLiveOpen(false)} />}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fafafa] dark:bg-[#080808]">
             <div className="w-full max-w-md p-10 bg-white dark:bg-[#0c0c0c] rounded-[40px] border border-slate-200/50 dark:border-white/[0.04] shadow-premium text-center transform transition-all duration-500">
                <div className="w-20 h-20 bg-brand-500/10 rounded-[30px] flex items-center justify-center mx-auto mb-8">
                  <Lightbulb size={40} className="text-brand-600 dark:text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{t.welcome}</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                  {t.welcomeSub}
                </p>
                <button 
                  onClick={() => setShowNewProjectModal(true)} 
                  className="w-full py-4 bg-brand-600 text-white rounded-[20px] font-bold shadow-2xl shadow-brand-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {t.createNew}
                </button>
             </div>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-2xl p-6">
          <div className="bg-white dark:bg-[#111111] w-full max-w-lg rounded-[40px] shadow-premium overflow-hidden border border-slate-200/60 dark:border-white/[0.04] animate-in zoom-in-95 duration-500 cubic-bezier(0.16, 1, 0.3, 1)">
            <div className="px-10 pt-10 pb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.newFile}</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{t.navigator}</p>
              </div>
              <button onClick={() => setShowNewProjectModal(false)} className="p-3 bg-slate-50 dark:bg-white/[0.03] text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-10 pt-4">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">{t.filenameLabel}</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder={t.filenamePlaceholder}
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border-none rounded-2xl p-5 text-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800"
                  />
                </div>
              </div>
              <div className="mt-10 flex gap-4">
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="flex-1 py-4 text-xs font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02] rounded-[15px]">{t.discard}</button>
                <button type="submit" className="flex-1 py-4 bg-brand-600 text-white text-xs font-bold rounded-[15px] shadow-xl shadow-brand-600/20">{t.initialize}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAiProcessing && (
        <div className="fixed bottom-12 left-12 bg-white/90 dark:bg-black/90 backdrop-blur-xl border dark:border-white/5 px-6 py-4 rounded-[20px] flex items-center gap-4 shadow-premium z-[200] animate-in slide-in-from-bottom-8 duration-500">
          <Loader2 className="animate-spin text-brand-600 dark:text-brand-500" size={22} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">{t.processing}</span>
        </div>
      )}
    </div>
  );
};

export default App;