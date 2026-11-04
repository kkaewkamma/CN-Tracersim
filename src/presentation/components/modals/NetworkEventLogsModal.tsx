import React, { useState } from 'react';
import { useEventLogStore, NetworkEventLog } from '@application/stores/useEventLogStore';
import { X, Activity, Trash2, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface EventLogsModalProps {
  onClose: () => void;
}

export const NetworkEventLogsModal: React.FC<EventLogsModalProps> = ({ onClose }) => {
  const { logs, clearLogs } = useEventLogStore();
  const [filter, setFilter] = useState<'all' | 'ok' | 'fail' | 'warn'>('all');

  const filteredLogs = logs.filter(l => filter === 'all' || l.status === filter);

  const getStatusIcon = (status: NetworkEventLog['status']) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />;
      case 'fail':
        return <AlertCircle size={15} className="text-rose-400 shrink-0" />;
      case 'warn':
        return <ShieldAlert size={15} className="text-amber-400 shrink-0" />;
      default:
        return <Info size={15} className="text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-3xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Network Traffic & Event Telemetry Logs</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {logs.length} Events
                </span>
              </div>
              <p className="text-xs text-slate-400">บันทึกเหตุการณ์แพ็กเก็ต การแปลง NAT ตารางเราต์ และการทำงานของไฟร์วอลล์</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center font-bold transition hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                filter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilter('ok')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                filter === 'ok' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              สำเร็จ (OK)
            </button>
            <button
              onClick={() => setFilter('fail')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                filter === 'fail' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              ดรอป/ล้มเหลว
            </button>
            <button
              onClick={() => setFilter('warn')}
              className={`px-3 py-1 rounded-xl font-semibold transition ${
                filter === 'warn' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              แจ้งเตือน/ความปลอดภัย
            </button>
          </div>

          <button
            onClick={clearLogs}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 flex items-center gap-1 transition"
            title="ล้างประวัติเหตุการณ์ทั้งหมด"
          >
            <Trash2 size={13} />
            <span>ล้างบันทึก</span>
          </button>
        </div>

        {/* Logs List */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#080d14] space-y-2 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 italic">
              ไม่มีประวัติเหตุการณ์ที่ตรงกับตัวกรอง
            </div>
          ) : (
            filteredLogs.map((l) => (
              <div
                key={l.id}
                className={`p-3 rounded-2xl border transition flex items-start gap-3 ${
                  l.status === 'ok'
                    ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    : l.status === 'fail'
                    ? 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                    : l.status === 'warn'
                    ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                    : 'bg-slate-900/30 border-slate-800 text-slate-300'
                }`}
              >
                <div className="mt-0.5">{getStatusIcon(l.status)}</div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{l.title}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 uppercase">
                        {l.type}
                      </span>
                    </div>
                    <span>{l.timestamp}</span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {l.details}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Real-time Telemetry Buffer: Active</span>
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
