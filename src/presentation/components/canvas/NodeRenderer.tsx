import React, { useRef, useState } from 'react';
import { NetworkDevice, DeviceType } from '@core/types';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { useSessionStore } from '@application/stores/useSessionStore';
import { Router, Server, Laptop, Cloud, Terminal } from 'lucide-react';

interface NodeRendererProps {
  device: NetworkDevice;
  zoom: number;
  onOpenPortSelect?: (device: NetworkDevice) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({ device, zoom, onOpenPortSelect }) => {
  const { selectedDeviceId, selectDevice, updateDevicePosition, removeDevice } = useTopologyStore();
  const { currentTool, cableSource, openModal } = useSessionStore();

  const isSelected = selectedDeviceId === device.id;
  const isCableSrc = cableSource?.deviceId === device.id;
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
    if (isSelected) return 'border-cyan-400 shadow-cyan-500/40 ring-2 ring-cyan-400';
    return 'border-slate-700 hover:border-slate-500';
  };

  // Get primary IP display
  const primaryIp = Object.values(device.ports).find(p => p.ip)?.ip;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (isDeleteMode) {
      removeDevice(device.id);
      return;
    }

    if (currentTool === 'cable') {
      if (onOpenPortSelect) {
        onOpenPortSelect(device);
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
        transform: `translate3d(${device.x - 30}px, ${device.y - 30}px, 0)`
      }}
      className={`absolute left-0 top-0 w-16 h-16 rounded-2xl bg-slate-900/90 backdrop-blur-md border ${getBorderColor()} shadow-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-shadow select-none group touch-none`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Device Icon */}
      <div className="relative">
        {getDeviceIcon(device.type)}
        {/* Quick CLI Icon button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            selectDevice(device.id);
            openModal('cli', device.id);
          }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-800 border border-slate-600 text-cyan-300 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-cyan-500 hover:text-slate-950 transition shadow"
          title="เปิด Cisco CLI"
        >
          <Terminal size={10} />
        </button>
      </div>

      {/* Device Name Label */}
      <span className="text-[10px] font-bold font-mono text-slate-200 mt-1 truncate max-w-[56px] text-center">
        {device.name}
      </span>

      {/* Primary IP Indicator */}
      {primaryIp && (
        <div className="absolute -bottom-4 px-1.5 py-0.2 rounded-md bg-slate-950/90 border border-slate-800 text-[9px] font-mono text-cyan-300 shadow whitespace-nowrap pointer-events-none">
          {primaryIp}
        </div>
      )}
    </div>
  );
};

