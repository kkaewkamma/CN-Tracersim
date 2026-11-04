import React from 'react';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { useSessionStore, ActiveTool } from '@application/stores/useSessionStore';
import { 
  Network, MousePointer, Cable, Mail, Globe, Trash2, 
  Play, Pause, Award, Calculator
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { devices, cables } = useTopologyStore();
  const { currentTool, setTool, simMode, setSimMode, openModal } = useSessionStore();

  const tools: Array<{ id: ActiveTool; label: string; icon: React.ReactNode; color: string }> = [
    { id: 'select', label: 'เลือก', icon: <MousePointer size={14} />, color: 'text-cyan-300' },
    { id: 'cable', label: 'ต่อสาย', icon: <Cable size={14} />, color: 'text-emerald-300' },
    { id: 'packet', label: 'Ping', icon: <Mail size={14} />, color: 'text-sky-300' },
    { id: 'http', label: 'HTTP', icon: <Globe size={14} />, color: 'text-purple-300' },
    { id: 'delete', label: 'ลบ', icon: <Trash2 size={14} />, color: 'text-rose-400' }
  ];

  return (
    <header className="h-14 px-4 bg-slate-900/90 border-b border-cisco-border flex items-center justify-between z-30 select-none">
      {/* Brand & Stats */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Network size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-wide">CN-Tracersim</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">v5.2 TS</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
              <span>{devices.length} โหนด</span>
              <span>•</span>
              <span>{cables.length} สาย</span>
            </div>
          </div>
        </div>
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
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Actions & Modules */}
      <div className="flex items-center gap-2">
        {/* Sim Mode Toggle */}
        <button
          onClick={() => setSimMode(simMode === 'realtime' ? 'step' : 'realtime')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
            simMode === 'step'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {simMode === 'step' ? <Pause size={13} /> : <Play size={13} />}
          <span>{simMode === 'step' ? 'Step-by-Step' : 'Realtime'}</span>
        </button>

        {/* Subnet Calculator */}
        <button
          onClick={() => openModal('subnet_calc')}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          title="เครื่องคิดเลข Subnet & VLSM"
        >
          <Calculator size={14} className="text-purple-400" />
          <span className="hidden sm:inline">Subnet</span>
        </button>

        {/* Switch to Legacy UI */}
        <a
          href="?legacy=true"
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-mono border border-slate-700 transition"
          title="สลับไปยังโหมด Legacy Canvas"
        >
          Legacy
        </a>

        {/* NetAcad Academy Modal */}
        <button
          onClick={() => openModal('academy')}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition active:scale-95"
        >
          <Award size={15} />
          <span>NetAcad Coach</span>
        </button>
      </div>
    </header>
  );
};
