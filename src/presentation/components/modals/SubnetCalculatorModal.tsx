import React, { useState } from 'react';
import { IpMath } from '@core/engine/ip-math';
import { Calculator, X, Binary, ArrowRight } from 'lucide-react';

interface SubnetCalcProps {
  onClose: () => void;
}

export const SubnetCalculatorModal: React.FC<SubnetCalcProps> = ({ onClose }) => {
  const [ip, setIp] = useState('192.168.10.65');
  const [cidr, setCidr] = useState(26);

  const details = IpMath.calculateSubnetDetails(ip, cidr);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cisco-panel border border-cisco-border rounded-3xl max-w-2xl w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">เครื่องคิดเลข Subnetting & VLSM 32-Bit</h3>
              <p className="text-xs text-slate-400">คำนวณ Network ID, Broadcast, และ Usable Range สำหรับสอบ CCNA</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center font-bold transition hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">IPv4 Address:</label>
            <input 
              type="text" 
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 transition"
              placeholder="e.g. 192.168.10.1"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Prefix Length (/CIDR):</label>
            <select 
              value={cidr}
              onChange={(e) => setCidr(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-400 transition"
            >
              {Array.from({ length: 25 }, (_, i) => i + 8).map(prefix => (
                <option key={prefix} value={prefix}>
                  /{prefix} — {IpMath.cidrToMask(prefix)} ({Math.pow(2, 32 - prefix) - (32 - prefix >= 2 ? 2 : 0)} hosts)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-300 font-sans">Network Address (ชื่อวงแลน)</div>
            <div className="text-base font-mono font-bold text-cyan-300 mt-0.5">{details.networkAddress}/{details.cidr}</div>
            <div className="text-xs font-sans text-slate-400 mt-1">IP ใบแรกสุด (ห้ามตั้งให้ Host)</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-300 font-sans">Usable Host IP Range</div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <span>{details.firstHost}</span>
              <ArrowRight size={12} className="text-slate-500" />
              <span>{details.lastHost}</span>
            </div>
            <div className="text-xs font-sans text-slate-300 mt-1">
              จำนวนเครื่อง: <strong className="text-white font-mono">{details.usableHosts.toLocaleString()}</strong> <span className="font-mono text-slate-400">(2^{details.hostBits} - 2)</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-300 font-sans">Broadcast Address</div>
            <div className="text-base font-mono font-bold text-amber-300 mt-0.5">{details.broadcastAddress}</div>
            <div className="text-xs font-sans text-slate-400 mt-1">IP ใบสุดท้ายของ Subnet</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Subnet Mask</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">{details.mask}</div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-mono text-xs font-bold">/{details.cidr}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Wildcard Mask (OSPF / ACL)</div>
              <div className="text-sm font-mono font-bold text-purple-300 mt-0.5">{details.wildcard}</div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 font-mono text-xs">255 - Mask</span>
          </div>
        </div>

        {/* Binary View */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5">
          <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <Binary size={14} className="text-cyan-400" />
            <span>โครงสร้างเลขฐานสอง 32-Bit (Bitwise AND):</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-[11px]">
            <span className="text-slate-400">IPv4 ({details.ip}):</span> 
            <span className="text-cyan-300 tracking-wider">{details.binaryIp}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-[11px]">
            <span className="text-slate-400">Mask (/{details.cidr}):</span> 
            <span className="text-amber-300 tracking-wider">{details.binaryMask}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

