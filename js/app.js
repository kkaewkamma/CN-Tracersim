/**
 * NetSim Touch v4.0 Ultimate - Main Application Coordinator, State Store & PKA Auto-Grader
 */

const STORAGE_KEY = 'netsim_touch_autosave_v4';

const appState = {
    devices: [],
    cables: [],
    currentTool: 'select',
    simMode: 'realtime',
    selectedDeviceId: null,
    cableSourceDevice: null,
    pduSourceDevice: null,
    lastPduSimulation: null,
    activePresetId: 'subnets',
    counters: { router: 0, switch: 0, pc: 1, server: 1, cloud: 1 },

    init() {
        CanvasUI.init();
        const restored = this.loadFromLocalStorage();
        if (!restored) {
            this.loadPresetTopology('troubleshoot', false);
        }
        this.setTool('select');
        if (window.AcademyTutor) {
            window.AcademyTutor.init();
        }
        this.logEvent('SYSTEM', 'NetSim Touch v5.0 Academy Edition พร้อมใช้งาน (13 บทเรียนวิชา Network + ระบบผู้ช่วยฝึกสอน CLI ทีละขั้น)', 'info');
    },

    getDevice(id) {
        return this.devices.find(d => d.id === id) || null;
    },

    selectDevice(id) {
        this.selectedDeviceId = id;
        this.renderAll();
    },

    toggleSimMode() {
        this.simMode = this.simMode === 'realtime' ? 'step' : 'realtime';
        const btn = document.getElementById('btnSimModeToggle');
        if (btn) {
            if (this.simMode === 'step') {
                btn.className = 'px-3 py-1.5 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/50 text-xs font-bold flex items-center gap-1.5 transition shadow';
                btn.innerHTML = `<span>🐾 Step-by-Step</span>`;
                this.logEvent('SIM MODE', 'สลับเป็นโหมด Step-by-Step (เดินแพ็กเก็ตทีละ Hop พร้อมดู OSI 7 Layers)', 'warn');
            } else {
                btn.className = 'px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition';
                btn.innerHTML = `<span>⚡ Realtime</span>`;
                if (CanvasUI.activeStepController) {
                    CanvasUI.activeStepController.cleanup();
                }
                this.logEvent('SIM MODE', 'สลับเป็นโหมด Realtime (ส่งแพ็กเก็ตความเร็วปกติ)', 'info');
            }
        }
    },

    createDeviceObject(type, x, y, customName = null) {
        const id = 'dev_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        let name = customName;
        let ports = {};
        let gateway = '';
        let routes = [];
        let acls = [];
        let natEnabled = false;
        let natTranslations = [];
        let ospf = { processId: null, networks: [] };

        if (type === 'router') {
            name = name || `R${++this.counters.router}`;
            ports = {
                'Gig0/0': { ip: '', mask: '255.255.255.0', up: false, mac: NetworkEngine.generateMac('router') },
                'Gig0/1': { ip: '', mask: '255.255.255.0', up: false, mac: NetworkEngine.generateMac('router') },
                'Gig0/2': { ip: '', mask: '255.255.255.0', up: false, mac: NetworkEngine.generateMac('router') }
            };
        } else if (type === 'switch') {
            name = name || `SW${++this.counters.switch}`;
            ports = {
                'Fa0/1': { ip: '', mask: '', up: true, vlan: 1, mode: 'access', mac: NetworkEngine.generateMac('switch') },
                'Fa0/2': { ip: '', mask: '', up: true, vlan: 1, mode: 'access', mac: NetworkEngine.generateMac('switch') },
                'Fa0/3': { ip: '', mask: '', up: true, vlan: 1, mode: 'access', mac: NetworkEngine.generateMac('switch') },
                'Fa0/4': { ip: '', mask: '', up: true, vlan: 1, mode: 'access', mac: NetworkEngine.generateMac('switch') }
            };
        } else if (type === 'pc') {
            name = name || `PC${this.counters.pc++}`;
            ports = {
                'Eth0': { ip: '', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') }
            };
        } else if (type === 'server') {
            name = name || `SRV${this.counters.server++}`;
            ports = {
                'Eth0': { ip: '', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') }
            };
        } else if (type === 'cloud') {
            name = name || `ISP-Cloud${this.counters.cloud++}`;
            ports = {
                'WAN0': { ip: '8.8.8.8', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('cloud') }
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
            routes,
            acls,
            natEnabled,
            natTranslations,
            ospf,
            cmdHistory: [],
            cliMode: 'user',
            cliCurrentIf: null,
            cliHistory: `Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.4(3)M\nTechnical Support: http://www.cisco.com/techsupport\n\nPress RETURN to get started!\n\n`
        };
    },

    addDeviceFromPalette(type) {
        const rect = document.getElementById('canvasContainer').getBoundingClientRect();
        const cx = ((rect.width / 2) - CanvasUI.panX) / CanvasUI.zoom + (Math.random() - 0.5) * 140;
        const cy = ((rect.height / 2) - CanvasUI.panY) / CanvasUI.zoom + (Math.random() - 0.5) * 110;

        const dev = this.createDeviceObject(type, cx, cy);
        this.devices.push(dev);
        this.selectedDeviceId = dev.id;
        this.setTool('select');
        this.saveToLocalStorage();
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
        this.saveToLocalStorage();
        this.renderAll();
        this.logEvent('TOPOLOGY', `ลบอุปกรณ์ ${dev.name} สำเร็จ`, 'warn');
    },

    deleteCable(cableId) {
        const cable = this.cables.find(c => c.id === cableId);
        if (!cable) return;
        const d1 = this.devices.find(d => d.id === cable.from);
        const d2 = this.devices.find(d => d.id === cable.to);
        this.cables = this.cables.filter(c => c.id !== cableId);
        this.saveToLocalStorage();
        this.renderAll();
        this.logEvent('CABLE', `ถอดสายแลนระหว่าง ${d1 ? d1.name : '?'} (${cable.fromPort}) กับ ${d2 ? d2.name : '?'} (${cable.toPort})`, 'warn');
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
        this.saveToLocalStorage();
        this.renderAll();
        this.logEvent('CABLE', `เชื่อมต่อสาย: ${fromDev.name} (${fromPort}) ⟷ ${toDev.name} (${toPort})`, 'ok');
    },

    setTool(tool) {
        this.currentTool = tool;
        this.cableSourceDevice = null;
        this.pduSourceDevice = null;

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.className = 'tool-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-slate-800/70 text-slate-300 border-2 border-transparent transition active:scale-95';
        });

        const activeBtn = document.getElementById(`tool-${tool}`);
        if (activeBtn) {
            activeBtn.className = 'tool-btn w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center gap-1 bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400 transition active:scale-95 shadow-lg';
        }

        const bannerTextEl = document.getElementById('modeBannerText');
        if (bannerTextEl) {
            switch (tool) {
                case 'select':
                    bannerTextEl.textContent = 'โหมดเลือกและลากย้าย (แตะอุปกรณ์เพื่อเลือก, ลากพื้นหลังเพื่อเลื่อนกระดาน)';
                    break;
                case 'cable':
                    bannerTextEl.textContent = 'โหมดต่อสายแลน (แตะอุปกรณ์ต้นทาง แล้วแตะอุปกรณ์ปลายทาง)';
                    break;
                case 'pdu':
                    bannerTextEl.textContent = 'โหมดส่ง Ping ICMP (แตะต้นทาง ➔ ปลายทาง แล้วกดดู OSI 7 Layers)';
                    break;
                case 'http':
                    bannerTextEl.textContent = 'โหมดเปิดเว็บ HTTP Port 80 (แตะเครื่องต้นทาง ➔ แตะ Web Server / Cloud)';
                    break;
                case 'delete':
                    bannerTextEl.textContent = 'โหมดลบ (แตะที่ตัวอุปกรณ์ หรือแตะที่เส้นสายแลนสีชมพูเพื่อถอดสาย)';
                    break;
            }
        }
        this.renderAll();
    },

    renderAll() {
        CanvasUI.renderAll();
        this.updateQuickSelectionUI();
        this.updateIpSummaryTable();
        this.updateMissionBanner();
        this.updateLiveGradeBadge();
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
                    dev.type === 'cloud' ? 'ISP WAN Cloud' :
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
                    const isUp = NetworkEngine.isInterfaceUp(dev, pName);
                    const row = document.createElement('div');
                    row.className = 'flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/80 text-[11px] font-mono border border-slate-700/60';
                    row.innerHTML = `
                        <div class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-500'}"></span>
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

    /**
     * Evaluates current Lab Topology against PKA Grading Objectives (0% - 100%)
     */
    evaluateLabGrade() {
        const checks = [];
        let title = 'Custom Network Topology';

        const checkConnectivity = (nameA, nameB, proto = 'icmp') => {
            const devA = this.devices.find(d => d.name === nameA);
            const devB = this.devices.find(d => d.name === nameB);
            if (!devA || !devB) return false;
            const res = proto === 'tcp'
                ? NetworkEngine.simulateHttp(devA, devB, this.devices, this.cables)
                : NetworkEngine.simulatePing(devA, devB, this.devices, this.cables);
            return res.success;
        };

        if (this.activePresetId === 'troubleshoot') {
            title = 'Lab 04: Troubleshooting Challenge (ซ่อมระบบล่ม 3 จุด)';
            const r1 = this.devices.find(d => d.name === 'R1-Gateway');
            const pc1 = this.devices.find(d => d.name === 'PC1');
            const srv = this.devices.find(d => d.name === 'Payroll-SRV');
            checks.push(
                { label: 'เปิดพอร์ต Gig0/1 บน R1-Gateway (no shutdown)', passed: !!(r1 && r1.ports['Gig0/1']?.up) },
                { label: 'ตั้งค่า Default Gateway ของ PC1 เป็น 192.168.10.1', passed: !!(pc1 && pc1.gateway === '192.168.10.1') },
                { label: 'แก้ IP ของ Payroll-SRV เป็น 192.168.20.100', passed: !!(srv && srv.ports['Eth0']?.ip === '192.168.20.100') },
                { label: 'ส่ง Ping จาก PC1 ไปยัง Payroll-SRV สำเร็จ', passed: checkConnectivity('PC1', 'Payroll-SRV', 'icmp') }
            );
        } else if (this.activePresetId === 'roas-vlan') {
            title = 'Lab 05: VLAN Trunking & Router-on-a-Stick (802.1Q)';
            const sw = this.devices.find(d => d.type === 'switch');
            const r1 = this.devices.find(d => d.type === 'router');
            checks.push(
                { label: 'ตั้งค่า 802.1Q Trunk บนพอร์ต Fa0/1 ของ Switch', passed: !!(sw && sw.ports['Fa0/1']?.mode === 'trunk') },
                { label: 'สร้าง Sub-interface Gig0/0.10 และ Gig0/0.20 บน Router', passed: !!(r1 && r1.ports['Gig0/0.10']?.ip && r1.ports['Gig0/0.20']?.ip) },
                { label: 'Ping ข้าม VLAN ระหว่าง HR-PC (VLAN10) ⟷ DB-SRV (VLAN20) สำเร็จ', passed: checkConnectivity('HR-PC (VLAN10)', 'DB-SRV (VLAN20)', 'icmp') }
            );
        } else if (this.activePresetId === 'ospf-core') {
            title = 'Lab 06: Enterprise OSPF Area 0 Dynamic Routing';
            const r1 = this.devices.find(d => d.name === 'R1-Edge');
            const r2 = this.devices.find(d => d.name === 'R2-Core');
            const hasNeig = r1 && NetworkEngine.getOspfNeighbors(r1, this.devices, this.cables).length > 0;
            checks.push(
                { label: 'เปิดใช้งาน OSPF Process 1 บน R1-Edge และ R2-Core', passed: !!(r1?.ospf?.networks?.length > 0 && r2?.ospf?.networks?.length > 0) },
                { label: 'OSPF Neighbor Adjacency สถานะ FULL/DR', passed: !!hasNeig },
                { label: 'Ping ข้ามเราเตอร์ OSPF จาก Edge-PC ➔ Cloud-SRV สำเร็จ', passed: checkConnectivity('Edge-PC', 'Cloud-SRV', 'icmp') }
            );
        } else if (this.activePresetId === 'acl-nat') {
            title = 'Lab 07: ACL Firewall, NAT Overload & ISP Cloud';
            const r1 = this.devices.find(d => d.name === 'R1-Firewall');
            const pingBlocked = !checkConnectivity('Corp-PC', 'ISP-Cloud', 'icmp');
            const httpAllowed = checkConnectivity('Corp-PC', 'ISP-Cloud', 'tcp');
            checks.push(
                { label: 'เปิดใช้งาน NAT Overload บน R1-Firewall', passed: !!(r1 && r1.natEnabled) },
                { label: 'ตั้งกฎ ACL บล็อก ICMP Ping แต่เปิดให้เข้าเว็บ HTTP Port 80 ได้', passed: pingBlocked && httpAllowed },
                { label: 'เปิดเข้าเว็บ HTTP (Port 80) จาก Corp-PC ไปยัง ISP-Cloud สำเร็จ', passed: httpAllowed }
            );
        } else {
            // General connectivity check across all hosts with IP
            title = `Lab Assessment (${this.activePresetId.toUpperCase()})`;
            const hosts = this.devices.filter(d => (d.type === 'pc' || d.type === 'server' || d.type === 'cloud') && Object.values(d.ports).some(p => p.ip));
            checks.push({
                label: 'มีอุปกรณ์และสายเชื่อมต่อครบถ้วน (อย่างน้อย 2 โหนด)',
                passed: this.devices.length >= 2 && this.cables.length >= 1
            });
            if (hosts.length >= 2) {
                checks.push({
                    label: `เชื่อมต่อระหว่าง ${hosts[0].name} ⟷ ${hosts[hosts.length - 1].name} สำเร็จ`,
                    passed: checkConnectivity(hosts[0].name, hosts[hosts.length - 1].name, 'icmp')
                });
            }
        }

        const passedCount = checks.filter(c => c.passed).length;
        const percent = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 100;
        return { title, checks, passedCount, percent };
    },

    updateLiveGradeBadge() {
        const badge = document.getElementById('liveGradeScoreText');
        if (!badge) return;
        const report = this.evaluateLabGrade();
        badge.textContent = `Score: ${report.percent}%`;
    },

    updateMissionBanner() {
        const banner = document.getElementById('missionCard');
        if (!banner) return;

        if (this.activePresetId !== 'troubleshoot') {
            banner.classList.add('hidden');
            return;
        }

        banner.classList.remove('hidden');
        const r1 = this.devices.find(d => d.name === 'R1-Gateway');
        const pc1 = this.devices.find(d => d.name === 'PC1');
        const srv = this.devices.find(d => d.name === 'Payroll-SRV');

        const fix1 = r1 && r1.ports['Gig0/1'] && r1.ports['Gig0/1'].up === true;
        const fix2 = pc1 && pc1.gateway === '192.168.10.1';
        const fix3 = srv && srv.ports['Eth0'] && srv.ports['Eth0'].ip === '192.168.20.100';

        const itemHtml = (done, text) => `
            <div class="flex items-center gap-1.5 text-[11px] ${done ? 'text-emerald-400 line-through opacity-80' : 'text-amber-200'}">
                <span>${done ? '✅' : '⬜'}</span>
                <span>${text}</span>
            </div>
        `;

        const checklistEl = document.getElementById('missionChecklist');
        if (checklistEl) {
            checklistEl.innerHTML = `
                ${itemHtml(fix1, '1. เปิดพอร์ต Gig0/1 บน R1-Gateway (no shutdown)')}
                ${itemHtml(fix2, '2. แก้ Default Gateway ของ PC1 เป็น 192.168.10.1')}
                ${itemHtml(fix3, '3. แก้ IP ของ Payroll-SRV เป็น 192.168.20.100')}
            `;
        }
    },

    triggerVisualPing(srcDev, dstDev) {
        this.logEvent('PING', `กำลังส่ง ICMP Echo Request จาก ${srcDev.name} ➔ ${dstDev.name}...`, 'info');

        const sim = NetworkEngine.simulatePing(srcDev, dstDev, this.devices, this.cables);
        this.lastPduSimulation = sim;

        const btnInspect = document.getElementById('btnOpenPduInspector');
        if (btnInspect && sim.osiSteps && sim.osiSteps.length > 0) {
            btnInspect.classList.remove('hidden');
        }

        CanvasUI.animatePacket(sim.hops, sim.success, () => {
            if (sim.success) {
                this.logEvent('PING SUCCESS', `${sim.reason} <button onclick="ModalController.openPduInspectorModal(0)" class="ml-1 underline text-cyan-300 font-bold">[🔍 ดู OSI 7 Layers]</button>`, 'ok');
            } else {
                this.logEvent('PING FAILED', `${sim.reason} <button onclick="ModalController.openPduInspectorModal(0)" class="ml-1 underline text-cyan-300 font-bold">[🔍 ดูจุดติดขัด OSI]</button>`, 'fail');
            }
            this.updateLiveGradeBadge();
        }, 'icmp');
    },

    triggerVisualHttp(srcDev, dstDev) {
        this.logEvent('HTTP GET', `กำลังส่ง TCP Port 80 (HTTP GET) จาก ${srcDev.name} ➔ ${dstDev.name}...`, 'info');

        const sim = NetworkEngine.simulateHttp(srcDev, dstDev, this.devices, this.cables);
        this.lastPduSimulation = sim;

        const btnInspect = document.getElementById('btnOpenPduInspector');
        if (btnInspect && sim.osiSteps && sim.osiSteps.length > 0) {
            btnInspect.classList.remove('hidden');
        }

        CanvasUI.animatePacket(sim.hops, sim.success, () => {
            if (sim.success) {
                this.logEvent('HTTP 200 OK', `${sim.reason} <button onclick="ModalController.openPduInspectorModal(0)" class="ml-1 underline text-purple-300 font-bold">[🔍 ดู TCP/HTTP Layer]</button>`, 'ok');
            } else {
                this.logEvent('HTTP BLOCKED', `${sim.reason} <button onclick="ModalController.openPduInspectorModal(0)" class="ml-1 underline text-rose-300 font-bold">[🔍 ดูจุดติดขัด OSI]</button>`, 'fail');
            }
            this.updateLiveGradeBadge();
        }, 'tcp');
    },

    loadPresetTopology(type = 'subnets', shouldSave = true) {
        this.devices = [];
        this.cables = [];
        this.selectedDeviceId = null;
        this.activePresetId = type;
        this.counters = { router: 0, switch: 0, pc: 1, server: 1, cloud: 1 };
        CanvasUI.resetView();

        const rect = document.getElementById('canvasContainer').getBoundingClientRect();
        const cx = Math.max(340, rect.width / 2);
        const cy = Math.max(220, rect.height / 2);

        if (type === 'lan') {
            const sw1 = this.createDeviceObject('switch', cx, cy - 30, 'SW1-Access');
            const pc1 = this.createDeviceObject('pc', cx - 200, cy + 110, 'PC1');
            pc1.ports['Eth0'] = { ip: '192.168.1.10', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };

            const pc2 = this.createDeviceObject('pc', cx, cy + 130, 'PC2');
            pc2.ports['Eth0'] = { ip: '192.168.1.11', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };

            const srv1 = this.createDeviceObject('server', cx + 200, cy + 110, 'File-SRV');
            srv1.ports['Eth0'] = { ip: '192.168.1.100', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') };

            this.devices.push(sw1, pc1, pc2, srv1);
            this.cables.push(
                { id: 'c1', from: sw1.id, fromPort: 'Fa0/1', to: pc1.id, toPort: 'Eth0' },
                { id: 'c2', from: sw1.id, fromPort: 'Fa0/2', to: pc2.id, toPort: 'Eth0' },
                { id: 'c3', from: sw1.id, fromPort: 'Fa0/3', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = sw1.id;
            this.logEvent('LAB 01', 'โหลดแล็บ Basic Switch LAN (192.168.1.0/24) เรียบร้อย', 'ok');
        } else if (type === 'subnets') {
            const r1 = this.createDeviceObject('router', cx, cy - 95, 'R1-Core');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/1'] = { ip: '192.168.20.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };

            const sw1 = this.createDeviceObject('switch', cx - 180, cy + 15, 'SW1');
            const sw2 = this.createDeviceObject('switch', cx + 180, cy + 15, 'SW2');

            const pc1 = this.createDeviceObject('pc', cx - 250, cy + 140, 'PC1');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.10.1';

            const srv1 = this.createDeviceObject('server', cx + 250, cy + 140, 'Web-SRV');
            srv1.ports['Eth0'] = { ip: '192.168.20.100', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') };
            srv1.gateway = '192.168.20.1';

            this.devices.push(r1, sw1, sw2, pc1, srv1);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c2', from: r1.id, fromPort: 'Gig0/1', to: sw2.id, toPort: 'Fa0/1' },
                { id: 'c3', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c4', from: sw2.id, fromPort: 'Fa0/2', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 02', 'โหลดแล็บ Inter-Subnet Routing (192.168.10.0/24 ⟷ 192.168.20.0/24)', 'ok');
        } else if (type === 'static-route') {
            const r1 = this.createDeviceObject('router', cx - 135, cy - 85, 'R1-HQ');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/1'] = { ip: '10.0.0.1', mask: '255.255.255.252', up: true, mac: NetworkEngine.generateMac('router') };
            r1.routes = [{ network: '192.168.30.0', mask: '255.255.255.0', nextHop: '10.0.0.2' }];

            const r2 = this.createDeviceObject('router', cx + 135, cy - 85, 'R2-Branch');
            r2.ports['Gig0/0'] = { ip: '192.168.30.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r2.ports['Gig0/1'] = { ip: '10.0.0.2', mask: '255.255.255.252', up: true, mac: NetworkEngine.generateMac('router') };
            r2.routes = [{ network: '192.168.10.0', mask: '255.255.255.0', nextHop: '10.0.0.1' }];

            const sw1 = this.createDeviceObject('switch', cx - 220, cy + 35, 'SW-HQ');
            const sw2 = this.createDeviceObject('switch', cx + 220, cy + 35, 'SW-Branch');

            const pc1 = this.createDeviceObject('pc', cx - 240, cy + 155, 'HQ-PC');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.10.1';

            const srv1 = this.createDeviceObject('server', cx + 240, cy + 155, 'Branch-SRV');
            srv1.ports['Eth0'] = { ip: '192.168.30.100', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') };
            srv1.gateway = '192.168.30.1';

            this.devices.push(r1, r2, sw1, sw2, pc1, srv1);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/1', to: r2.id, toPort: 'Gig0/1' },
                { id: 'c2', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c3', from: r2.id, fromPort: 'Gig0/0', to: sw2.id, toPort: 'Fa0/1' },
                { id: 'c4', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c5', from: sw2.id, fromPort: 'Fa0/2', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 03', 'โหลดแล็บ Multi-Router Static Routing (R1-HQ ⟷ R2-Branch ผ่าน WAN 10.0.0.0/30)', 'ok');
        } else if (type === 'troubleshoot') {
            const r1 = this.createDeviceObject('router', cx, cy - 85, 'R1-Gateway');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/1'] = { ip: '192.168.20.1', mask: '255.255.255.0', up: false, mac: NetworkEngine.generateMac('router') };

            const sw1 = this.createDeviceObject('switch', cx - 180, cy + 25, 'SW1');
            const sw2 = this.createDeviceObject('switch', cx + 180, cy + 25, 'SW2');

            const pc1 = this.createDeviceObject('pc', cx - 250, cy + 145, 'PC1');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.99.1';

            const srv1 = this.createDeviceObject('server', cx + 250, cy + 145, 'Payroll-SRV');
            srv1.ports['Eth0'] = { ip: '192.168.50.100', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') };
            srv1.gateway = '192.168.20.1';

            this.devices.push(r1, sw1, sw2, pc1, srv1);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c2', from: r1.id, fromPort: 'Gig0/1', to: sw2.id, toPort: 'Fa0/1' },
                { id: 'c3', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c4', from: sw2.id, fromPort: 'Fa0/2', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 04', '⚠️ โจทย์ซ่อมเครือข่าย: แก้ปัญหา 3 จุดเพื่อให้ได้คะแนน Grader 100%!', 'warn');
        } else if (type === 'roas-vlan') {
            const r1 = this.createDeviceObject('router', cx, cy - 105, 'R1-ROAS');
            r1.ports['Gig0/0'] = { ip: '', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/0.10'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, vlan: 10, isSubIf: true, parentPort: 'Gig0/0', mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/0.20'] = { ip: '192.168.20.1', mask: '255.255.255.0', up: true, vlan: 20, isSubIf: true, parentPort: 'Gig0/0', mac: NetworkEngine.generateMac('router') };

            const sw1 = this.createDeviceObject('switch', cx, cy + 10, 'SW1-Trunk');
            sw1.ports['Fa0/1'] = { ip: '', mask: '', up: true, vlan: 1, mode: 'trunk', mac: NetworkEngine.generateMac('switch') };
            sw1.ports['Fa0/2'] = { ip: '', mask: '', up: true, vlan: 10, mode: 'access', mac: NetworkEngine.generateMac('switch') };
            sw1.ports['Fa0/3'] = { ip: '', mask: '', up: true, vlan: 20, mode: 'access', mac: NetworkEngine.generateMac('switch') };

            const pc1 = this.createDeviceObject('pc', cx - 220, cy + 135, 'HR-PC (VLAN10)');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.10.1';

            const srv1 = this.createDeviceObject('server', cx + 220, cy + 135, 'DB-SRV (VLAN20)');
            srv1.ports['Eth0'] = { ip: '192.168.20.100', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') };
            srv1.gateway = '192.168.20.1';

            this.devices.push(r1, sw1, pc1, srv1);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c2', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c3', from: sw1.id, fromPort: 'Fa0/3', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 05', 'โหลดแล็บ Router-on-a-Stick (802.1Q Trunk + Sub-interfaces Gig0/0.10 & .20) สำเร็จ!', 'ok');
        } else if (type === 'ospf-core') {
            const r1 = this.createDeviceObject('router', cx - 140, cy - 85, 'R1-Edge');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/1'] = { ip: '10.0.0.1', mask: '255.255.255.252', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ospf = {
                processId: 1,
                networks: [
                    { network: '192.168.10.0', wildcard: '0.0.0.255', area: 0 },
                    { network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 }
                ]
            };

            const r2 = this.createDeviceObject('router', cx + 140, cy - 85, 'R2-Core');
            r2.ports['Gig0/0'] = { ip: '172.16.1.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r2.ports['Gig0/1'] = { ip: '10.0.0.2', mask: '255.255.255.252', up: true, mac: NetworkEngine.generateMac('router') };
            r2.ospf = {
                processId: 1,
                networks: [
                    { network: '172.16.1.0', wildcard: '0.0.0.255', area: 0 },
                    { network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 }
                ]
            };

            const sw1 = this.createDeviceObject('switch', cx - 220, cy + 35, 'SW1');
            const sw2 = this.createDeviceObject('switch', cx + 220, cy + 35, 'SW2');

            const pc1 = this.createDeviceObject('pc', cx - 240, cy + 155, 'Edge-PC');
            pc1.ports['Eth0'] = { ip: '192.168.10.50', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.10.1';

            const srv1 = this.createDeviceObject('server', cx + 240, cy + 155, 'Cloud-SRV');
            srv1.ports['Eth0'] = { ip: '172.16.1.100', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') };
            srv1.gateway = '172.16.1.1';

            this.devices.push(r1, r2, sw1, sw2, pc1, srv1);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/1', to: r2.id, toPort: 'Gig0/1' },
                { id: 'c2', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c3', from: r2.id, fromPort: 'Gig0/0', to: sw2.id, toPort: 'Fa0/1' },
                { id: 'c4', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c5', from: sw2.id, fromPort: 'Fa0/2', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 06', 'โหลดแล็บ OSPF Area 0 Dynamic Routing สำเร็จ!', 'ok');
        } else if (type === 'acl-nat') {
            // Lab 7: ACL Firewall (Deny Ping, Permit HTTP) + NAT Overload + ISP Cloud
            const r1 = this.createDeviceObject('router', cx, cy - 55, 'R1-Firewall');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, nat: 'inside', mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/1'] = { ip: '203.0.113.1', mask: '255.255.255.0', up: true, nat: 'outside', mac: NetworkEngine.generateMac('router') };
            r1.natEnabled = true;
            r1.acls = [
                { id: 100, action: 'deny', protocol: 'icmp', src: 'any', srcWildcard: '0.0.0.0', dst: '203.0.113.8', dstWildcard: '0.0.0.0', hits: 0 },
                { id: 100, action: 'permit', protocol: 'tcp', src: 'any', srcWildcard: '0.0.0.0', dst: 'any', dstWildcard: '0.0.0.0', hits: 0 }
            ];

            const sw1 = this.createDeviceObject('switch', cx - 190, cy + 45, 'SW-LAN');
            const pc1 = this.createDeviceObject('pc', cx - 230, cy + 150, 'Corp-PC');
            pc1.ports['Eth0'] = { ip: '192.168.10.25', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.10.1';

            const cloud = this.createDeviceObject('cloud', cx + 220, cy - 55, 'ISP-Cloud');
            cloud.ports['WAN0'] = { ip: '203.0.113.8', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('cloud') };
            cloud.gateway = '203.0.113.1';

            this.devices.push(r1, sw1, pc1, cloud);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c2', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c3', from: r1.id, fromPort: 'Gig0/1', to: cloud.id, toPort: 'WAN0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 07', '🛡️ โหลดแล็บ ACL Firewall & NAT: ลองกด "ส่ง Ping" (จะถูก ACL บล็อก) เทียบกับกด "เปิดเว็บ HTTP" (จะผ่านและแปลง NAT IP!)', 'warn');
        } else if (type === 'blank') {
            this.logEvent('SYSTEM', 'ล้างกระดานสร้างแล็บใหม่เรียบร้อย', 'info');
        }

        if (shouldSave) {
            this.saveToLocalStorage();
        }
        this.renderAll();
    },

    saveToLocalStorage() {
        try {
            const payload = {
                version: '4.0',
                activePresetId: this.activePresetId,
                devices: this.devices,
                cables: this.cables,
                counters: this.counters
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {
            console.warn('Auto-save skipped:', e);
        }
    },

    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data.devices || !Array.isArray(data.devices) || data.devices.length === 0) return false;
            this.devices = data.devices;
            this.cables = data.cables || [];
            this.activePresetId = data.activePresetId || 'subnets';
            this.counters = data.counters || { router: 0, switch: 0, pc: 1, server: 1, cloud: 1 };
            this.selectedDeviceId = this.devices[0]?.id || null;
            this.renderAll();
            return true;
        } catch (e) {
            return false;
        }
    },

    exportLabJson() {
        const payload = {
            version: '4.0',
            exportedAt: new Date().toISOString(),
            activePresetId: this.activePresetId,
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
            this.activePresetId = data.activePresetId || 'custom';
            this.counters = data.counters || { router: 0, switch: 0, pc: 1, server: 1, cloud: 1 };
            this.selectedDeviceId = null;
            this.saveToLocalStorage();
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
