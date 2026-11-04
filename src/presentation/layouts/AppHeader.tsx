import React, { useMemo } from 'react';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { useSessionStore, ActiveTool } from '@application/stores/useSessionStore';
import { LabGraderService } from '@application/services/grader-service';
import { CNLogo } from '../components/common/CNLogo';
import { 
  MousePointer, Cable, Mail, Globe, Trash2, 
  Play, Pause, Award, Calculator, Layers, FileJson, 
  CheckCircle2, AlertCircle
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { devices, cables, activePresetId } = useTopologyStore();
  const { currentTool, setTool, simMode, setSimMode, openModal } = useSessionStore();

  // Dynamically calculate live grading score
  const gradeReport = useMemo(() => {
    return LabGraderService.evaluate(devices, cables, activePresetId);
  }, [devices, cables, activePresetId]);

  const isComplete = gradeReport.percent === 100;

  const tools: Array<{ id: ActiveTool; label: string; icon: React.ReactNode; color: string }> = [
    { id: 'select', label: 'เลือก/ย้าย', icon: <MousePointer size={14} />, color: 'text-cyan-300' },
    { id: 'cable', label: 'ต่อสาย', icon: <Cable size={14} />, color: 'text-emerald-300' },
    { id: 'packet', label: 'Ping (ICMP)', icon: <Mail size={14} />, color: 'text-sky-300' },
    { id: 'http', label: 'HTTP (Web)', icon: <Globe size={14} />, color: 'text-purple-300' },
    { id: 'delete', label: 'ลบ', icon: <Trash2 size={14} />, color: 'text-rose-400' }
  ];

  return (
    <header className="h-14 px-3 sm:px-4 bg-[#0a0f18] border-b border-cisco-border flex items-center justify-between z-30 select-none shadow-md">
      {/* Brand & Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <CNLogo size={32} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">CN-Tracersim</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                v5.2
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
              <span>{devices.length} Nodes</span>
              <span>•</span>
              <span>{cables.length} Links</span>
            </div>
          </div>
        </div>

        {/* Preset Lab Switcher Quick Badge */}
        <button
          onClick={() => openModal('presets')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-cyan-300 transition"
          title="สลับโจทย์แล็บและผังเน็ตเวิร์ก (Labs 1–12)"
        >
          <Layers size={13} className="text-cyan-400" />
          <span className="font-bold uppercase">{activePresetId}</span>
        </button>

        {/* Live Auto-Grader Score Pill */}
        <button
          onClick={() => openModal('grader_report')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition ${
            isComplete
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
          }`}
          title="คลิกเพื่อดูรายละเอียดการตรวจคะแนนอัตโนมัติ"
        >
          {isComplete ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          <span>Score: {gradeReport.percent}%</span>
        </button>
      </div>

      {/* Floating Toolbar in Center */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
        {tools.map(t => {
          const isActive = currentTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isActive 
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={isActive ? t.color : ''}>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Actions & Modules */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sim Mode Toggle */}
        <button
          onClick={() => setSimMode(simMode === 'realtime' ? 'step' : 'realtime')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
            simMode === 'step'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
          title="สลับโหมด Realtime / Step-by-Step"
        >
          {simMode === 'step' ? <Pause size={13} /> : <Play size={13} />}
          <span className="hidden xl:inline">{simMode === 'step' ? 'Step Mode' : 'Realtime'}</span>
        </button>

        {/* JSON Import/Export */}
        <button
          onClick={() => openModal('import_export')}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition"
          title="สำรองหรือนำเข้าผังเครือข่าย (JSON)"
        >
          <FileJson size={14} className="text-indigo-400" />
          <span className="hidden lg:inline">JSON</span>
        </button>

        {/* Subnet Calculator */}
        <button
          onClick={() => openModal('subnet_calc')}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition"
          title="เครื่องคิดเลข Subnet & VLSM"
        >
          <Calculator size={14} className="text-purple-400" />
          <span className="hidden lg:inline">Subnet</span>
        </button>

        {/* NetAcad Academy Modal */}
        <button
          onClick={() => openModal('academy')}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition active:scale-95"
        >
          <Award size={15} />
          <span>NetAcad</span>
        </button>
      </div>
    </header>
  );
};
