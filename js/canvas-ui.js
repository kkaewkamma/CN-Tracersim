/**
 * NetSim Touch - Canvas & Topology UI Renderer
 * Handles SVG cable rendering, node drag-and-drop, touch gestures, and animated PDU packet flight.
 */

const CanvasUI = {
    canvasEl: null,
    cableSvgEl: null,
    nodesContainerEl: null,
    pduContainerEl: null,
    draggingDevice: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    lastTapTime: 0,
    lastTapDevId: null,

    init() {
        this.canvasEl = document.getElementById('canvasContainer');
        this.cableSvgEl = document.getElementById('cableLayer');
        this.nodesContainerEl = document.getElementById('nodesLayer');
        this.pduContainerEl = document.getElementById('pduLayer');

        // Pointer move on canvas
        this.canvasEl.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', () => this.onPointerUp());
        window.addEventListener('pointercancel', () => this.onPointerUp());

        // Deselect tool/device when clicking on empty canvas
        this.canvasEl.addEventListener('pointerdown', (e) => {
            if (e.target === this.canvasEl || e.target === this.cableSvgEl || e.target === this.nodesContainerEl) {
                if (window.appState.currentTool === 'cable') {
                    window.appState.cableSourceDevice = null;
                }
                if (window.appState.currentTool === 'pdu') {
                    window.appState.pduSourceDevice = null;
                }
                window.appState.selectedDeviceId = null;
                window.appState.renderAll();
            }
        });
    },

    onPointerMove(e) {
        if (!this.draggingDevice) return;
        const rect = this.canvasEl.getBoundingClientRect();
        const curX = e.clientX - rect.left - this.dragOffsetX;
        const curY = e.clientY - rect.top - this.dragOffsetY;

        this.draggingDevice.x = Math.max(50, Math.min(rect.width - 50, curX));
        this.draggingDevice.y = Math.max(50, Math.min(rect.height - 50, curY));

        this.renderCables();
        this.renderNodePosition(this.draggingDevice);
    },

    onPointerUp() {
        if (this.draggingDevice) {
            this.draggingDevice = null;
            window.appState.renderAll();
        }
    },

    renderAll() {
        this.renderCables();
        this.renderNodes();
    },

    renderCables() {
        if (!this.cableSvgEl) return;
        this.cableSvgEl.innerHTML = '';
        const devices = window.appState.devices;
        const cables = window.appState.cables;

        cables.forEach(c => {
            const d1 = devices.find(d => d.id === c.from);
            const d2 = devices.find(d => d.id === c.to);
            if (!d1 || !d2) return;

            const up1 = d1.ports[c.fromPort]?.up;
            const up2 = d2.ports[c.toPort]?.up;
            const active = up1 && up2;

            // Main Cable Line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', d1.x);
            line.setAttribute('y1', d1.y);
            line.setAttribute('x2', d2.x);
            line.setAttribute('y2', d2.y);
            line.setAttribute('stroke', active ? '#38bdf8' : '#f43f5e');
            line.setAttribute('stroke-width', '3.5');
            line.setAttribute('stroke-linecap', 'round');
            if (!active) {
                line.setAttribute('stroke-dasharray', '6,6');
            }
            this.cableSvgEl.appendChild(line);

            // Port indicators near ends of line
            this.renderPortIndicator(d1.x, d1.y, d2.x, d2.y, c.fromPort, up1);
            this.renderPortIndicator(d2.x, d2.y, d1.x, d1.y, c.toPort, up2);
        });
    },

    renderPortIndicator(x1, y1, x2, y2, portName, isUp) {
        // Point along 25% of the line
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        const offsetDist = Math.min(38, dist * 0.28);
        const px = x1 + (dx / dist) * offsetDist;
        const py = y1 + (dy / dist) * offsetDist;

        // Status circle dot
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', px);
        circle.setAttribute('cy', py);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', isUp ? '#10b981' : '#f43f5e');
        circle.setAttribute('stroke', '#0d1520');
        circle.setAttribute('stroke-width', '1.5');
        this.cableSvgEl.appendChild(circle);
    },

    renderNodes() {
        if (!this.nodesContainerEl) return;
        this.nodesContainerEl.innerHTML = '';
        const devices = window.appState.devices;
        const selectedId = window.appState.selectedDeviceId;

        devices.forEach(dev => {
            const el = document.createElement('div');
            el.id = `node_${dev.id}`;
            const isSelected = dev.id === selectedId;
            el.className = `device-node absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer ${isSelected ? 'selected' : ''}`;
            el.style.left = `${dev.x}px`;
            el.style.top = `${dev.y}px`;

            // IP Summary label under node
            let ipLabel = 'No IP';
            if (dev.type === 'switch') {
                ipLabel = 'L2 Switch';
            } else {
                const assignedPort = Object.values(dev.ports).find(p => p.ip);
                if (assignedPort) {
                    ipLabel = assignedPort.ip;
                }
            }

            el.innerHTML = `
                <div class="device-icon-box w-14 h-14 rounded-2xl border-2 ${isSelected ? 'border-cyan-400 bg-slate-800' : 'border-slate-700 bg-slate-900/90'} flex items-center justify-center shadow-xl backdrop-blur-sm transition">
                    ${this.getDeviceSvgIcon(dev.type)}
                </div>
                <div class="mt-1 px-2.5 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-bold text-white shadow-md flex items-center gap-1.5">
                    <span>${dev.name}</span>
                </div>
                <div class="mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-slate-950/90 border border-slate-800 shadow">
                    ${ipLabel}
                </div>
            `;

            el.addEventListener('pointerdown', (e) => this.onNodePointerDown(e, dev));
            this.nodesContainerEl.appendChild(el);
        });
    },

    renderNodePosition(dev) {
        const el = document.getElementById(`node_${dev.id}`);
        if (el) {
            el.style.left = `${dev.x}px`;
            el.style.top = `${dev.y}px`;
        }
    },

    onNodePointerDown(e, dev) {
        e.stopPropagation();
        const tool = window.appState.currentTool;

        // Tool: Delete
        if (tool === 'delete') {
            window.appState.deleteDevice(dev.id);
            return;
        }

        // Tool: Cable connection
        if (tool === 'cable') {
            if (!window.appState.cableSourceDevice) {
                window.appState.cableSourceDevice = dev;
                window.appState.logEvent('CABLE', `เลือกอุปกรณ์ต้นทาง: ${dev.name} (แตะอุปกรณ์ปลายทาง)`, 'info');
                return;
            }
            if (window.appState.cableSourceDevice.id !== dev.id) {
                ModalController.openPortModal(window.appState.cableSourceDevice, dev);
            }
            window.appState.cableSourceDevice = null;
            return;
        }

        // Tool: PDU Ping
        if (tool === 'pdu') {
            if (!window.appState.pduSourceDevice) {
                window.appState.pduSourceDevice = dev;
                window.appState.logEvent('PING', `เลือกอุปกรณ์ต้นทาง: ${dev.name} (แตะอุปกรณ์ปลายทางที่จะส่ง Ping)`, 'info');
                return;
            }
            const src = window.appState.pduSourceDevice;
            window.appState.pduSourceDevice = null;
            window.appState.triggerVisualPing(src, dev);
            return;
        }

        // Double-Tap to open Config / CLI Modal
        const now = Date.now();
        if (this.lastTapDevId === dev.id && (now - this.lastTapTime) < 350) {
            ModalController.openConfigModal(dev.id, 'gui');
            this.lastTapTime = 0;
            this.lastTapDevId = null;
            return;
        }
        this.lastTapTime = now;
        this.lastTapDevId = dev.id;

        // Select and begin drag
        window.appState.selectedDeviceId = dev.id;
        this.draggingDevice = dev;
        const rect = this.canvasEl.getBoundingClientRect();
        this.dragOffsetX = (e.clientX - rect.left) - dev.x;
        this.dragOffsetY = (e.clientY - rect.top) - dev.y;
        window.appState.renderAll();
    },

    getDeviceSvgIcon(type) {
        switch (type) {
            case 'router':
                return `
                <svg class="w-8 h-8 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <circle cx="12" cy="12" r="9.5" class="stroke-sky-400 fill-sky-500/10"/>
                    <path d="M12 6v12m-6-6h12" stroke-linecap="round"/>
                    <path d="M9 9l3-3 3 3M9 15l3 3 3-3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
            case 'switch':
                return `
                <svg class="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="2.5" y="6" width="19" height="12" rx="2.5" class="stroke-indigo-400 fill-indigo-500/10"/>
                    <path d="M6 10h8m-2-2l2 2-2 2M18 14h-8m2-2l-2 2 2 2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
            case 'pc':
                return `
                <svg class="w-8 h-8 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3" y="4" width="18" height="12" rx="2" class="stroke-teal-400 fill-teal-500/10"/>
                    <path d="M8 20h8m-4-4v4" stroke-linecap="round"/>
                </svg>`;
            case 'server':
                return `
                <svg class="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3.5" y="3" width="17" height="5.5" rx="1.5" class="stroke-amber-400 fill-amber-500/10"/>
                    <rect x="3.5" y="9.5" width="17" height="5.5" rx="1.5" class="stroke-amber-400 fill-amber-500/10"/>
                    <rect x="3.5" y="16" width="17" height="5.5" rx="1.5" class="stroke-amber-400 fill-amber-500/10"/>
                    <circle cx="7" cy="5.7" r="0.8" fill="currentColor"/>
                    <circle cx="7" cy="12.2" r="0.8" fill="currentColor"/>
                    <circle cx="7" cy="18.7" r="0.8" fill="currentColor"/>
                </svg>`;
        }
        return '';
    },

    /**
     * Animate packet flying along hops
     */
    animatePacket(hops, isSuccess, onFinished) {
        if (!hops || hops.length === 0) {
            if (onFinished) onFinished();
            return;
        }

        const packet = document.createElement('div');
        packet.className = 'pdu-packet pdu-pulse flex items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-xl';
        packet.innerHTML = `
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
        `;

        this.pduContainerEl.appendChild(packet);

        let hopIndex = 0;
        const totalHops = hops.length;

        const moveToHop = (idx) => {
            if (idx >= totalHops) {
                // Arrived at destination!
                if (isSuccess) {
                    packet.className = 'pdu-packet flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 scale-125 transition duration-300';
                    setTimeout(() => {
                        packet.remove();
                        if (onFinished) onFinished();
                    }, 600);
                } else {
                    packet.className = 'pdu-packet flex items-center justify-center rounded-full bg-rose-500 text-white scale-125 transition duration-300';
                    packet.innerHTML = '✕';
                    setTimeout(() => {
                        packet.remove();
                        if (onFinished) onFinished();
                    }, 800);
                }
                return;
            }

            const current = hops[idx];
            packet.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;

            // Next hop duration
            const delay = idx === 0 ? 50 : 380;
            setTimeout(() => {
                moveToHop(idx + 1);
            }, delay);
        };

        moveToHop(0);
    }
};

window.CanvasUI = CanvasUI;
