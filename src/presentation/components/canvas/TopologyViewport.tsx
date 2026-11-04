import React, { useRef, useState, useEffect } from 'react';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { useSessionStore } from '@application/stores/useSessionStore';
import { CableLayer } from './CableLayer';
import { NodeRenderer } from './NodeRenderer';
import { NetworkDevice } from '@core/types';
import { 
  MousePointer, Cable, Trash2, ZoomIn, ZoomOut, RotateCcw, 
  Send, Globe, CheckCircle2, AlertTriangle, X, Layers,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export const TopologyViewport: React.FC = () => {
  const { devices, cables, selectDevice, addCable } = useTopologyStore();
  const { 
    currentTool, setTool, simMode, cableSource, setCableSource,
    packetSource, setPacketSource, lastSimulationResult, setLastSimulationResult,
    openModal
  } = useSessionStore();

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);

  const panStartRef = useRef<{ startX: number; startY: number; panX: number; panY: number }>({
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0
  });

  // State for Port Selection Dialog
  const [portSelectDevice, setPortSelectDevice] = useState<NetworkDevice | null>(null);

  useEffect(() => {
    setActiveHopIndex(0);
  }, [lastSimulationResult]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only pan if clicking canvas background directly
    if (e.target === e.currentTarget) {
      selectDevice(null);
      setIsPanning(true);
      panStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPan({
      x: panStartRef.current.panX + (e.clientX - panStartRef.current.startX),
      y: panStartRef.current.panY + (e.clientY - panStartRef.current.startY)
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(0.5, Math.min(1.6, Math.round((prev + delta) * 10) / 10)));
  };

  // Handle port selection during cable tool
  const handleOpenPortSelect = (device: NetworkDevice) => {
    setPortSelectDevice(device);
  };

  const handleSelectPort = (portName: string) => {
    if (!portSelectDevice) return;

    if (!cableSource) {
      // Set source device and port
      setCableSource({ deviceId: portSelectDevice.id, portName });
      setPortSelectDevice(null);
    } else {
      // Complete cable connection to target
      if (cableSource.deviceId === portSelectDevice.id) {
        // Cannot connect device to itself on same cable
        setCableSource(null);
        setPortSelectDevice(null);
        return;
      }

      addCable(cableSource.deviceId, cableSource.portName, portSelectDevice.id, portName);
      setCableSource(null);
      setPortSelectDevice(null);
      setTool('select');
    }
  };

  // Get available ports of the selected device for cable
  const getPortAvailability = (device: NetworkDevice, portName: string) => {
    return !cables.some(
      (c) =>
        (c.from === device.id && c.fromPort === portName) ||
        (c.to === device.id && c.toPort === portName)
    );
  };

  const currentHop = lastSimulationResult?.hops[activeHopIndex];
  const activeHopDevice = currentHop ? devices.find(d => d.name === currentHop.device) : null;

  return (
    <div 
      className="flex-1 relative w-full h-full bg-[#080d15] overflow-hidden select-none cursor-default"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Background Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Transformable Canvas Viewport */}
      <div
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* SVG Cable Layer */}
        <CableLayer />

        {/* Active Hop Device Beacon */}
        {activeHopDevice && (
          <div
            style={{
              transform: `translate3d(${activeHopDevice.x}px, ${activeHopDevice.y}px, 0)`,
              position: 'absolute',
              left: 0,
              top: 0,
              pointerEvents: 'none'
            }}
            className="w-16 h-16 rounded-2xl ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 animate-pulse z-10"
          />
        )}

        {/* Nodes Layer */}
        <div className="absolute inset-0 w-full h-full pointer-events-auto">
          {devices.map((device) => (
            <NodeRenderer 
              key={device.id} 
              device={device} 
              zoom={zoom} 
              onOpenPortSelect={handleOpenPortSelect}
            />
          ))}
        </div>
      </div>

      {/* Empty State Banner if no devices */}
      {devices.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30">
          <div className="font-mono text-cyan-400 font-bold text-base">CN-Tracersim v5.2 Enterprise Canvas</div>
          <p className="text-xs text-slate-400 mt-1">เลือกวาง Router, Switch หรือ PC จากแถบซ้ายมือเพื่อเริ่มต้นออกแบบเครือข่าย</p>
        </div>
      )}

      {/* Packet Source Active Indicator Banner */}
      {packetSource && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 backdrop-blur z-30 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span className="text-xs font-semibold">
            กำลังเลือกอุปกรณ์ปลายทางเพื่อส่ง {packetSource.protocol.toUpperCase()}... (แตะอุปกรณ์ปลายทาง)
          </span>
          <button
            onClick={() => setPacketSource(null)}
            className="w-5 h-5 rounded-md hover:bg-amber-500/30 text-amber-300 flex items-center justify-center text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Step-by-Step Simulation Controller Bar */}
      {lastSimulationResult && simMode === 'step' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-500/40 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur z-30 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-mono font-bold text-white">
              Hop {activeHopIndex + 1}/{lastSimulationResult.hops.length}: {currentHop?.device}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
              {currentHop?.layer} • {currentHop?.action.toUpperCase()}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={activeHopIndex === 0}
              onClick={() => setActiveHopIndex(prev => Math.max(0, prev - 1))}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <ChevronLeft size={13} />
              <span>ย้อน</span>
            </button>
            <button
              disabled={activeHopIndex >= lastSimulationResult.hops.length - 1}
              onClick={() => setActiveHopIndex(prev => Math.min(lastSimulationResult.hops.length - 1, prev + 1))}
              className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 text-xs font-bold flex items-center gap-1 shadow transition"
            >
              <span>ถัดไป</span>
              <ChevronRight size={13} />
            </button>
            <button
              onClick={() => setLastSimulationResult(null)}
              className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* PDU Simulation Result Drawer */}
      {lastSimulationResult && (
        <div className="absolute bottom-16 left-4 max-w-md w-full bg-slate-900/95 border border-slate-700 rounded-3xl p-4 shadow-2xl backdrop-blur z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {lastSimulationResult.success ? (
                <CheckCircle2 size={18} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={18} className="text-rose-400" />
              )}
              <span className={`font-bold text-xs ${lastSimulationResult.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                {lastSimulationResult.success ? 'Packet ส่งถึงปลายทางสำเร็จ' : 'Packet ถูก Drop / ล้มเหลว'}
              </span>
            </div>
            <button
              onClick={() => setLastSimulationResult(null)}
              className="w-6 h-6 rounded-lg text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center text-xs"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-xs text-slate-200 mt-2 font-medium leading-relaxed">
            {lastSimulationResult.reason}
          </p>

          {/* Inspect PDU Button */}
          <button
            onClick={() => openModal('inspect_pdu')}
            className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Layers size={13} />
            <span>ตรวจสอบ OSI 7 Layers (PDU)</span>
          </button>

          {/* Hop-by-Hop Trace */}
          {lastSimulationResult.hops.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Hop-by-Hop Simulation Trace:</span>
                <span className="text-slate-500">{lastSimulationResult.hops.length} Hops</span>
              </div>
              {lastSimulationResult.hops.map((hop, idx) => {
                const isCurrentActive = idx === activeHopIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveHopIndex(idx)}
                    className={`p-2 rounded-xl border text-[11px] font-mono space-y-0.5 cursor-pointer transition ${
                      isCurrentActive
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-300 font-bold">
                      <span>{idx + 1}. {hop.device}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                        {hop.layer} • {hop.action.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[10px] leading-relaxed">
                      {hop.details}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Toolbar (Select, Cable, Ping, HTTP, Delete) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-cisco-border px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 backdrop-blur z-20">
        <button
          onClick={() => setTool('select')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            currentTool === 'select'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="โหมดเลือกและย้ายอุปกรณ์ (Select / Drag)"
        >
          <MousePointer size={14} />
          <span>เลือก</span>
        </button>

        <button
          onClick={() => setTool('cable')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            currentTool === 'cable'
              ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="เชื่อมต่อสายเคเบิล (Connect Cable)"
        >
          <Cable size={14} />
          <span>สายเคเบิล</span>
          {cableSource && (
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setTool('packet')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            currentTool === 'packet'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="ส่ง ICMP Ping PDU"
        >
          <Send size={14} />
          <span>ICMP Ping</span>
        </button>

        <button
          onClick={() => setTool('http')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            currentTool === 'http'
              ? 'bg-purple-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="ส่ง HTTP Port 80 Web Request"
        >
          <Globe size={14} />
          <span>HTTP Web</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1"></div>

        <button
          onClick={() => setTool('delete')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            currentTool === 'delete'
              ? 'bg-rose-500 text-white shadow-md font-bold'
              : 'text-rose-400 hover:bg-rose-500/10'
          }`}
          title="ลบอุปกรณ์หรือสาย (Delete Tool)"
        >
          <Trash2 size={14} />
          <span>ลบ</span>
        </button>
      </div>

      {/* Floating Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-5 right-5 bg-slate-900/90 border border-cisco-border px-2 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 backdrop-blur z-20">
        <button
          onClick={() => setZoom((prev) => Math.min(1.6, Math.round((prev + 0.1) * 10) / 10))}
          className="w-7 h-7 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-center transition"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <span className="text-[11px] font-mono font-bold text-cyan-400 w-11 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
          className="w-7 h-7 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-center transition"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
          className="w-7 h-7 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          title="Reset View"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Port Selection Dialog for Cable Connection */}
      {portSelectDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cisco-panel border border-cisco-border rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Cable size={16} className="text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  เลือกพอร์ตสำหรับ {portSelectDevice.name}
                </h3>
              </div>
              <button
                onClick={() => setPortSelectDevice(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {cableSource
                ? `เชื่อมต่อกับ ${cableSource.deviceId} (${cableSource.portName}):`
                : 'เลือกพอร์ตเริ่มต้นของการเชื่อมต่อ:'}
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {Object.keys(portSelectDevice.ports).map((portName) => {
                const isAvailable = getPortAvailability(portSelectDevice, portName);
                return (
                  <button
                    key={portName}
                    disabled={!isAvailable}
                    onClick={() => handleSelectPort(portName)}
                    className={`p-2 rounded-xl text-left font-mono text-xs border transition flex flex-col justify-between ${
                      isAvailable
                        ? 'bg-slate-800/80 hover:bg-cyan-500/20 border-slate-700 hover:border-cyan-400 text-cyan-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-bold">{portName}</span>
                    <span className="text-[10px] opacity-75">
                      {isAvailable ? 'พร้อมใช้งาน' : 'ถูกใช้งานแล้ว'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
