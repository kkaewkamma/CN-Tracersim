import React, { useState } from 'react';
import { NETACAD_LESSONS, PRACTICAL_LABS_CATALOG } from '@core/curriculum/syllabus-data';
import { CCNA_ASSESSMENT_QUESTIONS } from '@core/curriculum/assessment-data';
import { useAcademyStore } from '@application/stores/useAcademyStore';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { 
  BookOpen, Award, CheckCircle2, ChevronRight, X, Play, 
  ShieldCheck, Zap, FileText, Terminal, GraduationCap, 
  AlertCircle, RotateCcw, ListChecks, HelpCircle, Layers
} from 'lucide-react';

interface AcademyModalProps {
  onClose: () => void;
}

/**
 * Renders structured multi-line theory text cleanly without raw HTML tags.
 * Automatically highlights key terms before colons (e.g. "• Inside Local: ...").
 */
const StructuredTheoryBlock: React.FC<{ text: string }> = ({ text }) => {
  const cleanText = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?b>/gi, '')
    .replace(/<\/?code>/gi, '');

  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return (
    <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const isSubItem = line.startsWith('-');
        const isMainBullet = line.startsWith('•') || /^\d+\./.test(line);
        const colonIdx = line.indexOf(':');

        // Header line (first line ending with colon)
        if (idx === 0 && line.endsWith(':')) {
          return (
            <div key={idx} className="font-bold text-white text-sm pb-1 border-b border-slate-800/80">
              {line}
            </div>
          );
        }

        // Line with "Key: Description"
        if (colonIdx > 0 && colonIdx < 60) {
          const prefix = line.slice(0, colonIdx + 1);
          const rest = line.slice(colonIdx + 1);
          return (
            <div
              key={idx}
              className={`${isSubItem ? 'pl-5 text-slate-300' : isMainBullet ? 'pl-1' : ''}`}
            >
              <span className="font-bold text-cyan-300">{prefix}</span>
              <span className="text-slate-200">{rest}</span>
            </div>
          );
        }

        return (
          <div
            key={idx}
            className={`${isSubItem ? 'pl-5 text-slate-300' : isMainBullet ? 'pl-1' : ''}`}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

export const NetAcadCoachModal: React.FC<AcademyModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'labs' | 'assessment'>('lessons');
  const { 
    activeLessonId, setActiveLesson, activePracticalLabId, setActiveLab,
    preTestScore, postTestScore, setPreTestScore, setPostTestScore
  } = useAcademyStore();
  const { loadPreset } = useTopologyStore();

  // Assessment State
  const [testMode, setTestMode] = useState<'pre' | 'post'>('pre');
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const selectedLesson = NETACAD_LESSONS.find(l => l.id === activeLessonId) || NETACAD_LESSONS[0];
  const selectedLab = PRACTICAL_LABS_CATALOG.find(l => l.id === activePracticalLabId) || PRACTICAL_LABS_CATALOG[0];

  const handleSelectAnswer = (qId: string, optIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: optIndex }));
  };

  const handleGradeAssessment = () => {
    let correct = 0;
    CCNA_ASSESSMENT_QUESTIONS.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    const pct = Math.round((correct / CCNA_ASSESSMENT_QUESTIONS.length) * 100);
    if (testMode === 'pre') {
      setPreTestScore(pct);
    } else {
      setPostTestScore(pct);
    }
    setIsSubmitted(true);
  };

  const handleResetAssessment = () => {
    setUserAnswers({});
    setIsSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-5xl w-full h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Cisco Networking Academy (NetAcad) Learning Coach</h3>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  CCNA Track
                </span>
              </div>
              <p className="text-xs text-slate-400">หลักสูตรมาตรฐานสากล 15 บทเรียน, 12 โจทย์แล็บปฏิบัติการ และชุดทดสอบวัดผล Pre/Post-Test</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center font-bold transition hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'lessons'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <BookOpen size={15} />
            <span>1. ทฤษฎีและคำสั่ง Cisco IOS ({NETACAD_LESSONS.length} บท)</span>
          </button>

          <button
            onClick={() => setActiveTab('labs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'labs'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Zap size={15} />
            <span>2. โจทย์แล็บปฏิบัติการ ({PRACTICAL_LABS_CATALOG.length} Labs)</span>
          </button>

          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'assessment'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <GraduationCap size={16} />
            <span>3. แบบทดสอบวัดผล Pre/Post-Test ({CCNA_ASSESSMENT_QUESTIONS.length} ข้อ)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'lessons' && (
            <>
              {/* Left Lesson List */}
              <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-3 space-y-1.5 bg-slate-950/40">
                {NETACAD_LESSONS.map(l => {
                  const isSelected = l.id === selectedLesson.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setActiveLesson(l.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-cyan-400">{l.number}</span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">{l.badge}</span>
                        </div>
                        <div className="font-bold text-xs sm:text-sm truncate">{l.title}</div>
                      </div>
                      <ChevronRight size={15} className={isSelected ? 'text-cyan-400 shrink-0' : 'text-slate-600 shrink-0'} />
                    </button>
                  );
                })}
              </div>

              {/* Right Lesson Detail */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#080d14]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                      <span>{selectedLesson.number}</span>
                      <span>•</span>
                      <span>{selectedLesson.netacadRef || selectedLesson.topicEn}</span>
                      {selectedLesson.badge && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {selectedLesson.badge}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{selectedLesson.title}</h2>
                  </div>

                  {selectedLesson.presetLab && (
                    <button
                      onClick={() => {
                        loadPreset(selectedLesson.presetLab!);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Play size={13} />
                      <span>เปิดผังแล็บประกอบบทเรียน</span>
                    </button>
                  )}
                </div>

                {/* Theory Summary */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                    <FileText size={15} className="text-cyan-400" />
                    <span>สรุปหลักการทำงาน (Theory Summary)</span>
                  </h4>
                  <StructuredTheoryBlock text={selectedLesson.theorySummary} />
                </div>

                {/* Scope */}
                {selectedLesson.simScope && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck size={15} />
                        <span>Authentic Simulation (ตรงตามจริง)</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{selectedLesson.simScope.authentic}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="font-bold text-sky-400 flex items-center gap-1.5">
                        <Zap size={15} />
                        <span>Simplified Scope (เพื่อการเรียนรู้)</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{selectedLesson.simScope.simplified}</p>
                    </div>
                  </div>
                )}

                {/* Exam Tips */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <Award size={15} className="text-amber-400" />
                    <span>จุดเน้นสำหรับสอบ (Exam Highlights):</span>
                  </div>
                  <ul className="list-disc list-inside text-xs sm:text-sm text-slate-200 space-y-1.5 leading-relaxed">
                    {selectedLesson.examTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Cheat Sheet */}
                <div className="space-y-2">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Terminal size={15} className="text-cyan-400" />
                    <span>สรุปคำสั่ง Cisco IOS ที่เกี่ยวข้อง:</span>
                  </div>
                  <div className="space-y-2">
                    {selectedLesson.cheatSheet.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <code className="text-amber-300 font-mono font-bold text-xs sm:text-sm">{item.cmd}</code>
                        <span className="text-xs text-slate-300 font-sans">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guided Step-by-Step CLI Practice */}
                {selectedLesson.steps && selectedLesson.steps.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                      <ListChecks size={15} className="text-emerald-400" />
                      <span>ขั้นตอนฝึกปฏิบัติทีละขั้น (Step-by-Step Guided CLI):</span>
                    </div>
                    <div className="space-y-2">
                      {selectedLesson.steps.map((st, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-cyan-300">
                              ขั้นที่ {idx + 1}: {st.device ? `อุปกรณ์ ${st.device}` : st.title || ''}
                            </span>
                            {st.cmd && (
                              <code className="px-2.5 py-0.5 rounded-lg bg-black border border-slate-800 text-amber-300 font-mono text-xs font-bold">
                                {st.cmd}
                              </code>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {st.explain || st.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'labs' && (
            <>
              {/* Labs Catalog */}
              <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-3 space-y-1.5 bg-slate-950/40">
                {PRACTICAL_LABS_CATALOG.map(l => {
                  const isSelected = l.id === selectedLab.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setActiveLab(l.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-emerald-500/15 border-emerald-400 text-white shadow'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-emerald-400">{l.number}</span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">{l.difficulty}</span>
                        </div>
                        <div className="font-bold text-xs sm:text-sm truncate">{l.title}</div>
                      </div>
                      <ChevronRight size={15} className={isSelected ? 'text-emerald-400 shrink-0' : 'text-slate-600 shrink-0'} />
                    </button>
                  );
                })}
              </div>

              {/* Lab Guide Sheet */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#080d14]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                      <span className="font-mono font-bold">{selectedLab.number}</span>
                      <span>•</span>
                      <span>{selectedLab.netacadRef}</span>
                      <span>•</span>
                      <span className="text-slate-400">{selectedLab.difficulty}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{selectedLab.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      loadPreset(selectedLab.id);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow transition active:scale-95"
                  >
                    <Play size={15} />
                    <span>เริ่มทำแล็บนี้</span>
                  </button>
                </div>

                {/* Full Lab Guide Sections */}
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <BookOpen size={15} />
                      <span>1. วัตถุประสงค์การเรียนรู้ (Learning Objectives):</span>
                    </div>
                    <ul className="list-disc list-inside text-slate-200 space-y-1 leading-relaxed">
                      {selectedLab.objectives.map((o, idx) => (
                        <li key={idx}>{o}</li>
                      ))}
                    </ul>
                  </div>

                  {selectedLab.topologyDesc && (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="font-bold text-sky-300 flex items-center gap-1.5">
                        <Layers size={15} />
                        <span>2. โครงสร้างผังเครือข่ายและอุปกรณ์ (Topology & Devices):</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{selectedLab.topologyDesc}</p>
                      {selectedLab.devices && selectedLab.devices.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedLab.devices.map((dev, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                              {dev}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-emerald-300">3. สถานการณ์โจทย์ (Scenario):</div>
                    <p className="text-slate-200 leading-relaxed">{selectedLab.scenario}</p>
                  </div>

                  {selectedLab.procedure && selectedLab.procedure.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="font-bold text-teal-300">4. ขั้นตอนการปฏิบัติการ (Step-by-Step Procedure):</div>
                      <ol className="list-decimal list-inside text-slate-200 space-y-1.5 leading-relaxed">
                        {selectedLab.procedure.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="font-bold text-amber-300">5. คำสั่ง Cisco IOS ที่ต้องใช้ (Required Commands):</div>
                    <div className="p-3 rounded-xl bg-black border border-slate-800 font-mono text-xs text-amber-300 space-y-1.5 select-all">
                      {selectedLab.commands.map((cmd, idx) => (
                        <div key={idx}>{cmd}</div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-purple-300">6. เกณฑ์การตรวจ Auto-Grader (100%):</div>
                    <ul className="space-y-1.5 text-slate-200">
                      {selectedLab.graderCriteria.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedLab.hintsAndSolution && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <HelpCircle size={15} />
                        <span>คำใบ้และแนวทางแก้ไข (Hints & Solution):</span>
                      </div>
                      <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">{selectedLab.hintsAndSolution}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'assessment' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#080d14]">
              
              {/* Assessment Mode Header & Score Banner */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">
                      CCNA Knowledge Assessment
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {CCNA_ASSESSMENT_QUESTIONS.length} Questions
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white">แบบทดสอบวัดความรู้ระบบเครือข่าย & Cisco IOS</h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1">
                    <button
                      disabled={isSubmitted}
                      onClick={() => { setTestMode('pre'); handleResetAssessment(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        testMode === 'pre'
                          ? 'bg-purple-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pre-Test (ก่อนเรียน)
                    </button>
                    <button
                      disabled={isSubmitted}
                      onClick={() => { setTestMode('post'); handleResetAssessment(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        testMode === 'post'
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Post-Test (หลังเรียน)
                    </button>
                  </div>

                  {isSubmitted && (
                    <button
                      onClick={handleResetAssessment}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <RotateCcw size={13} />
                      <span>ทำใหม่</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scorecard if submitted */}
              {isSubmitted && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-between animate-in zoom-in-95">
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider">
                      {testMode === 'pre' ? 'Pre-Test Diagnostic Score' : 'Post-Test Mastery Score'}
                    </span>
                    <div className="text-2xl font-black font-mono text-white">
                      {testMode === 'pre' ? preTestScore : postTestScore}%
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 font-medium">
                    ตอบถูก {Object.entries(userAnswers).filter(([qid, ans]) => CCNA_ASSESSMENT_QUESTIONS.find(q => q.id === qid)?.correctIndex === ans).length} จาก {CCNA_ASSESSMENT_QUESTIONS.length} ข้อ
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {CCNA_ASSESSMENT_QUESTIONS.map((q, qIdx) => {
                  const selectedOpt = userAnswers[q.id];
                  const isCorrect = isSubmitted && selectedOpt === q.correctIndex;
                  const isWrong = isSubmitted && selectedOpt !== undefined && selectedOpt !== q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border transition space-y-3 ${
                        isCorrect
                          ? 'bg-emerald-950/15 border-emerald-500/40'
                          : isWrong
                          ? 'bg-rose-950/15 border-rose-500/40'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs text-cyan-400 font-bold">
                            ข้อที่ {qIdx + 1} • {q.track}
                          </span>
                          <h4 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                            {q.question}
                          </h4>
                        </div>
                        {isSubmitted && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 size={13} />
                                <span>ถูกต้อง</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1">
                                <AlertCircle size={13} />
                                <span>ไม่ถูกต้อง</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          const isAnswerKey = isSubmitted && optIdx === q.correctIndex;

                          return (
                            <button
                              key={optIdx}
                              disabled={isSubmitted}
                              onClick={() => handleSelectAnswer(q.id, optIdx)}
                              className={`w-full text-left p-3 rounded-xl text-xs sm:text-sm font-sans border transition flex items-center justify-between gap-2 ${
                                isAnswerKey
                                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold'
                                  : isOptionSelected && isWrong
                                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
                                  : isOptionSelected
                                  ? 'bg-purple-500/20 border-purple-500 text-white font-semibold'
                                  : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono text-slate-300 font-bold shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="leading-relaxed">{opt}</span>
                              </div>
                              {isAnswerKey && (
                                <span className="text-xs text-emerald-400 font-bold shrink-0">คำตอบที่ถูกต้อง</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Diagnostic Review if submitted */}
                      {isSubmitted && (
                        <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-1.5 text-xs sm:text-sm font-sans">
                          <div className="text-cyan-300 font-bold">คำอธิบายเชิงลึก (Concept Review):</div>
                          <p className="text-slate-200 leading-relaxed">{q.conceptSummary}</p>
                          {q.diagnosticWhyWrong && !isCorrect && (
                            <p className="text-amber-300 leading-relaxed pt-1">
                              <strong className="font-bold">วิเคราะห์จุดผิด:</strong> {q.diagnosticWhyWrong}
                            </p>
                          )}
                          <div className="pt-1 text-xs font-mono text-emerald-400">
                            <strong className="font-sans text-slate-300">คำสั่งอ้างอิง: </strong>
                            {q.cliRef}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!isSubmitted && (
                <div className="pt-4 pb-2">
                  <button
                    onClick={handleGradeAssessment}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl transition active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>ส่งคำตอบและตรวจผลสอบ ({Object.keys(userAnswers).length}/{CCNA_ASSESSMENT_QUESTIONS.length} ข้อ)</span>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
