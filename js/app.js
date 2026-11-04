/**
 * NetSim Touch - Main Application Coordinator & State Store
 */

const appState = {
    devices: [],
    cables: [],
    currentTool: 'select',
    selectedDeviceId: null,
    cableSourceDevice: null,
    pduSourceDevice: null,
    counters: { router: 0, switch: 0, pc: 1, server: 1 },

    init() {
        CanvasUI.init();
        this.loadPresetTopology('subnets');
        this.setTool('select');
        this.logEvent('SYSTEM', 'NetSim Touch พร้อมใช้งานสำหรับ iPad และเดสก์ท็อป', 'info');
    },

    createDeviceObject(type, x, y, customName = null) {
        const id = 'dev_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        let name = customName;
        let ports = {};
        let gateway = '';

        if (type === 'router') {
            name = name || `R${++this.counters.router}`;
            ports = {
                'Gig0/0': { ip: '', mask: '255.255.255.0', up: false },
                'Gig0/1': { ip: '', mask: '255.255.255.0', up: false }
            };
        } else if (type === 'switch') {
            name = name || `SW${++this.counters.switch}`;
            ports = {
                'Fa0/1': { ip: '', mask: '', up: true },
                'Fa0/2': { ip: '', mask: '', up: true },
                'Fa0/3': { ip: '', mask: '', up: true },
                'Fa0/4': { ip: '', mask: '', up: true }
            };
        } else if (type === 'pc') {
            name = name || `PC${this.counters.pc++}`;
            ports = {
                'Eth0': { ip: '', mask: '255.255.255.0', up: true }
            };
        } else if (type === 'server') {
            name = name || `SRV${this.counters.server++}`;
            ports = {
                'Eth0': { ip: '', mask: '255.255.255.0', up: true }
            };
        }

        return {
            id,
            type,
            name,
            x: Math.round(x),
            y: Math.round(y),
            gateway,
            ports,
            cliMode: 'user',
            cliCurrentIf: null,
            cliHistory: `Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M)\nTechnical Support: http://www.cisco.com/techsupport\n\nPress RETURN to get started!\n\n`
        };
    },

    addDeviceFromPalette(type) {
        const rect = document.getElementById('canvasContainer').getBoundingClientRect();
        const cx = (rect.width / 2) + (Math.random() - 0.5) * 160;
        const cy = (rect.height / 2) + (Math.random() - 0.5) * 120;

        const dev = this.createDeviceObject(type, cx, cy);
        this.devices.push(dev);
        this.selectedDeviceId = dev.id;
        this.setTool('select');
        this.renderAll();
        this.logEvent('TOPOLOGY', `เพิ่ม ${dev.name} (${dev.type.toUpperCase()}) บนกระดาน`, 'info');
    },

    deleteDevice(devId) {
        const dev = this.devices.find(d => d.id === devId);
        if (!dev) return;

        this.cables = this.cables.filter(c => c.from !== devId && c.to !== devId);
        this.devices = this.devices.filter(d => d.id !== devId);
        if (this.selectedDeviceId === devId) {
            this.selectedDeviceId = null;
        }
        this.renderAll();
        this.logEvent('TOPOLOGY', `ลบอุปกรณ์ ${dev.name} สำเร็จ`, 'warn');
    },

    addCable(fromId, fromPort, toId, toPort) {
        const fromDev = this.devices.find(d => d.id === fromId);
        const toDev = this.devices.find(d => d.id === toId);
        if (!fromDev || !toDev) return;

        const cable = {
            id: 'c_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            from: fromId,
            fromPort,
            to: toId,
            toPort
        };
        this.cables.push(cable);
        this.renderAll();
        this.logEvent('CABLE', `เชื่อมต่อสาย: ${fromDev.name} (${fromPort}) ⟷ ${toDev.name} (${toPort})`, 'ok');
    },

    setTool(tool) {
        this.currentTool = tool;
        this.cableSourceDevice = null;
        this.pduSourceDevice = null;

        // Update Tool Button styles
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.className = 'tool-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-slate-800/70 text-slate-300 border-2 border-transparent transition active:scale-95';
        });

        const activeBtn = document.getElementById(`tool-${tool}`);
        if (activeBtn) {
            activeBtn.className = 'tool-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400 transition active:scale-95 shadow-lg';
        }

        // Update Banner Text
        const bannerTextEl = document.getElementById('modeBannerText');
        if (bannerTextEl) {
            switch (tool) {
                case 'select':
                    bannerTextEl.textContent = 'โหมดเลือกและลากย้าย (แตะ 1 ครั้งเพื่อเลือก, แตะ 2 ครั้งเพื่อเปิด CLI)';
                    break;
                case 'cable':
                    bannerTextEl.textContent = 'โหมดต่อสายแลน (แตะอุปกรณ์ต้นทาง แล้วแตะอุปกรณ์ปลายทาง)';
                    break;
                case 'pdu':
                    bannerTextEl.textContent = 'โหมดจำลองส่ง Ping (แตะต้นทาง แล้วแตะปลายทาง)';
                    break;
                case 'delete':
                    bannerTextEl.textContent = 'โหมดลบอุปกรณ์ (แตะอุปกรณ์ที่ต้องการนำออกจากกระดาน)';
                    break;
            }
        }
    },

    renderAll() {
        CanvasUI.renderAll();
        this.updateQuickSelectionUI();
        this.updateIpSummaryTable();
    },

    updateQuickSelectionUI() {
        const btnConfig = document.getElementById('btnOpenConfig');
        const pill = document.getElementById('quickActionPill');
        const dev = this.devices.find(d => d.id === this.selectedDeviceId);

        if (dev) {
            if (btnConfig) btnConfig.disabled = false;
            if (pill) {
                pill.classList.remove('hidden');
                document.getElementById('quickPillName').textContent = dev.name;
                document.getElementById('quickPillSub').textContent = 
                    dev.type === 'router' ? 'Cisco 2911 Router' :
                    dev.type === 'switch' ? 'Catalyst 2960 Switch' :
                    dev.type === 'pc' ? 'PC Host' : 'Web Server';
            }
        } else {
            if (btnConfig) btnConfig.disabled = true;
            if (pill) pill.classList.add('hidden');
        }
    },

    updateIpSummaryTable() {
        const list = document.getElementById('ipSummaryList');
        const badge = document.getElementById('deviceCountBadge');
        if (badge) badge.textContent = `${this.devices.length} Nodes`;
        if (!list) return;

        list.innerHTML = '';
        this.devices.forEach(dev => {
            Object.entries(dev.ports).forEach(([pName, pObj]) => {
                if (pObj.ip) {
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/80 text-[11px] font-mono border border-slate-700/60';
                    row.innerHTML = `
                        <div class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full ${pObj.up ? 'bg-emerald-400' : 'bg-rose-500'}"></span>
                            <span class="text-slate-300 font-semibold">${dev.name}</span>
                            <span class="text-slate-500 text-[10px]">(${pName})</span>
                        </div>
                        <span class="text-cyan-400 font-bold">${pObj.ip}</span>
                    `;
                    list.appendChild(row);
                }
            });
        });
    },

    triggerVisualPing(srcDev, dstDev) {
        this.logEvent('PING', `กำลังส่ง ICMP Echo Request จาก ${srcDev.name} ➔ ${dstDev.name}...`, 'info');

        const sim = NetworkEngine.simulatePing(srcDev, dstDev, this.devices, this.cables);

        CanvasUI.animatePacket(sim.hops, sim.success, () => {
            if (sim.success) {
                this.logEvent('PING SUCCESS', sim.reason, 'ok');
            } else {
                this.logEvent('PING FAILED', sim.reason, 'fail');
            }
        });
    },

    loadPresetTopology(type = 'subnets') {
        this.devices = [];
        this.cables = [];
        this.selectedDeviceId = null;
        this.counters = { router: 0, switch: 0, pc: 1, server: 1 };

        const rect = document.getElementById('canvasContainer').getBoundingClientRect();
        const cx = Math.max(340, rect.width / 2);
        const cy = Math.max(220, rect.height / 2);

        if (type === 'subnets') {
            const r1 = this.createDeviceObject('router', cx, cy - 95, 'R1-Core');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true };
            r1.ports['Gig0/1'] = { ip: '192.168.20.1', mask: '255.255.255.0', up: true };

            const sw1 = this.createDeviceObject('switch', cx - 180, cy + 15, 'SW1');
            const sw2 = this.createDeviceObject('switch', cx + 180, cy + 15, 'SW2');

            const pc1 = this.createDeviceObject('pc', cx - 250, cy + 140, 'PC1');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.0', up: true };
            pc1.gateway = '192.168.10.1';

            const srv1 = this.createDeviceObject('server', cx + 250, cy + 140, 'Web-SRV');
            srv1.ports['Eth0'] = { ip: '192.168.20.100', mask: '255.255.255.0', up: true };
            srv1.gateway = '192.168.20.1';

            this.devices.push(r1, sw1, sw2, pc1, srv1);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c2', from: r1.id, fromPort: 'Gig0/1', to: sw2.id, toPort: 'Fa0/1' },
                { id: 'c3', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c4', from: sw2.id, fromPort: 'Fa0/2', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
        } else if (type === 'blank') {
            this.logEvent('SYSTEM', 'ล้างกระดานสร้างแล็บใหม่เรียบร้อย', 'info');
        }

        this.renderAll();
    },

    exportLabJson() {
        const payload = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            devices: this.devices,
            cables: this.cables,
            counters: this.counters
        };
        return JSON.stringify(payload, null, 2);
    },

    importLabJson(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (!data.devices || !data.cables) {
                alert('รูปแบบไฟล์ JSON ไม่ถูกต้องสำหรับ NetSim Lab');
                return false;
            }
            this.devices = data.devices;
            this.cables = data.cables;
            this.counters = data.counters || { router: 0, switch: 0, pc: 1, server: 1 };
            this.selectedDeviceId = null;
            this.renderAll();
            this.logEvent('LAB', 'นำเข้า Topology จากไฟล์ JSON สำเร็จ', 'ok');
            return true;
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการแปลง JSON: ' + err.message);
            return false;
        }
    },

    logEvent(tag, msg, lvl = 'info') {
        const box = document.getElementById('eventLogList');
        if (!box) return;

        const colorMap = {
            info: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20',
            ok: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
            warn: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
            fail: 'text-rose-400 border-rose-500/20 bg-rose-950/20'
        };

        const item = document.createElement('div');
        item.className = `p-2 rounded-xl border text-[11px] font-mono shadow-sm ${colorMap[lvl] || colorMap.info}`;
        item.innerHTML = `<span class="font-bold">[${tag}]</span> ${msg}`;
        box.insertBefore(item, box.firstChild);
    },

    clearEventLog() {
        const box = document.getElementById('eventLogList');
        if (box) box.innerHTML = '';
    }
};

window.appState = appState;
window.onload = () => appState.init();
