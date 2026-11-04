import React, { useEffect, useState, useRef } from 'react';
import { Send, Globe, Check, X } from 'lucide-react';

export interface PduHopPosition {
  index: number;
  deviceName: string;
  x: number;
  y: number;
  action: string;
  layer: string;
}

interface PduFlightOverlayProps {
  hops: PduHopPosition[];
  isSuccess: boolean;
  protocol: 'icmp' | 'tcp';
  simMode: 'realtime' | 'step';
  activeHopIndex: number;
  onInspect: (hopIndex: number) => void;
  onComplete?: () => void;
}

export const PduFlightOverlay: React.FC<PduFlightOverlayProps> = ({
  hops,
  isSuccess,
  protocol,
  simMode,
  activeHopIndex,
  onInspect,
  onComplete
}) => {
  if (!hops || hops.length === 0) return null;

  const [currentHopIdx, setCurrentHopIdx] = useState<number>(0);
  const [animStatus, setAnimStatus] = useState<'flying' | 'success' | 'drop'>('flying');
  const timerRef = useRef<number | null>(null);

  // In realtime mode, animate hop by hop
  useEffect(() => {
    if (simMode === 'step') {
      setCurrentHopIdx(activeHopIndex);
      const isLast = activeHopIndex >= hops.length - 1;
      if (isLast) {
        setAnimStatus(isSuccess ? 'success' : 'drop');
      } else {
        setAnimStatus('flying');
      }
      return;
    }

    // Realtime animation mode
    setCurrentHopIdx(0);
    setAnimStatus('flying');

    let idx = 0;
    const hopInterval = 750; // ms per hop

    const advance = () => {
      if (idx < hops.length - 1) {
        idx++;
        setCurrentHopIdx(idx);
        timerRef.current = window.setTimeout(advance, hopInterval);
      } else {
        // Arrived at final hop
        setAnimStatus(isSuccess ? 'success' : 'drop');
        if (onComplete) {
          timerRef.current = window.setTimeout(onComplete, 2500);
        }
      }
    };

    timerRef.current = window.setTimeout(advance, hopInterval);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [hops, simMode, activeHopIndex, isSuccess]);

  const targetHop = hops[Math.min(currentHopIdx, hops.length - 1)] || hops[0];
  const isHttp = protocol === 'tcp';

  return (
    <div
      className="absolute pointer-events-auto cursor-pointer transition-all duration-500 ease-out z-40 select-none"
      style={{
        left: `${targetHop.x}px`,
        top: `${targetHop.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onInspect(currentHopIdx);
      }}
      title="คลิกเพื่อตรวจสอบ OSI 7-Layer PDU"
    >
      {/* Outer Pulse Wave */}
      <span
        className={`absolute -inset-2 rounded-full animate-ping opacity-60 pointer-events-none ${
          animStatus === 'success'
            ? 'bg-emerald-400'
            : animStatus === 'drop'
            ? 'bg-rose-500'
            : isHttp
            ? 'bg-purple-400'
            : 'bg-cyan-400'
        }`}
      />

      {/* Main PDU Token Badge */}
      <div
        className={`relative px-2.5 py-1 rounded-full shadow-2xl flex items-center gap-1.5 border-2 text-[11px] font-mono font-bold tracking-tight transition-transform duration-200 active:scale-90 ${
          animStatus === 'success'
            ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/50 scale-110'
            : animStatus === 'drop'
            ? 'bg-rose-600 text-white border-rose-400 shadow-rose-500/50 scale-110'
            : isHttp
            ? 'bg-purple-600 text-white border-purple-300 shadow-purple-500/50 ring-2 ring-purple-400/30'
            : 'bg-cyan-500 text-slate-950 border-cyan-200 shadow-cyan-500/50 ring-2 ring-cyan-400/30'
        }`}
      >
        {animStatus === 'success' ? (
          <>
            <Check size={13} strokeWidth={3} />
            <span>DELIVERED</span>
          </>
        ) : animStatus === 'drop' ? (
          <>
            <X size={13} strokeWidth={3} />
            <span>DROPPED</span>
          </>
        ) : isHttp ? (
          <>
            <Globe size={12} strokeWidth={2.5} />
            <span>HTTP :80</span>
          </>
        ) : (
          <>
            <Send size={12} strokeWidth={2.5} />
            <span>ICMP ECHO</span>
          </>
        )}
      </div>

      {/* Floating Info Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-[9px] font-mono text-slate-200 whitespace-nowrap shadow-lg flex items-center gap-1 backdrop-blur-sm pointer-events-none">
        <span className="text-cyan-400 font-bold">{targetHop.deviceName}</span>
        <span className="text-slate-500">•</span>
        <span>{targetHop.layer} {targetHop.action.toUpperCase()}</span>
      </div>
    </div>
  );
};

