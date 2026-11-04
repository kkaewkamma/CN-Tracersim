import React, { useState } from 'react';
import { NETACAD_LESSONS, PRACTICAL_LABS_CATALOG } from '@core/curriculum/syllabus-data';
import { useAcademyStore } from '@application/stores/useAcademyStore';
import { 
  BookOpen, Award, CheckCircle2, ChevronRight, X, Play, 
  ShieldCheck, Zap
} from 'lucide-react';

interface AcademyModalProps {
  onClose: () => void;
}

export const NetAcadCoachModal: React.FC<AcademyModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'labs'>('lessons');
  const { activeLessonId, setActiveLesson, activePracticalLabId, setActiveLab } = useAcademyStore();

  const selectedLesson = NETACAD_LESSONS.find(l => l.id === activeLessonId) || NETACAD_LESSONS[0];
  const selectedLab = PRACTICAL_LABS_CATALOG.find(l => l.id === activePracticalLabId) || PRACTICAL_LABS_CATALOG[0];

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
              <p className="text-xs text-slate-400">หลักสูตรมาตรฐานสากล 15 บทเรียน และ 12 โจทย์แล็บปฏิบัติการพร้อมระบบตรวจอัตโนมัติ</p>
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
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'labs'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Zap size={14} />
            <span>2. โจทย์แล็บปฏิบัติการ (12 Progressive Labs)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'lessons' ? (
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
                  <h4 className="text-xs font-bold text-cyan-300">📖 สรุปหลักการทำงาน (Theory Summary)</h4>
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
                  <div className="text-xs font-bold text-amber-300">🔥 จุดเน้นสำหรับสอบ (Exam Highlights):</div>
                  <ul className="list-disc list-inside text-xs text-slate-200 space-y-1">
                    {selectedLesson.examTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Cheat Sheet */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-white">💻 สรุปคำสั่ง Cisco IOS ที่เกี่ยวข้อง:</div>
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
          ) : (
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
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
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
        </div>
      </div>
    </div>
  );
};
