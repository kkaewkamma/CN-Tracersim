import React from 'react';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { useSessionStore } from '@application/stores/useSessionStore';
import { AppHeader } from './layouts/AppHeader';
import { SubnetCalculatorModal } from './components/modals/SubnetCalculatorModal';
import { CiscoTerminalModal } from './components/terminal/CiscoTerminalModal';
import { NetAcadCoachModal } from './components/modals/NetAcadCoachModal';
import { TopologyViewport } from './components/canvas/TopologyViewport';
import { Server, Router, Laptop, Cloud, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const { devices, selectedDeviceId, addDevice } = useTopologyStore();
  const { activeModal, closeModal, openModal } = useSessionStore();

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-cisco-dark">
      {/* Top Navigation */}
      <AppHeader />

      {/* Main Workspace Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Palette (Devices) */}
        <aside className="w-16 bg-slate-900/80 border-r border-cisco-border flex flex-col items-center py-4 gap-3 z-20">
          <button 
            onClick={() => addDevice('router', 300, 200)}
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/50 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 group"
            title="เพิ่ม Cisco Router"
          >
            <Router size={18} className="group-hover:scale-110 transition" />
            <span className="text-[9px] font-mono">Router</span>
          </button>

          <button 
            onClick={() => addDevice('switch', 300, 280)}
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 group"
            title="เพิ่ม Catalyst Switch"
          >
            <Server size={18} className="group-hover:scale-110 transition" />
            <span className="text-[9px] font-mono">Switch</span>
          </button>

          <button 
            onClick={() => addDevice('pc', 200, 350)}
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500/50 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 group"
            title="เพิ่ม PC Workstation"
          >
            <Laptop size={18} className="group-hover:scale-110 transition" />
            <span className="text-[9px] font-mono">PC</span>
          </button>

          <button 
            onClick={() => addDevice('server', 400, 350)}
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 hover:border-purple-500/50 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 group"
            title="เพิ่ม Server"
          >
            <Server size={18} className="group-hover:scale-110 transition" />
            <span className="text-[9px] font-mono">Server</span>
          </button>

          <button 
            onClick={() => addDevice('cloud', 450, 150)}
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 hover:border-rose-500/50 flex flex-col items-center justify-center gap-0.5 transition active:scale-95 group"
            title="เพิ่ม ISP Cloud"
          >
            <Cloud size={18} className="group-hover:scale-110 transition" />
            <span className="text-[9px] font-mono">Cloud</span>
          </button>
        </aside>

        {/* Viewport Canvas Center Container */}
        <main className="flex-1 relative bg-[#060a11] overflow-hidden flex flex-col">
          <TopologyViewport />

          {/* Quick Selection Floating Pill */}
          {selectedDevice && (
            <div className="absolute top-4 right-4 bg-slate-900/95 border border-cisco-border px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur z-20 animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-sm text-white">{selectedDevice.name}</span>
                <span className="text-xs font-mono text-slate-400">({selectedDevice.type})</span>
              </div>
              <div className="h-4 w-px bg-slate-700"></div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openModal('cli', selectedDevice.id)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Terminal size={14} />
                  <span>เปิด Cisco CLI</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals Container */}
      {activeModal === 'subnet_calc' && (
        <SubnetCalculatorModal onClose={closeModal} />
      )}

      {activeModal === 'cli' && selectedDevice && (
        <CiscoTerminalModal 
          device={selectedDevice} 
          onClose={closeModal} 
        />
      )}

      {activeModal === 'academy' && (
        <NetAcadCoachModal onClose={closeModal} />
      )}
    </div>
  );
};
