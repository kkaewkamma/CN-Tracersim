import React, { useState, useRef, useEffect } from 'react';
import { CiscoCliStateMachine } from '@core/cli/cisco-cli-parser';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { useAcademyStore } from '@application/stores/useAcademyStore';
import { NETACAD_LESSONS } from '@core/curriculum/syllabus-data';
import { Terminal, X, CornerDownLeft, RotateCcw, Sparkles } from 'lucide-react';

interface TerminalModalProps {
  device: any;
  onClose: () => void;
  onConfigChange?: () => void;
}

export const CiscoTerminalModal: React.FC<TerminalModalProps> = ({ device, onClose, onConfigChange }) => {
  const { updateDevice } = useTopologyStore();
  const { activeLessonId } = useAcademyStore();
  const [cli] = useState(() => new CiscoCliStateMachine(device));
  
  // Persistent terminal display history & command input history per device
  const [history, setHistory] = useState<string[]>(() => {
    if (device.cliHistory && Array.isArray(device.cliHistory) && device.cliHistory.length > 0) {
      return device.cliHistory;
    }
    return [
      `Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.4(3)M\nTechnical Support: http://www.cisco.com/techsupport\n\nPress RETURN or type '?' for command help!\n`
    ];
  });
  const [inputVal, setInputVal] = useState('');
  const [prompt, setPrompt] = useState(() => cli.getPrompt());

  // Persistent Command History (Arrow Up / Arrow Down) per device
  const [cmdHistory, setCmdHistory] = useState<string[]>(() => {
    return (device.cmdHistory && Array.isArray(device.cmdHistory)) ? device.cmdHistory : [];
  });
  const [historyPointer, setHistoryPointer] = useState<number>(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active Lesson Context for CLI Tutor
  const activeLesson = NETACAD_LESSONS.find(l => l.id === activeLessonId) || NETACAD_LESSONS[0];
  const recommendedCommands = activeLesson.cheatSheet || [];

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

    const nextCmdHistory = cmd ? [...cmdHistory, cmd] : cmdHistory;
    if (cmd) {
      setCmdHistory(nextCmdHistory);
      setHistoryPointer(-1);
    }

    const currentPrompt = prompt;
    const res = cli.execute(cmd);

    const nextHistory = [
      ...history,
      `${currentPrompt} ${cmd}${res.output ? `\n${res.output}` : ''}`
    ];
    setHistory(nextHistory);
    setPrompt(res.prompt);

    // Sync state changes, CLI history, and command history directly into Zustand Topology Store
    updateDevice(device.id, (d) => ({
      ...d,
      ...cli.getDevice(),
      cliHistory: nextHistory,
      cmdHistory: nextCmdHistory,
      cliMode: res.context.mode,
      cliCurrentIf: res.context.currentInterface
    }));

    if (res.stateChanged && onConfigChange) {
      onConfigChange();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Command History: ArrowUp
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextPointer = historyPointer === -1 ? cmdHistory.length - 1 : Math.max(0, historyPointer - 1);
      setHistoryPointer(nextPointer);
      setInputVal(cmdHistory[nextPointer] || '');
    }

    // Command History: ArrowDown
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPointer === -1) return;
      const nextPointer = historyPointer + 1;
      if (nextPointer >= cmdHistory.length) {
        setHistoryPointer(-1);
        setInputVal('');
      } else {
        setHistoryPointer(nextPointer);
        setInputVal(cmdHistory[nextPointer] || '');
      }
    }

    // Tab Autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      if (!inputVal.trim()) return;
      const matches = cli.autocomplete(inputVal);
      if (matches.length === 1) {
        setInputVal(matches[0]);
      } else if (matches.length > 1) {
        setHistory(prev => [
          ...prev,
          `${prompt} ${inputVal}\n${matches.join('   ')}`
        ]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-4xl w-full h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
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
                <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded bg-emerald-500/10">
                  CLI Sync: ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Cisco IOS Interactive CLI Terminal (Tab = Autocomplete, Up/Down = History)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setHistory([]);
                updateDevice(device.id, (d) => ({
                  ...d,
                  cliHistory: []
                }));
              }}
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

        {/* NetAcad Interactive Tutor Guide Bar */}
        {recommendedCommands.length > 0 && (
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto gap-2">
            <div className="flex items-center gap-2 text-slate-400 shrink-0 font-mono text-[11px]">
              <Sparkles size={13} className="text-cyan-400" />
              <span className="text-cyan-300 font-bold">{activeLesson.number} Coach:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {recommendedCommands.slice(0, 4).map((rc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputVal(rc.cmd);
                    inputRef.current?.focus();
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 font-mono text-[11px] shrink-0 transition flex items-center gap-1"
                  title={rc.desc}
                >
                  <span>{rc.cmd}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-white font-mono text-xs focus:outline-none placeholder-slate-600"
            placeholder="พิมพ์คำสั่ง Cisco IOS ที่นี่ (กด Tab เพื่อเติมคำสั่ง, ? เพื่อดูคำอธิบาย)..."
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
