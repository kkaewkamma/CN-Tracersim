/**
 * NetSim Touch v4.0 Ultimate - Canvas & Topology UI Renderer
 * Supports:
 * - Infinite Canvas Pan & Zoom (50% - 150%)
 * - SVG Cable Rendering with 802.1Q Trunk & NAT indicators
 * - 5 Device Types: Router, Switch, PC, Server, and ISP Cloud
 * - Realtime & Step-by-Step Packet Flight for both ICMP Ping & TCP Port 80 HTTP
 */

const CanvasUI = {
    canvasEl: null,
    viewportEl: null,
    cableSvgEl: null,
    nodesContainerEl: null,
    pduContainerEl: null,
    draggingDevice: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    panX: 0,
    panY: 0,
    zoom: 1.0,
    lastTapTime: 0,
    lastTapDevId: null,
    activeStepController: null,

    init() {
        this.canvasEl = document.getElementById('canvasContainer');
        this.viewportEl = document.getElementById('canvasViewport');
        this.cableSvgEl = document.getElementById('cableLayer');
        this.nodesContainerEl = document.getElementById('nodesLayer');
        this.pduContainerEl = document.getElementById('pduLayer');

        this.canvasEl.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', () => this.onPointerUp());
        window.addEventListener('pointercancel', () => this.onPointerUp());

        // Wheel zoom on desktop
        this.canvasEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            this.setZoom(this.zoom + delta);
        }, { passive: false });

        // Empty canvas pointerdown -> Deselect & start Panning
        this.canvasEl.addEventListener('pointerdown', (e) => {
            if (e.target === this.canvasEl || e.target === this.viewportEl || e.target === this.cableSvgEl || e.target === this.nodesContainerEl) {
                if (window.appState.currentTool === 'cable') {
                    window.appState.cableSourceDevice = null;
                }
                if (window.appState.currentTool === 'pdu' || window.appState.currentTool === 'http') {
                    window.appState.pduSourceDevice = null;
                }
                window.appState.selectedDeviceId = null;
                this.isPanning = true;
                this.panStartX = e.clientX - this.panX;
                this.panStartY = e.clientY - this.panY;
                window.appState.renderAll();
            }
        });
    },

    setZoom(newZoom) {
        this.zoom = Math.max(0.5, Math.min(1.5, Math.round(newZoom * 10) / 10));
        this.applyViewportTransform();
        const zoomBadge = document.getElementById('zoomLevelBadge');
        if (zoomBadge) {
            zoomBadge.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    },

    resetView() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.applyViewportTransform();
        const zoomBadge = document.getElementById('zoomLevelBadge');
        if (zoomBadge) zoomBadge.textContent = '100%';
    },

    applyViewportTransform() {
        if (this.viewportEl) {
            this.viewportEl.style.transform = `translate3d(${this.panX}px, ${this.panY}px, 0) scale(${this.zoom})`;
        }
    },

    screenToCanvasCoords(clientX, clientY) {
        const rect = this.canvasEl.getBoundingClientRect();
        const x = (clientX - rect.left - this.panX) / this.zoom;
        const y = (clientY - rect.top - this.panY) / this.zoom;
        return { x, y };
    },

    onPointerMove(e) {
        if (this.draggingDevice) {
            const pt = this.screenToCanvasCoords(e.clientX, e.clientY);
            this.draggingDevice.x = Math.round(pt.x - this.dragOffsetX);
            this.draggingDevice.y = Math.round(pt.y - this.dragOffsetY);
            this.renderCables();
            this.renderNodePosition(this.draggingDevice);
            return;
        }
        if (this.isPanning) {
            this.panX = e.clientX - this.panStartX;
            this.panY = e.clientY - this.panStartY;
            this.applyViewportTransform();
        }
    },

    onPointerUp() {
        if (this.draggingDevice) {
            this.draggingDevice = null;
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
        }
        if (this.isPanning) {
            this.isPanning = false;
        }
    },

    renderAll() {
        this.applyViewportTransform();
        this.renderCables();
        this.renderNodes();
    },

    renderCables() {
        if (!this.cableSvgEl) return;
        this.cableSvgEl.innerHTML = '';
        const devices = window.appState.devices;
        const cables = window.appState.cables;
        const isDeleteMode = window.appState.currentTool === 'delete';

        cables.forEach(c => {
            const d1 = devices.find(d => d.id === c.from);
            const d2 = devices.find(d => d.id === c.to);
            if (!d1 || !d2) return;

            const up1 = d1.ports[c.fromPort]?.up;
            const up2 = d2.ports[c.toPort]?.up;
            const active = up1 && up2;

            const isTrunkLink =
                d1.ports[c.fromPort]?.mode === 'trunk' ||
                d2.ports[c.toPort]?.mode === 'trunk';

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', d1.x);
            line.setAttribute('y1', d1.y);
            line.setAttribute('x2', d2.x);
            line.setAttribute('y2', d2.y);
            line.setAttribute('stroke', isDeleteMode ? '#fb7185' : (active ? (isTrunkLink ? '#c084fc' : '#38bdf8') : '#f43f5e'));
            line.setAttribute('stroke-width', isDeleteMode ? '4.5' : (isTrunkLink ? '4.2' : '3.5'));
            line.setAttribute('stroke-linecap', 'round');
            if (!active) {
                line.setAttribute('stroke-dasharray', '6,6');
            }
            this.cableSvgEl.appendChild(line);

            if (isTrunkLink && active && !isDeleteMode) {
                const mx = (d1.x + d2.x) / 2;
                const my = (d1.y + d2.y) / 2;
                const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                badge.setAttribute('x', mx);
                badge.setAttribute('y', my - 7);
                badge.setAttribute('text-anchor', 'middle');
                badge.setAttribute('fill', '#e9d5ff');
                badge.setAttribute('font-size', '9');
                badge.setAttribute('font-weight', 'bold');
                badge.setAttribute('font-family', 'JetBrains Mono, monospace');
                badge.textContent = '802.1Q TRUNK';
                this.cableSvgEl.appendChild(badge);
            }

            if (isDeleteMode) {
                const hitLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                hitLine.setAttribute('x1', d1.x);
                hitLine.setAttribute('y1', d1.y);
                hitLine.setAttribute('x2', d2.x);
                hitLine.setAttribute('y2', d2.y);
                hitLine.setAttribute('stroke', 'transparent');
                hitLine.setAttribute('stroke-width', '26');
                hitLine.style.pointerEvents = 'stroke';
                hitLine.style.cursor = 'pointer';
                hitLine.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                    window.appState.deleteCable(c.id);
                });
                this.cableSvgEl.appendChild(hitLine);
            }

            this.renderPortIndicator(d1.x, d1.y, d2.x, d2.y, c.fromPort, up1);
            this.renderPortIndicator(d2.x, d2.y, d1.x, d1.y, c.toPort, up2);
        });
    },

    renderPortIndicator(x1, y1, x2, y2, portName, isUp) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return;

        const offsetDist = Math.min(42, dist * 0.28);
        const px = x1 + (dx / dist) * offsetDist;
        const py = y1 + (dy / dist) * offsetDist;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', px);
        circle.setAttribute('cy', py);
        circle.setAttribute('r', '4.5');
        circle.setAttribute('fill', isUp ? '#10b981' : '#f43f5e');
        circle.setAttribute('stroke', '#0d1520');
        circle.setAttribute('stroke-width', '1.5');
        this.cableSvgEl.appendChild(circle);

        if (dist > 110) {
            const labelOffset = Math.min(62, dist * 0.36);
            const lx = x1 + (dx / dist) * labelOffset;
            const ly = y1 + (dy / dist) * labelOffset;
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', lx);
            text.setAttribute('y', ly - 6);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#94a3b8');
            text.setAttribute('font-size', '9');
            text.setAttribute('font-family', 'JetBrains Mono, monospace');
            text.textContent = portName;
            this.cableSvgEl.appendChild(text);
        }
    },

    renderNodes() {
        if (!this.nodesContainerEl) return;
        this.nodesContainerEl.innerHTML = '';
        const devices = window.appState.devices;
        const selectedId = window.appState.selectedDeviceId;
        const cableSrcId = window.appState.cableSourceDevice?.id;
        const pduSrcId = window.appState.pduSourceDevice?.id;

        devices.forEach(dev => {
            const el = document.createElement('div');
            el.id = `node_${dev.id}`;
            const isSelected = dev.id === selectedId || dev.id === cableSrcId || dev.id === pduSrcId;
            el.className = `device-node absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer ${isSelected ? 'selected' : ''}`;
            el.style.left = `${dev.x}px`;
            el.style.top = `${dev.y}px`;

            let ipLabel = 'No IP';
            if (dev.type === 'switch') {
                const hasTrunk = Object.values(dev.ports).some(p => p.mode === 'trunk');
                const vlans = [...new Set(Object.values(dev.ports).filter(p => p.mode !== 'trunk').map(p => p.vlan || 1))];
                ipLabel = hasTrunk ? `VLAN ${vlans.join(',')} + TRUNK` : (vlans.length > 1 ? `VLAN ${vlans.join(',')}` : `VLAN ${vlans[0] || 1}`);
            } else {
                const activePorts = Object.values(dev.ports).filter(p => p.ip);
                if (activePorts.length === 1) {
                    ipLabel = activePorts[0].ip;
                } else if (activePorts.length > 1) {
                    ipLabel = `${activePorts[0].ip} (+${activePorts.length - 1})`;
                }
            }

            let badges = '';
            if (dev.type === 'router') {
                if (dev.ospf?.networks?.length > 0) {
                    badges += `<span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono">OSPF</span>`;
                }
                if (dev.acls?.length > 0) {
                    badges += `<span class="px-1.5 py-0.2 rounded bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[9px] font-mono">ACL</span>`;
                }
                if (dev.natEnabled || Object.values(dev.ports).some(p => p.nat)) {
                    badges += `<span class="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono">NAT</span>`;
                }
            }
            if (dev.type === 'switch' && dev.ipRouting) {
                badges += `<span class="px-1.5 py-0.2 rounded bg-purple-500/25 text-purple-300 border border-purple-500/40 text-[9px] font-mono">L3-SW</span>`;
            }
            if (dev.ipv6Routing || Object.values(dev.ports).some(p => p.ipv6)) {
                badges += `<span class="px-1.5 py-0.2 rounded bg-sky-500/25 text-sky-300 border border-sky-500/40 text-[9px] font-mono">IPv6</span>`;
            }

            const nextTutorStep = window.AcademyTutor ? window.AcademyTutor.getNextPendingStep() : null;
            const isTutorTarget = nextTutorStep && nextTutorStep.device && nextTutorStep.device.toLowerCase() === dev.name.toLowerCase();
            const tutorHighlightHtml = isTutorTarget
                ? `<div class="mb-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[9px] shadow-lg animate-bounce whitespace-nowrap">🎯 แตะฝึก CLI ขั้นที่ ${nextTutorStep.index + 1}</div>`
                : '';

            el.innerHTML = `
                ${tutorHighlightHtml}
                <div class="device-icon-box w-14 h-14 rounded-2xl border-2 ${isSelected ? 'border-cyan-400 bg-slate-800' : isTutorTarget ? 'border-amber-400 bg-slate-800/95 ring-4 ring-amber-400/25' : 'border-slate-700 bg-slate-900/90'} flex items-center justify-center shadow-xl backdrop-blur-sm transition">
                    ${this.getDeviceSvgIcon(dev.type)}
                </div>
                <div class="mt-1 px-2.5 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-bold text-white shadow-md flex items-center gap-1">
                    <span>${dev.name}</span>
                    ${badges}
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

        if (tool === 'delete') {
            window.appState.deleteDevice(dev.id);
            return;
        }

        if (tool === 'cable') {
            if (!window.appState.cableSourceDevice) {
                window.appState.cableSourceDevice = dev;
                window.appState.renderAll();
                window.appState.logEvent('CABLE', `เลือกต้นทาง: ${dev.name} (แตะอุปกรณ์ปลายทางเพื่อต่อสาย)`, 'info');
                return;
            }
            if (window.appState.cableSourceDevice.id !== dev.id) {
                ModalController.openPortModal(window.appState.cableSourceDevice, dev);
            }
            window.appState.cableSourceDevice = null;
            window.appState.renderAll();
            return;
        }

        if (tool === 'pdu') {
            if (!window.appState.pduSourceDevice) {
                window.appState.pduSourceDevice = dev;
                window.appState.renderAll();
                window.appState.logEvent('PING', `เลือกต้นทาง: ${dev.name} (แตะอุปกรณ์ปลายทางที่จะส่ง Ping)`, 'info');
                return;
            }
            const src = window.appState.pduSourceDevice;
            window.appState.pduSourceDevice = null;
            window.appState.renderAll();
            window.appState.triggerVisualPing(src, dev);
            return;
        }

        if (tool === 'http') {
            if (!window.appState.pduSourceDevice) {
                window.appState.pduSourceDevice = dev;
                window.appState.renderAll();
                window.appState.logEvent('HTTP WEB', `เลือกเครื่องเปิดเว็บ: ${dev.name} (แตะ Web Server หรือ ISP Cloud ปลายทาง)`, 'info');
                return;
            }
            const src = window.appState.pduSourceDevice;
            window.appState.pduSourceDevice = null;
            window.appState.renderAll();
            window.appState.triggerVisualHttp(src, dev);
            return;
        }

        const now = Date.now();
        if (this.lastTapDevId === dev.id && (now - this.lastTapTime) < 350) {
            ModalController.openConfigModal(dev.id, 'gui');
            this.lastTapTime = 0;
            this.lastTapDevId = null;
            return;
        }
        this.lastTapTime = now;
        this.lastTapDevId = dev.id;

        window.appState.selectedDeviceId = dev.id;
        this.draggingDevice = dev;
        const pt = this.screenToCanvasCoords(e.clientX, e.clientY);
        this.dragOffsetX = pt.x - dev.x;
        this.dragOffsetY = pt.y - dev.y;
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
            case 'cloud':
                return `
                <svg class="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" class="stroke-purple-400 fill-purple-500/15" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
                </svg>`;
        }
        return '';
    },

    animatePacket(hops, isSuccess, onFinished, proto = 'icmp') {
        if (!hops || hops.length === 0) {
            if (onFinished) onFinished();
            return;
        }

        if (this.activeStepController) {
            this.activeStepController.cleanup();
            this.activeStepController = null;
        }

        const isHttp = proto === 'tcp';
        const packet = document.createElement('div');
        packet.className = `pdu-packet pdu-pulse flex items-center justify-center rounded-full ${isHttp ? 'bg-purple-400' : 'bg-cyan-400'} text-slate-950 shadow-xl cursor-pointer font-mono text-[10px] font-bold`;
        packet.style.pointerEvents = 'auto';
        packet.title = 'แตะเพื่อเปิด OSI 7-Layer Inspector';
        packet.innerHTML = isHttp ? 'HTTP' : `
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
        `;
        packet.onclick = (e) => {
            e.stopPropagation();
            ModalController.openPduInspectorModal(0);
        };

        this.pduContainerEl.appendChild(packet);

        const totalHops = hops.length;
        const isStepMode = window.appState && window.appState.simMode === 'step';
        const stepBar = document.getElementById('stepControlBar');
        const stepLabel = document.getElementById('stepControlLabel');

        if (isStepMode && stepBar) {
            let currentIdx = 0;
            stepBar.classList.remove('hidden');

            const renderCurrentStep = () => {
                const current = hops[currentIdx];
                packet.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
                packet.onclick = (e) => {
                    e.stopPropagation();
                    ModalController.openPduInspectorModal(currentIdx);
                };
                if (stepLabel) {
                    stepLabel.textContent = `Hop ${currentIdx + 1}/${totalHops}: ${current.name}`;
                }
            };

            const cleanup = () => {
                packet.remove();
                stepBar.classList.add('hidden');
                this.activeStepController = null;
            };

            this.activeStepController = {
                next: () => {
                    if (currentIdx + 1 < totalHops) {
                        currentIdx++;
                        renderCurrentStep();
                    } else {
                        if (isSuccess) {
                            packet.className = 'pdu-packet flex items-center justify-center rounded-full bg-emerald-400 text-slate-950 scale-125 transition duration-300';
                        } else {
                            packet.className = 'pdu-packet flex items-center justify-center rounded-full bg-rose-500 text-white scale-125 transition duration-300';
                            packet.innerHTML = '✕';
                        }
                        setTimeout(() => {
                            cleanup();
                            if (onFinished) onFinished();
                        }, 500);
                    }
                },
                inspect: () => {
                    ModalController.openPduInspectorModal(currentIdx);
                },
                cleanup
            };

            renderCurrentStep();
            return;
        }

        const moveToHop = (idx) => {
            if (idx >= totalHops) {
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

            const delay = idx === 0 ? 50 : 380;
            setTimeout(() => {
                moveToHop(idx + 1);
            }, delay);
        };

        moveToHop(0);
    }
};

window.CanvasUI = CanvasUI;
