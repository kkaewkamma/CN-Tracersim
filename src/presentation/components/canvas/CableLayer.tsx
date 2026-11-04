import React from 'react';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { useSessionStore } from '@application/stores/useSessionStore';

export const CableLayer: React.FC = () => {
  const { devices, cables, removeCable } = useTopologyStore();
  const { currentTool } = useSessionStore();
  const isDeleteMode = currentTool === 'delete';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      {cables.map((cable) => {
        const d1 = devices.find((d) => d.id === cable.from);
        const d2 = devices.find((d) => d.id === cable.to);
        if (!d1 || !d2) return null;

        const port1 = d1.ports[cable.fromPort];
        const port2 = d2.ports[cable.toPort];
        const isUp1 = port1?.up ?? false;
        const isUp2 = port2?.up ?? false;
        const isActive = isUp1 && isUp2;
        const isTrunk = port1?.mode === 'trunk' || port2?.mode === 'trunk';

        // Compute midpoint for trunk label
        const mx = (d1.x + d2.x) / 2;
        const my = (d1.y + d2.y) / 2;

        // Compute port indicator positions
        const dx = d2.x - d1.x;
        const dy = d2.y - d1.y;
        const dist = Math.hypot(dx, dy) || 1;
        const offset = Math.min(40, dist * 0.28);
        const p1x = d1.x + (dx / dist) * offset;
        const p1y = d1.y + (dy / dist) * offset;
        const p2x = d2.x - (dx / dist) * offset;
        const p2y = d2.y - (dy / dist) * offset;

        return (
          <g key={cable.id}>
            {/* Visual Cable Line */}
            <line
              x1={d1.x}
              y1={d1.y}
              x2={d2.x}
              y2={d2.y}
              stroke={
                isDeleteMode
                  ? '#fb7185'
                  : isActive
                  ? isTrunk
                    ? '#c084fc'
                    : '#38bdf8'
                  : '#f43f5e'
              }
              strokeWidth={isDeleteMode ? 4.5 : isTrunk ? 4 : 3}
              strokeDasharray={!isActive ? '6,6' : undefined}
              strokeLinecap="round"
            />

            {/* Click hitbox in delete mode */}
            {isDeleteMode && (
              <line
                x1={d1.x}
                y1={d1.y}
                x2={d2.x}
                y2={d2.y}
                stroke="transparent"
                strokeWidth={24}
                className="cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCable(cable.id);
                }}
              />
            )}

            {/* 802.1Q Trunk Badge */}
            {isTrunk && isActive && !isDeleteMode && (
              <g transform={`translate(${mx}, ${my - 8})`}>
                <rect
                  x={-42}
                  y={-10}
                  width={84}
                  height={16}
                  rx={4}
                  fill="#1e1528"
                  stroke="#a855f7"
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  dy={2}
                  fill="#e9d5ff"
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  802.1Q TRUNK
                </text>
              </g>
            )}

            {/* Port Status Indicators (Green = Up, Red = Down) */}
            <circle
              cx={p1x}
              cy={p1y}
              r={4}
              fill={isUp1 ? '#10b981' : '#f43f5e'}
              stroke="#0b111a"
              strokeWidth={1.5}
            />
            <circle
              cx={p2x}
              cy={p2y}
              r={4}
              fill={isUp2 ? '#10b981' : '#f43f5e'}
              stroke="#0b111a"
              strokeWidth={1.5}
            />
          </g>
        );
      })}
    </svg>
  );
};
