import React, { useState } from 'react';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { 
  X, Download, Upload, Copy, Check, FileJson, 
  AlertCircle, CheckCircle2
} from 'lucide-react';

interface LabImportExportModalProps {
  onClose: () => void;
}

export const LabImportExportModal: React.FC<LabImportExportModalProps> = ({ onClose }) => {
  const { devices, cables, activePresetId, setTopology } = useTopologyStore();
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  const exportPayload = JSON.stringify({
    app: 'CN-Tracersim',
    version: '5.2',
    timestamp: new Date().toISOString(),
    activePresetId,
    devices,
    cables
  }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportPayload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([exportPayload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cn-tracersim-lab-${activePresetId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    try {
      if (!importJsonText.trim()) {
        setImportStatus({ type: 'error', message: 'กรุณากรอกหรือวางข้อมูล JSON ก่อนนำเข้า' });
        return;
      }
      const data = JSON.parse(importJsonText);
      if (!Array.isArray(data.devices) || !Array.isArray(data.cables)) {
        setImportStatus({ type: 'error', message: 'โครงสร้าง JSON ไม่ถูกต้อง: ขาดฟิลด์ devices หรือ cables' });
        return;
      }

      setTopology(data.devices, data.cables, data.activePresetId || 'custom');
      setImportStatus({ type: 'success', message: `นำเข้าสำเร็จ: ${data.devices.length} อุปกรณ์ และ ${data.cables.length} สายเชื่อมต่อ` });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setImportStatus({ type: 'error', message: `เกิดข้อผิดพลาดในการแปลง JSON: ${err.message}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">
              <FileJson size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Lab Topology JSON Manager</h3>
              <p className="text-xs text-slate-400">สำรอง บันทึก หรือนำเข้าไฟล์ผังโครงสร้างระบบเครือข่าย</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center font-bold transition hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setTab('export')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              tab === 'export'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Download size={13} />
            <span>ส่งออก (Export Topology)</span>
          </button>
          <button
            onClick={() => setTab('import')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              tab === 'import'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Upload size={13} />
            <span>นำเข้า (Import Topology)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#080d14] space-y-4">
          {tab === 'export' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>ข้อมูลผังปัจจุบัน ({devices.length} โหนด, {cables.length} สาย):</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download size={13} />
                    <span>ดาวน์โหลด .json</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={exportPayload}
                rows={12}
                className="w-full p-3 rounded-2xl bg-black/60 border border-slate-800 font-mono text-xs text-cyan-300 focus:outline-none resize-none select-all"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>วางข้อมูล JSON หรือเลือกไฟล์จากเครื่อง:</span>
                <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition">
                  <Upload size={13} />
                  <span>เลือกไฟล์ .json</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                placeholder="วางโค้ด JSON ของผังเน็ตเวิร์กที่นี่..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                rows={11}
                className="w-full p-3 rounded-2xl bg-black/60 border border-slate-800 font-mono text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
              />

              {importStatus.type !== 'idle' && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}>
                  {importStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            CN-Tracersim JSON Schema v5.2
          </span>

          <div className="flex items-center gap-2">
            {tab === 'import' && (
              <button
                onClick={handleApplyImport}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow"
              >
                นำเข้าและปรับใช้ผัง
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              ปิด
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
