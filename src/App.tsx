import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Send, 
  RotateCcw, 
  Download, 
  Plus, 
  Trash2, 
  Briefcase, 
  User, 
  Settings, 
  Palette,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Copy,
  PenTool,
  History,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { generateCoverLetter, refineCoverLetter } from './services/gemini';
import { UserInfo, JobInfo, CoverLetterDraft, Theme, Template } from './types';

const TEMPLATES: Template[] = [
  {
    id: 'standard',
    name: 'Standard Professional',
    description: 'A classic, balanced structure for most job applications.',
    structure: 'Header -> Date -> Salutation -> Hook -> Body (Achievements & Fit) -> Call to Action -> Sign-off'
  },
  {
    id: 'storytelling',
    name: 'Storytelling Narrative',
    description: 'Focuses on your career journey and passion.',
    structure: 'Header -> Hook (Personal Story) -> Narrative Body -> Direct connection to role -> Sign-off'
  },
  {
    id: 'modern',
    name: 'Modern & Concise',
    description: 'Short, punchy paragraphs for fast-paced industries.',
    structure: 'Minimal Header -> Catchy Opening -> Bulleted Achievements -> Value Statement -> Request for Interview'
  },
  {
    id: 'academic',
    name: 'Academic / Research',
    description: 'Tailored for higher education or specialized research roles.',
    structure: 'Detailed Header -> Academic Background -> Research Focus/Publications -> Institutional Fit -> Sign-off'
  }
];

const INITIAL_USER_INFO: UserInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  skills: '',
  experience: '',
  education: ''
};

const INITIAL_JOB_INFO: JobInfo = {
  jobTitle: '',
  companyName: '',
  jobDescription: '',
  industry: '',
  companyCulture: '',
  tone: 'professional'
};

export default function App() {
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo>(INITIAL_USER_INFO);
  const [jobInfo, setJobInfo] = useState<JobInfo>(INITIAL_JOB_INFO);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [drafts, setDrafts] = useState<CoverLetterDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<CoverLetterDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [theme, setTheme] = useState<Theme>('natural');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedDrafts = localStorage.getItem('cover_letter_drafts');
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
    const savedTheme = localStorage.getItem('app_theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cover_letter_drafts', JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { content, suggestions } = await generateCoverLetter(userInfo, jobInfo, selectedTemplate.structure);
      const newDraft: CoverLetterDraft = {
        id: crypto.randomUUID(),
        title: `${jobInfo.jobTitle} at ${jobInfo.companyName}`,
        content,
        suggestions,
        userInfo,
        jobInfo,
        createdAt: Date.now(),
        templateId: selectedTemplate.id
      };
      setDrafts([newDraft, ...drafts]);
      setCurrentDraft(newDraft);
      setStep(4);
    } catch (error) {
      console.error(error);
      alert('Failed to generate. Please check your credentials and inputs.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!currentDraft || !refinementText.trim()) return;
    setIsGenerating(true);
    try {
      const { content, suggestions } = await refineCoverLetter(currentDraft.content, refinementText);
      const updatedDraft = {
        ...currentDraft,
        content,
        suggestions
      };
      setDrafts(drafts.map(d => d.id === currentDraft.id ? updatedDraft : d));
      setCurrentDraft(updatedDraft);
      setRefinementText('');
    } catch (error) {
      console.error(error);
      alert('Refinement failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Cover_Letter_${jobInfo.companyName.replace(/\s/g, '_')}.pdf`);
  };

  const deleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrafts(drafts.filter(d => d.id !== id));
    if (currentDraft?.id === id) setCurrentDraft(null);
  };

  const themes: { name: Theme; class: string; label: string }[] = [
    { name: 'light', class: 'bg-white text-gray-900', label: 'Light' },
    { name: 'dark', class: 'bg-gray-900 text-white', label: 'Dark' },
    { name: 'sepia', class: 'bg-[#f4ecd8] text-[#5b4636]', label: 'Sepia' },
    { name: 'professional', class: 'bg-slate-50 text-slate-900 border-t-4 border-blue-600', label: 'Pro' },
    { name: 'natural', class: 'bg-natural text-olive', label: 'Natural' }
  ];

  const currentThemeStyles = theme === 'dark' 
    ? 'bg-gray-900 text-gray-100 border-gray-800' 
    : theme === 'sepia'
    ? 'bg-[#f4ecd8] text-[#5b4636] border-[#dcd2bb]'
    : theme === 'professional'
    ? 'bg-slate-50 text-slate-900 border-slate-200'
    : theme === 'natural'
    ? 'bg-natural text-gray-800 border-[#dcd2bb]'
    : 'bg-white text-gray-900 border-gray-200';

  const inputStyles = cn(
    "w-full px-4 py-2 rounded-lg border focus:ring-2 transition-all outline-none",
    theme === 'dark' ? 'bg-gray-800 border-gray-700 focus:ring-blue-500' : 
    theme === 'natural' ? 'bg-white/50 border-gray-200 focus:ring-olive/30' :
    'bg-white border-gray-300 focus:ring-blue-500'
  );

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-300", currentThemeStyles)}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md px-6 py-4 flex items-center justify-between", 
        theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 
        theme === 'natural' ? 'bg-white/40 border-white/60 rounded-b-[2rem]' :
        'bg-white/80 border-gray-200'
      )}>
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", theme === 'natural' ? 'bg-olive' : 'bg-blue-600')}>
            <PenTool className="text-white size-5" />
          </div>
          <h1 className={cn("text-xl font-bold tracking-tight", theme === 'natural' ? 'text-olive' : '')}>CoverCraft AI</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => setTheme(t.name)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  theme === t.name 
                    ? (theme === 'natural' ? "bg-olive text-white shadow-sm" : "bg-white dark:bg-gray-700 shadow-sm text-blue-600")
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => { setStep(1); setCurrentDraft(null); }}
            className={cn(
              "flex items-center gap-1 text-sm font-medium hover:underline",
              theme === 'natural' ? 'text-olive font-bold' : 'text-blue-600'
            )}
          >
            <Plus size={16} /> New Letter
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        {/* Sidebar / Drafts */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <History size={16} /> My Drafts
            </h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {drafts.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No drafts saved yet</p>
              ) : (
                drafts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setCurrentDraft(d);
                      setUserInfo(d.userInfo);
                      setJobInfo(d.jobInfo);
                      setStep(4);
                    } }
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all border group relative",
                      currentDraft?.id === d.id
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                        : "bg-white border-transparent hover:border-gray-200 dark:bg-gray-800 dark:hover:border-gray-700"
                    )}
                  >
                    <div className="font-medium text-sm truncate pr-6">{d.title}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(d.createdAt).toLocaleDateString()}</div>
                    <button 
                      onClick={(e) => deleteDraft(d.id, e)}
                      className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {!currentDraft && (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stepper Progress */}
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                      <div className={cn(
                        "size-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                        step === s ? (theme === 'natural' ? "bg-olive text-white ring-4 ring-olive/20" : "bg-blue-600 text-white ring-4 ring-blue-100") :
                        step > s ? (theme === 'natural' ? "bg-olive/60 text-white" : "bg-green-500 text-white") : "bg-gray-200 text-gray-500"
                      )}>
                        {step > s ? <Check size={16} /> : s}
                      </div>
                      {s < 3 && (
                        <div className={cn("w-16 h-0.5 mx-2 bg-gray-200", step > s && (theme === 'natural' ? 'bg-olive/60' : "bg-green-500"))} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Content */}
                <div className="max-w-3xl mx-auto">
                  {step === 1 && (
                    <div className={cn("space-y-6 transition-all", theme === 'natural' && "bg-white p-8 rounded-[2rem] shadow-card border border-white/20")}>
                      <div className="text-center space-y-2">
                        <h2 className={cn("text-3xl font-bold tracking-tight", theme === 'natural' && "text-gray-800")}>Tell us about yourself</h2>
                        <p className="text-gray-500">Your background helps the AI craft a personalized story.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className={cn("text-sm font-medium flex items-center gap-2", theme === 'natural' && "text-olive font-bold uppercase text-[10px] tracking-widest")}><User size={14}/> Full Name</label>
                          <input 
                            placeholder="Jane Doe" 
                            className={inputStyles}
                            value={userInfo.fullName}
                            onChange={e => setUserInfo({...userInfo, fullName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <input 
                            placeholder="jane@example.com" 
                            className={inputStyles}
                            value={userInfo.email}
                            onChange={e => setUserInfo({...userInfo, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone Number</label>
                          <input 
                            placeholder="+1 (555) 000-0000" 
                            className={inputStyles}
                            value={userInfo.phone}
                            onChange={e => setUserInfo({...userInfo, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Location</label>
                          <input 
                            placeholder="New York, NY" 
                            className={inputStyles}
                            value={userInfo.location}
                            onChange={e => setUserInfo({...userInfo, location: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-medium">Core Skills</label>
                          <textarea 
                            placeholder="React, Project Management, Data Analysis..." 
                            className={cn(inputStyles, "h-20 resize-none")}
                            value={userInfo.skills}
                            onChange={e => setUserInfo({...userInfo, skills: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-medium">Key Experience Hub</label>
                          <textarea 
                            placeholder="Summarize your career highlights or paste chunks of your resume..." 
                            className={cn(inputStyles, "h-32 resize-none")}
                            value={userInfo.experience}
                            onChange={e => setUserInfo({...userInfo, experience: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button 
                          onClick={() => setStep(2)}
                          className={cn(
                            "px-8 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg",
                            theme === 'natural' ? "bg-olive hover:brightness-110 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          Continue <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className={cn("space-y-6 transition-all", theme === 'natural' && "bg-white p-8 rounded-[2rem] shadow-card border border-white/20")}>
                      <div className="text-center space-y-2">
                        <h2 className={cn("text-3xl font-bold tracking-tight", theme === 'natural' && "text-gray-800")}>The Dream Job</h2>
                        <p className="text-gray-500">Paste details about the role you're targeting.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className={cn("text-sm font-medium flex items-center gap-2", theme === 'natural' && "text-olive font-bold uppercase text-[10px] tracking-widest")}><Briefcase size={14}/> Job Title</label>
                          <input 
                            placeholder="Senior Product Designer" 
                            className={inputStyles}
                            value={jobInfo.jobTitle}
                            onChange={e => setJobInfo({...jobInfo, jobTitle: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company Name</label>
                          <input 
                            placeholder="Acme Corp" 
                            className={inputStyles}
                            value={jobInfo.companyName}
                            onChange={e => setJobInfo({...jobInfo, companyName: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-sm font-medium">Job Description / Requirements</label>
                          <textarea 
                            placeholder="Paste the job description here..." 
                            className={cn(inputStyles, "h-40 resize-none")}
                            value={jobInfo.jobDescription}
                            onChange={e => setJobInfo({...jobInfo, jobDescription: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tone of Voice</label>
                          <select 
                            className={inputStyles}
                            value={jobInfo.tone}
                            onChange={e => setJobInfo({...jobInfo, tone: e.target.value as any})}
                          >
                            <option value="professional">Standard Professional</option>
                            <option value="enthusiastic">Enthusiastic & Passionate</option>
                            <option value="creative">Creative & Bold</option>
                            <option value="minimalist">Minimalist & Direct</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company Culture (Keywords)</label>
                          <input 
                            placeholder="Innovative, Fast-paced, Collaborative" 
                            className={inputStyles}
                            value={jobInfo.companyCulture}
                            onChange={e => setJobInfo({...jobInfo, companyCulture: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                          <ChevronLeft size={18} /> Back
                        </button>
                        <button 
                          onClick={() => setStep(3)}
                          className={cn(
                            "px-8 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg",
                            theme === 'natural' ? "bg-olive hover:brightness-110 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          Select Template <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Pick a Structure</h2>
                        <p className="text-gray-500">How should your letter be organized?</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.id}
                            onClick={() => setSelectedTemplate(tmpl)}
                            className={cn(
                              "text-left p-6 rounded-2xl border-2 transition-all space-y-2 relative group",
                              selectedTemplate.id === tmpl.id
                                ? (theme === 'natural' ? "border-olive bg-olive/5" : "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10")
                                : "border-gray-100 hover:border-gray-200 dark:border-gray-800"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-lg">{tmpl.name}</h3>
                              {selectedTemplate.id === tmpl.id && (
                                <div className={cn("rounded-full p-1", theme === 'natural' ? 'bg-olive' : 'bg-blue-600')}>
                                  <Check className="text-white size-3" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">{tmpl.description}</p>
                            <div className="pt-2">
                              <div className={cn("text-[10px] uppercase font-bold tracking-wider", theme === 'natural' ? 'text-olive' : 'text-gray-400')}>Flow</div>
                              <div className="text-xs font-mono text-gray-400 truncate">{tmpl.structure}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className={cn(
                        "flex justify-between items-center p-6 rounded-2xl border border-dashed mt-8",
                        theme === 'natural' ? "bg-white border-olive/20 shadow-card" : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      )}>
                        <div className="flex items-center gap-3">
                          <Layout className={cn(theme === 'natural' ? "text-olive" : "text-blue-500")} />
                          <div>
                            <div className="font-medium text-sm">Ready to generate?</div>
                            <div className="text-xs text-gray-500">The AI will use all provided context to write your letter.</div>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <ChevronLeft size={18} /> Back
                          </button>
                          <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={cn(
                              "px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl disabled:opacity-50",
                              theme === 'natural' ? "bg-olive text-white shadow-olive/20 hover:brightness-110" : "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700",
                              isGenerating && "animate-pulse"
                            )}
                          >
                            {isGenerating ? "Drafting..." : "Generate Magic"} <Send size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentDraft && (
              <motion.div
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Letter Preview */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <FileText className={cn(theme === 'natural' ? "text-olive" : "text-blue-600")} /> Preview
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(currentDraft.content);
                          alert('Copied to clipboard!');
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Copy text"
                      >
                        <Copy size={20} className={cn(theme === 'natural' && "text-olive")} />
                      </button>
                      <button 
                         onClick={handleDownloadPDF}
                         className={cn(
                           "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-semibold text-white",
                           theme === 'natural' ? "bg-olive shadow-olive/20 hover:brightness-110" : "bg-blue-600 hover:bg-blue-700"
                         )}
                      >
                        <Download size={18} /> Download PDF
                      </button>
                    </div>
                  </div>

                  <div 
                    ref={previewRef}
                    className={cn(
                      "p-12 shadow-2xl rounded-sm min-h-[842px] relative",
                      (theme === 'natural' || theme === 'sepia') ? 'bg-[#fdf9f0] text-[#333]' : 'bg-white text-gray-900',
                    )}
                    style={{ fontFamily: theme === 'natural' ? "'Libre Baskerville', serif" : "'Times New Roman', serif" }}
                  >
                    <div className="whitespace-pre-wrap leading-[1.6] text-[16px]">
                      {currentDraft.content}
                    </div>
                  </div>
                </div>

                {/* Suggestions & Revision */}
                <div className="lg:col-span-4 space-y-8">
                  <div className={cn(
                    "p-6 rounded-2xl space-y-4 shadow-sm",
                    theme === 'natural' 
                      ? "bg-white border border-white/20 shadow-card" 
                      : "bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30"
                  )}>
                    <h3 className={cn(
                      "font-bold flex items-center gap-2",
                      theme === 'natural' ? "text-olive" : "text-amber-800 dark:text-amber-500"
                    )}>
                      <AlertCircle size={18} /> Smart Suggestions
                    </h3>
                    <ul className="space-y-3">
                      {currentDraft.suggestions.map((s, idx) => (
                        <li key={idx} className={cn(
                          "text-sm flex gap-2",
                          theme === 'natural' ? "text-gray-600" : "text-amber-900/80 dark:text-amber-200/80"
                        )}>
                          <span className={cn("font-bold", theme === 'natural' ? "text-olive" : "text-amber-500")}>•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={cn(
                    "p-6 rounded-2xl shadow-sm space-y-4",
                    theme === 'natural' ? "bg-white border border-white/20 shadow-card" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  )}>
                    <h3 className="font-bold flex items-center gap-2">
                      <RotateCcw size={18} className={cn(theme === 'natural' ? "text-olive" : "text-blue-500")} /> Refined Revisions
                    </h3>
                    <p className="text-xs text-gray-500">Not quite perfect? Ask for specific changes like "Make it shorter" or "Highlight my leadership more."</p>
                    <div className="relative">
                      <textarea
                        value={refinementText}
                        onChange={e => setRefinementText(e.target.value)}
                        placeholder="E.g., Emphasize my experience with Python more prominently."
                        className={cn(inputStyles, "h-32 pt-3 pr-12 resize-none text-sm")}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) handleRefine();
                        }}
                      />
                      <button 
                        onClick={handleRefine}
                        disabled={isGenerating || !refinementText.trim()}
                        className={cn(
                          "absolute bottom-3 right-3 text-white p-2 rounded-lg disabled:opacity-50 transition-all shadow-md",
                          theme === 'natural' ? "bg-olive shadow-olive/20 hover:brightness-110" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                        )}
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-400 text-center">Press Ctrl + Enter to send</div>
                  </div>

                  <button 
                    onClick={() => { setStep(1); setCurrentDraft(null); }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed rounded-2xl transition-all group",
                      theme === 'natural' 
                        ? "border-olive/20 text-olive/40 hover:text-olive hover:border-olive/60" 
                        : "border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-900"
                    )}
                  >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Start New Project
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm gap-4">
        <div className="flex items-center gap-4">
          <button className="hover:text-gray-600 transition-colors">Privacy Policy</button>
          <button className="hover:text-gray-600 transition-colors">Terms of Service</button>
        </div>
        <div>Crafted with precision for candidates everywhere.</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="size-2 bg-green-500 rounded-full animate-pulse" /> AI Engine Ready
          </div>
        </div>
      </footer>
    </div>
  );
}

