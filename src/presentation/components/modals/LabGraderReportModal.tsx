import React, { useState } from 'react';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { LabGraderService, LabGradingReport } from '@application/services/grader-service';
import { 
  X, Award, CheckCircle2, AlertCircle, RefreshCw, 
  Copy, Check
} from 'lucide-react';

interface LabGraderReportModalProps {
  onClose: () => void;
}

export const LabGraderReportModal: React.FC<LabGraderReportModalProps> = ({ onClose }) => {
  const { devices, cables, activePresetId } = useTopologyStore();
  const [copied, setCopied] = useState<boolean>(false);
  const [report, setReport] = useState<LabGradingReport>(() => 
    LabGraderService.evaluate(devices, cables, activePresetId)
  );

  const handleRefresh = () => {
    setReport(LabGraderService.evaluate(devices, cables, activePresetId));
  };

  const handleCopy = () => {
    const textReport = [
      `=== CN-Tracersim Auto-Grader Scorecard ===`,
      `Lab ID: ${activePresetId.toUpperCase()}`,
      `Title: ${report.title}`,
      `Score: ${report.percent}% (${report.passedCount}/${report.checks.length} criteria passed)`,
      `Status: ${report.percent === 100 ? 'PASSED (COMPLETE)' : 'IN PROGRESS'}`,
      `\nDetails:`,
      ...report.checks.map((c, idx) => 
        `[${c.passed ? 'PASS' : 'FAIL'}] ${idx + 1}. ${c.label}${c.reason ? ` - ${c.reason}` : ''}`
      ),
      `\nTimestamp: ${new Date().toLocaleString('th-TH')}`
    ].join('\n');

    navigator.clipboard.writeText(textReport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isPerfect = report.percent === 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-2xl w-full max-h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shadow-lg ${
              isPerfect 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-emerald-500/20' 
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-amber-500/20'
            }`}>
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Live Auto-Grader Assessment Report</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  {activePresetId.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">{report.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center font-bold transition hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#080d14]">
          
          {/* Score Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isPerfect
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-80">
                Evaluation Score
              </span>
              <div className="text-2xl font-black font-mono">
                {report.percent}% 
                <span className="text-xs font-normal opacity-80 ml-2">
                  ({report.passedCount} จาก {report.checks.length} ข้อกำหนด)
                </span>
              </div>
            </div>

            <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${
              isPerfect
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {isPerfect ? 'LAB COMPLETED' : 'INCOMPLETE'}
            </span>
          </div>

          {/* Criteria Checklist */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>เกณฑ์การให้คะแนนแบบไดนามิก (Dynamic Verification):</span>
              <span className="text-slate-500 font-normal">{report.checks.length} รายการ</span>
            </div>

            <div className="space-y-2">
              {report.checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                    check.passed
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-rose-950/20 border-rose-900/40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {check.passed ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                      <span>{idx + 1}. {check.label}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        check.passed 
                          ? 'bg-emerald-500/15 text-emerald-300' 
                          : 'bg-rose-500/15 text-rose-300'
                      }`}>
                        {check.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    {check.reason && (
                      <div className="text-[11px] font-mono text-slate-400 leading-relaxed bg-black/40 p-2 rounded-xl">
                        {check.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw size={13} />
              <span>ตรวจคะแนนใหม่</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'คัดลอกเรียบร้อย' : 'คัดลอกผลคะแนน'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
