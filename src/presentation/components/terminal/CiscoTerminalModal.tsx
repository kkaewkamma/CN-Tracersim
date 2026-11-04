import React, { useState, useRef, useEffect } from 'react';
import { CiscoCliStateMachine } from '@core/cli/cisco-cli-parser';
import { Terminal, X, CornerDownLeft, RotateCcw } from 'lucide-react';

interface TerminalModalProps {
  device: any;
  onClose: () => void;
  onConfigChange?: () => void;
}

export const CiscoTerminalModal: React.FC<TerminalModalProps> = ({ device, onClose, onConfigChange }) => {
  const [cli] = useState(() => new CiscoCliStateMachine(device));
  const [history, setHistory] = useState<string[]>([
    `Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.4(3)M\nTechnical Support: http://www.cisco.com/techsupport\n\nPress RETURN to get started!\n`
  ]);
  const [inputVal, setInputVal] = useState('');
  const [prompt, setPrompt] = useState(() => cli.getPrompt());
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommandSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = inputVal.trim();
    setInputVal('');

    const currentPrompt = prompt;
    const res = cli.execute(cmd);

    setHistory(prev => [
      ...prev,
      `${currentPrompt} ${cmd}${res.output ? `\n${res.output}` : ''}`
    ]);

    setPrompt(res.prompt);
    if (res.stateChanged && onConfigChange) {
      onConfigChange();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Terminal size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{device.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                  {device.type.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Cisco IOS Interactive CLI Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setHistory([])}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
              title="Clear terminal screen"
            >
              <RotateCcw size={13} />
              <span>ล้างหน้าจอ</span>
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center font-bold transition hover:bg-slate-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Terminal Output Area */}
        <div 
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-black/90 text-emerald-400 space-y-1.5 cursor-text select-text"
        >
          {history.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap leading-relaxed">{line}</div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Input Bar */}
        <form onSubmit={handleCommandSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-300 select-none pl-1">{prompt}</span>
          <input 
            ref={inputRef}
            type="text" 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-transparent border-none text-white font-mono text-xs focus:outline-none placeholder-slate-600"
            placeholder="พิมพ์คำสั่ง Cisco IOS ที่นี่ (กด ? เพื่อดูความช่วยเหลือ)..."
            autoFocus
          />
          <button 
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
          >
            <span>ส่ง</span>
            <CornerDownLeft size={13} />
          </button>
        </form>
      </div>
    </div>
  );
};
