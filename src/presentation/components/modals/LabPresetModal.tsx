import React from 'react';
import { PRACTICAL_LABS_CATALOG } from '@core/curriculum/syllabus-data';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { X, Play, Network } from 'lucide-react';

interface LabPresetModalProps {
  onClose: () => void;
}

export const LabPresetModal: React.FC<LabPresetModalProps> = ({ onClose }) => {
  const { activePresetId, loadPreset } = useTopologyStore();

  const handleSelectPreset = (labId: string) => {
    loadPreset(labId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              <Network size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Preset Topology & Lab Switcher</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                  12 CCNA Scenarios
                </span>
              </div>
              <p className="text-xs text-slate-400">เลือกแล็บมาตรฐาน Cisco เพื่อโหลดผังระบบและเปิดเกณฑ์การตรวจ Auto-Grader ทันที</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center font-bold transition hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#080d14]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {PRACTICAL_LABS_CATALOG.map((lab) => {
              const isActive = activePresetId === lab.id;
              return (
                <div
                  key={lab.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    isActive
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">{lab.number}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                          {lab.difficulty}
                        </span>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                          ACTIVE LAB
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-white">{lab.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {lab.scenario}
                    </p>

                    <div className="text-xs font-sans text-slate-300 bg-black/40 p-2.5 rounded-xl truncate">
                      {lab.topologyDesc}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-sans">
                      {lab.graderCriteria.length} เกณฑ์ตรวจคะแนน
                    </span>

                    <button
                      onClick={() => handleSelectPreset(lab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                        isActive
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow'
                      }`}
                    >
                      <Play size={12} />
                      <span>{isActive ? 'รีโหลดผังแล็บ' : 'โหลดแล็บนี้'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>* การโหลดแล็บใหม่จะแทนที่อุปกรณ์และสายปัจจุบันบนผัง</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
