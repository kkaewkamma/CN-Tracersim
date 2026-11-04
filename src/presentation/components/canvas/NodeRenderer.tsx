import React, { useRef, useState } from 'react';
import { NetworkDevice, DeviceType } from '@core/types';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { useSessionStore } from '@application/stores/useSessionStore';
import { useEventLogStore } from '@application/stores/useEventLogStore';
import { PacketTracer } from '@core/engine/packet-tracer';
import { Router, Server, Laptop, Cloud, Terminal } from 'lucide-react';

interface NodeRendererProps {
  device: NetworkDevice;
  zoom: number;
  onOpenPortSelect?: (device: NetworkDevice) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({ device, zoom, onOpenPortSelect }) => {
  const { devices, cables, selectedDeviceId, selectDevice, updateDevicePosition, removeDevice } = useTopologyStore();
  const { 
    currentTool, setTool, cableSource, packetSource, setPacketSource, 
    setLastSimulationResult, openModal 
  } = useSessionStore();

  const isSelected = selectedDeviceId === device.id;
  const isCableSrc = cableSource?.deviceId === device.id;
  const isPduSrc = packetSource?.deviceId === device.id;
  const isDeleteMode = currentTool === 'delete';

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; devX: number; devY: number }>({
    startX: 0,
    startY: 0,
    devX: device.x,
    devY: device.y
  });
  const lastTapRef = useRef<number>(0);

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'router':
        return <Router size={22} className="text-cyan-400" />;
      case 'switch':
        return <Server size={22} className="text-emerald-400" />;
      case 'pc':
        return <Laptop size={22} className="text-sky-400" />;
      case 'server':
        return <Server size={22} className="text-purple-400" />;
      case 'cloud':
        return <Cloud size={22} className="text-rose-400" />;
      default:
        return <Server size={22} className="text-slate-400" />;
    }
  };

  const getBorderColor = () => {
    if (isDeleteMode) return 'border-rose-500/80 hover:border-rose-400';
    if (isCableSrc) return 'border-amber-400 shadow-amber-500/30 ring-2 ring-amber-400 animate-pulse';
    if (isPduSrc) return 'border-emerald-400 shadow-emerald-500/40 ring-2 ring-emerald-400 animate-pulse';
    if (isSelected) return 'border-cyan-400 shadow-cyan-500/40 ring-2 ring-cyan-400';
    return 'border-slate-700 hover:border-slate-500';
  };

  // Get primary IP display
  const primaryIp = Object.values(device.ports).find(p => p.ip)?.ip;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (isDeleteMode) {
      removeDevice(device.id);
      useEventLogStore.getState().addLog({
        type: 'TOPOLOGY',
        status: 'warn',
        title: `ลบอุปกรณ์ ${device.name}`,
        details: `ลบ ${device.name} (${device.type}) และสายเชื่อมต่อที่เกี่ยวข้องทั้งหมดออกจากผัง`
      });
      return;
    }

    if (currentTool === 'cable') {
      if (onOpenPortSelect) {
        onOpenPortSelect(device);
      }
      return;
    }

    if (currentTool === 'packet' || currentTool === 'http') {
      const proto = currentTool === 'packet' ? 'icmp' : 'tcp';
      if (!packetSource) {
        setPacketSource({ deviceId: device.id, protocol: proto });
      } else {
        if (packetSource.deviceId === device.id) {
          setPacketSource(null);
          return;
        }
        const srcDev = devices.find(d => d.id === packetSource.deviceId);
        if (srcDev) {
          const res = PacketTracer.trace(
            srcDev, 
            device, 
            devices, 
            cables, 
            packetSource.protocol, 
            packetSource.protocol === 'tcp' ? 80 : undefined
          );
          setLastSimulationResult(res);

          useEventLogStore.getState().addLog({
            type: packetSource.protocol === 'tcp' ? 'SIM_HTTP' : 'SIM_ICMP',
            status: res.success ? 'ok' : 'fail',
            title: `${packetSource.protocol.toUpperCase()}: ${srcDev.name} ➔ ${device.name}`,
            details: res.reason
          });
        }
        setPacketSource(null);
        setTool('select');
      }
      return;
    }

    // Double tap / double click detection for opening CLI
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      selectDevice(device.id);
      openModal('cli', device.id);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Start dragging
    selectDevice(device.id);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      devX: device.x,
      devY: device.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStartRef.current.startX) / zoom;
    const dy = (e.clientY - dragStartRef.current.startY) / zoom;
    updateDevicePosition(
      device.id,
      dragStartRef.current.devX + dx,
      dragStartRef.current.devY + dy
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  return (
    <div
      style={{
        transform: `translate3d(${device.x}px, ${device.y}px, 0)`,
        position: 'absolute',
        left: 0,
        top: 0
      }}
      className="cursor-pointer select-none group"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div 
        className={`w-16 h-16 rounded-2xl bg-slate-900/90 border-2 ${getBorderColor()} shadow-xl flex flex-col items-center justify-center gap-1 transition-all group-hover:scale-105 backdrop-blur`}
      >
        {getDeviceIcon(device.type)}
        <span className="text-[10px] font-mono font-bold text-white tracking-tight px-1 truncate max-w-[56px]">
          {device.name}
        </span>
      </div>

      {/* IP Badge Sub-label */}
      {primaryIp && (
        <div className="mt-1 text-center">
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950/80 text-cyan-300 border border-slate-800">
            {primaryIp}
          </span>
        </div>
      )}

      {/* CLI Quick Action Pill */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal('cli', device.id);
          }}
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg transition animate-in zoom-in-75"
          title="เปิด Cisco CLI Terminal"
        >
          <Terminal size={13} />
        </button>
      )}
    </div>
  );
};
