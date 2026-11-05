import React, { useState } from 'react';
import { useSessionStore } from '@application/stores/useSessionStore';
import { 
  X, Layers, CheckCircle2, AlertOctagon
} from 'lucide-react';

interface PduInspectorModalProps {
  onClose: () => void;
}

export const PduInspectorModal: React.FC<PduInspectorModalProps> = ({ onClose }) => {
  const { lastSimulationResult } = useSessionStore();
  const [selectedHopIndex, setSelectedHopIndex] = useState<number>(0);

  if (!lastSimulationResult || lastSimulationResult.hops.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Layers size={24} />
          </div>
          <h3 className="font-bold text-base text-white">ยังไม่มีประวัติแพ็กเก็ตจำลอง</h3>
          <p className="text-xs text-slate-400">
            โปรดใช้เครื่องมือ Ping (ICMP) หรือ HTTP เพื่อส่งแพ็กเก็ตระหว่างอุปกรณ์บนผัง แล้วเปิดหน้าต่างนี้เพื่อตรวจสอบ OSI 7 Layers
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    );
  }

  const hops = lastSimulationResult.hops;
  const currentHop = hops[selectedHopIndex] || hops[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">OSI 7-Layer PDU Protocol Inspector</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  lastSimulationResult.success
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}>
                  {lastSimulationResult.success ? 'TRANSMISSION SUCCESS' : 'PACKET DROPPED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                {lastSimulationResult.reason}
              </p>
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
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Hop Sequence Navigator */}
          <div className="w-full md:w-72 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold px-2 py-1 flex items-center justify-between">
              <span className="font-mono">Telemetry Hops</span>
              <span className="text-cyan-400 font-sans">{hops.length} ขั้น</span>
            </div>

            {hops.map((h, idx) => {
              const isSelected = idx === selectedHopIndex;
              const isDrop = h.action === 'drop';
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedHopIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-2xl border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                      : isDrop
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-slate-800 text-[10px] font-mono flex items-center justify-center text-slate-400">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{h.device}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {h.ingressPort ? `${h.ingressPort} -> ` : ''}{h.egressPort || h.layer}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isDrop ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-cyan-300'
                  }`}>
                    {h.action}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Detailed 7-Layer OSI Stack Breakdown */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#080d14]">
            
            {/* Hop Overview Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  Hop {selectedHopIndex + 1} of {hops.length}
                </span>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentHop.device}</span>
                  <span className="text-xs text-slate-400 font-mono font-normal">
                    ({currentHop.layer} Processing)
                  </span>
                </h4>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                {currentHop.action === 'drop' ? (
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-bold">
                    <AlertOctagon size={13} />
                    <span>Packet Dropped</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={13} />
                    <span>Action: {currentHop.action.toUpperCase()}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Hop Narrative */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-slate-800 font-sans text-xs sm:text-sm text-slate-200 space-y-1">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Event Details:</div>
              <p className="leading-relaxed text-cyan-300">{currentHop.details}</p>
            </div>

            {/* OSI 7-Layer Decomposition */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                OSI Encapsulation / Decapsulation Analysis:
              </div>

              {/* Layer 7: Application */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <span className="w-16 text-[10px] font-mono font-bold text-purple-400 uppercase shrink-0 pt-0.5">
                  Layer 7: App
                </span>
                <div className="text-xs text-slate-300 space-y-0.5">
                  <div className="font-semibold text-white">Payload Protocol</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {currentHop.details.includes('HTTP') || currentHop.details.includes('พอร์ต 80')
                      ? 'HTTP (Hypertext Transfer Protocol) Web Request - TCP Port 80'
                      : 'ICMP Echo Request / Echo Reply (RFC 792 Ping)'}
                  </div>
                </div>
              </div>

              {/* Layer 4: Transport */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <span className="w-16 text-[10px] font-mono font-bold text-sky-400 uppercase shrink-0 pt-0.5">
                  Layer 4: Trans
                </span>
                <div className="text-xs text-slate-300 space-y-0.5">
                  <div className="font-semibold text-white">Segment / Port Mapping</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {currentHop.details.includes('PAT') || currentHop.details.includes('Inside Global')
                      ? 'Port Address Translation (PAT) Overload Active - Dynamic Port Remapped'
                      : 'Standard End-to-End Socket Transport'}
                  </div>
                </div>
              </div>

              {/* Layer 3: Network */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <span className="w-16 text-[10px] font-mono font-bold text-cyan-400 uppercase shrink-0 pt-0.5">
                  Layer 3: Net
                </span>
                <div className="text-xs text-slate-300 space-y-0.5">
                  <div className="font-semibold text-white">IPv4 Routing & ACL Verification</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {currentHop.action === 'route'
                      ? 'Cisco CEF / Routing Table lookup successful. Next-hop resolved via OSPF/Connected.'
                      : currentHop.details.includes('ACL')
                      ? 'Access Control List rule evaluated against IP packet headers.'
                      : 'IP Datagram forwarded transparently at L2/L3 boundary.'}
                  </div>
                </div>
              </div>

              {/* Layer 2: Data Link */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <span className="w-16 text-[10px] font-mono font-bold text-emerald-400 uppercase shrink-0 pt-0.5">
                  Layer 2: Link
                </span>
                <div className="text-xs text-slate-300 space-y-0.5">
                  <div className="font-semibold text-white">Ethernet Framing & VLAN 802.1Q</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {currentHop.details.includes('VLAN')
                      ? 'IEEE 802.1Q VLAN Tagging / Trunking Enforced. L2 Broadcast Domain isolated.'
                      : 'Ethernet II Frame MAC Address verification completed.'}
                  </div>
                </div>
              </div>

              {/* Layer 1: Physical */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <span className="w-16 text-[10px] font-mono font-bold text-amber-400 uppercase shrink-0 pt-0.5">
                  Layer 1: Phys
                </span>
                <div className="text-xs text-slate-300 space-y-0.5">
                  <div className="font-semibold text-white">Interface Physical Port Status</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Ingress: <span className="text-white">{currentHop.ingressPort || 'Local Bus'}</span> | 
                    Egress: <span className="text-white">{currentHop.egressPort || 'Local CPU'}</span> (Media: Cat6 Ethernet 1Gbps Full-Duplex)
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              disabled={selectedHopIndex === 0}
              onClick={() => setSelectedHopIndex(prev => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-semibold transition"
            >
              Previous Hop
            </button>
            <button
              disabled={selectedHopIndex >= hops.length - 1}
              onClick={() => setSelectedHopIndex(prev => Math.min(hops.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-semibold transition"
            >
              Next Hop
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow"
          >
            เรียบร้อย
          </button>
        </div>

      </div>
    </div>
  );
};
