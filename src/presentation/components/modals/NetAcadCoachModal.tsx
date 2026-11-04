import React, { useState } from 'react';
import { NETACAD_LESSONS, PRACTICAL_LABS_CATALOG } from '@core/curriculum/syllabus-data';
import { CCNA_ASSESSMENT_QUESTIONS } from '@core/curriculum/assessment-data';
import { useAcademyStore } from '@application/stores/useAcademyStore';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { 
  BookOpen, Award, CheckCircle2, ChevronRight, X, Play, 
  ShieldCheck, Zap, FileText, Terminal, GraduationCap, 
  AlertCircle, RotateCcw
} from 'lucide-react';

interface AcademyModalProps {
  onClose: () => void;
}

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
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
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'lessons'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <BookOpen size={14} />
            <span>1. ทฤษฎีและคำสั่ง Cisco IOS ({NETACAD_LESSONS.length} บท)</span>
          </button>

          <button
            onClick={() => setActiveTab('labs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'labs'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Zap size={14} />
            <span>2. โจทย์แล็บปฏิบัติการ (12 Progressive Labs)</span>
          </button>

          <button
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition ${
              activeTab === 'assessment'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <GraduationCap size={15} />
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
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-cyan-400">{l.number}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{l.badge}</span>
                        </div>
                        <div className="font-bold text-xs truncate">{l.title}</div>
                      </div>
                      <ChevronRight size={14} className={isSelected ? 'text-cyan-400' : 'text-slate-600'} />
                    </button>
                  );
                })}
              </div>

              {/* Right Lesson Detail */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#080d14]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                    <span>{selectedLesson.number}</span>
                    <span>•</span>
                    <span>{selectedLesson.netacadRef}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedLesson.title}</h2>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <FileText size={14} className="text-cyan-400" />
                    <span>สรุปหลักการทำงาน (Theory Summary)</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedLesson.theorySummary}</p>
                </div>

                {/* Scope */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      <span>Authentic Simulation (ตรงตามจริง)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{selectedLesson.simScope.authentic}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Zap size={14} />
                      <span>Simplified Scope (เพื่อการเรียนรู้)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{selectedLesson.simScope.simplified}</p>
                  </div>
                </div>

                {/* Exam Tips */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-400" />
                    <span>จุดเน้นสำหรับสอบ (Exam Highlights):</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-slate-200 space-y-1">
                    {selectedLesson.examTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Cheat Sheet */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Terminal size={14} className="text-cyan-400" />
                    <span>สรุปคำสั่ง Cisco IOS ที่เกี่ยวข้อง:</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {selectedLesson.cheatSheet.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-amber-300 font-bold">{item.cmd}</span>
                        <span className="text-[11px] text-slate-400 font-sans">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-emerald-400">{l.number}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{l.difficulty}</span>
                        </div>
                        <div className="font-bold text-xs truncate">{l.title}</div>
                      </div>
                      <ChevronRight size={14} className={isSelected ? 'text-emerald-400' : 'text-slate-600'} />
                    </button>
                  );
                })}
              </div>

              {/* Lab 10-Part Guide Sheet */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#080d14]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
                      <span>{selectedLab.number}</span>
                      <span>•</span>
                      <span>{selectedLab.netacadRef}</span>
                    </div>
                    <h2 className="text-lg font-bold text-white">{selectedLab.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      loadPreset(selectedLab.id);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
                  >
                    <Play size={14} />
                    <span>เริ่มทำแล็บนี้</span>
                  </button>
                </div>

                {/* 10 Sections */}
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-cyan-300">1. วัตถุประสงค์ (Learning Objectives):</div>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                      {selectedLab.objectives.map((o, idx) => (
                        <li key={idx}>{o}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-300">2. สถานการณ์โจทย์ (Scenario):</div>
                    <p className="text-slate-300 leading-relaxed">{selectedLab.scenario}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-amber-300">3. คำสั่ง Cisco IOS ที่ต้องใช้:</div>
                    <div className="p-2 rounded-xl bg-black font-mono text-[11px] text-amber-300 space-y-1 select-all">
                      {selectedLab.commands.map((cmd, idx) => (
                        <div key={idx}>{cmd}</div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-purple-300">4. เกณฑ์การตรวจ Auto-Grader (100%):</div>
                    <ul className="space-y-1 text-slate-300">
                      {selectedLab.graderCriteria.map((c, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
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
                    <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">
                      {testMode === 'pre' ? 'Pre-Test Diagnostic Score' : 'Post-Test Mastery Score'}
                    </span>
                    <div className="text-2xl font-black font-mono text-white">
                      {testMode === 'pre' ? preTestScore : postTestScore}%
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
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
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">
                            ข้อที่ {qIdx + 1} • {q.track}
                          </span>
                          <h4 className="text-sm font-semibold text-white leading-relaxed">
                            {q.question}
                          </h4>
                        </div>
                        {isSubmitted && (
                          <div className="shrink-0">
                            {isCorrect ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                <span>ถูกต้อง</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold flex items-center gap-1">
                                <AlertCircle size={12} />
                                <span>ไม่ถูกต้อง</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          const isAnswerKey = isSubmitted && optIdx === q.correctIndex;

                          return (
                            <button
                              key={optIdx}
                              disabled={isSubmitted}
                              onClick={() => handleSelectAnswer(q.id, optIdx)}
                              className={`w-full text-left p-2.5 rounded-xl text-xs font-mono border transition flex items-center justify-between ${
                                isAnswerKey
                                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold'
                                  : isOptionSelected && isWrong
                                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
                                  : isOptionSelected
                                  ? 'bg-purple-500/20 border-purple-500 text-white font-semibold'
                                  : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isAnswerKey && (
                                <span className="text-[10px] text-emerald-400 font-bold">คำตอบที่ถูกต้อง</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Diagnostic Review if submitted */}
                      {isSubmitted && (
                        <div className="p-3 rounded-xl bg-black/60 border border-slate-800 space-y-1 text-xs">
                          <div className="text-cyan-300 font-bold">คำอธิบายเชิงลึก (Concept Review):</div>
                          <p className="text-slate-300 leading-relaxed text-[11px]">{q.conceptSummary}</p>
                          {q.diagnosticWhyWrong && !isCorrect && (
                            <p className="text-amber-300/90 text-[11px] leading-relaxed pt-1">
                              <b>วิเคราะห์จุดผิด:</b> {q.diagnosticWhyWrong}
                            </p>
                          )}
                          <div className="pt-1 text-[11px] font-mono text-emerald-400">
                            <b>คำสั่งอ้างอิง:</b> {q.cliRef}
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
