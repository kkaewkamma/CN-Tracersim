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
        if (typeof CanvasUI !== 'undefined' && CanvasUI && typeof CanvasUI.renderAll === 'function') {
            CanvasUI.renderAll();
        }
        this.updateQuickSelectionUI();
        this.updateIpSummaryTable();
        this.updateMissionBanner();
        this.updateLiveGradeBadge();
    },

    updateQuickSelectionUI() {
        if (typeof document === 'undefined') return;
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
        if (typeof document === 'undefined') return;
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
     * Strictly uses NetworkEngine simulation results and provides diagnostic reasons.
     */
    evaluateLabGrade() {
        const checks = [];
        let title = this.customLabConfig?.title || 'Custom Network Topology';

        const runSim = (nameA, nameB, proto = 'icmp') => {
            const devA = this.devices.find(d => d.name === nameA);
            const devB = this.devices.find(d => d.name === nameB);
            if (!devA || !devB) {
                return { success: false, reason: `ไม่พบอุปกรณ์ ${!devA ? nameA : nameB} บนผังเครือข่าย` };
            }
            return proto === 'tcp'
                ? NetworkEngine.simulateHttp(devA, devB, this.devices, this.cables)
                : NetworkEngine.simulatePing(devA, devB, this.devices, this.cables);
        };

        // 1. Evaluate Custom Lab Editor Rules if defined
        if (this.customLabConfig?.rules && this.customLabConfig.rules.length > 0) {
            title = this.customLabConfig.title || 'Custom Lab Assessment';
            for (const rule of this.customLabConfig.rules) {
                if (rule.type === 'ping_pass') {
                    const sim = runSim(rule.src, rule.dst, 'icmp');
                    checks.push({
                        label: `Ping (ICMP) จาก ${rule.src} ➔ ${rule.dst} สำเร็จ`,
                        passed: !!sim.success,
                        reason: sim.reason,
                        isCustom: true
                    });
                } else if (rule.type === 'http_pass') {
                    const sim = runSim(rule.src, rule.dst, 'tcp');
                    checks.push({
                        label: `เปิดเว็บ HTTP (Port 80) จาก ${rule.src} ➔ ${rule.dst} สำเร็จ`,
                        passed: !!sim.success,
                        reason: sim.reason,
                        isCustom: true
                    });
                } else if (rule.type === 'ping_block') {
                    const sim = runSim(rule.src, rule.dst, 'icmp');
                    checks.push({
                        label: `Firewall ACL บล็อก Ping จาก ${rule.src} ➔ ${rule.dst}`,
                        passed: !sim.success && !!sim.aclBlocked,
                        reason: sim.aclBlocked ? sim.reason : 'Packet ยังไม่ถูกบล็อกด้วยกฎ ACL (ต้องติด ACL Deny หรือ Implicit Deny)',
                        isCustom: true
                    });
                } else if (rule.type === 'ospf_neighbor') {
                    const dev = this.devices.find(d => d.name === rule.src);
                    const neigs = dev ? NetworkEngine.getOspfNeighbors(dev, this.devices, this.cables) : [];
                    checks.push({
                        label: `อุปกรณ์ ${rule.src} สร้าง OSPF Neighbor สถานะ FULL สำเร็จ`,
                        passed: neigs.length > 0,
                        reason: neigs.length > 0 ? `พบ OSPF Neighbor ${neigs.map(n => n.hostname).join(', ')}` : 'ยังไม่พบ OSPF Neighbor (ตรวจสอบ network, wildcard, Area ID และสถานะพอร์ต)',
                        isCustom: true
                    });
                } else if (rule.type === 'nat_active') {
                    const dev = this.devices.find(d => d.name === rule.src);
                    const hasIn = dev && Object.values(dev.ports).some(p => p.nat === 'inside');
                    const hasOut = dev && Object.values(dev.ports).some(p => p.nat === 'outside');
                    const ok = !!(dev && dev.natEnabled && hasIn && hasOut);
                    checks.push({
                        label: `ตั้งค่า NAT (ip nat inside / outside + overload) บน ${rule.src}`,
                        passed: ok,
                        reason: ok ? 'ตั้งค่า NAT Inside/Outside และเปิดใช้งาน NAT ครบถ้วน' : 'ต้องกำหนด ip nat inside, ip nat outside และคำสั่ง ip nat inside source ...',
                        isCustom: true
                    });
                } else if (rule.type === 'trunk_active') {
                    const dev = this.devices.find(d => d.name === rule.src);
                    const hasTrunk = dev && Object.values(dev.ports).some(p => p.mode === 'trunk');
                    checks.push({
                        label: `ตั้งค่าพอร์ต 802.1Q Trunk บน ${rule.src}`,
                        passed: !!hasTrunk,
                        reason: hasTrunk ? 'พบพอร์ตโหมด 802.1Q Trunk แล้ว' : 'ยังไม่ได้ตั้งค่า switchport mode trunk บนพอร์ตเชื่อมต่อ',
                        isCustom: true
                    });
                }
            }
        } else if (this.activePresetId === 'lan' || this.activePresetId === 'lab1') {
            title = 'Lab 01: Basic Switch Configuration & Device Hardening';
            const sw1 = this.devices.find(d => d.type === 'switch');
            const pingSim = runSim('PC1', 'File-SRV', 'icmp');
            const hasHardeningOrSvi = !!(sw1 && (sw1.enableSecret || sw1.passwordEncryption || sw1.ports['Vlan1']?.ip || sw1.name !== 'Switch0'));
            checks.push(
                {
                    label: 'ตั้งค่าพื้นฐาน Switch (Hostname / Enable Secret / SVI Vlan1)',
                    passed: hasHardeningOrSvi,
                    reason: hasHardeningOrSvi ? `ตั้งค่าบน ${sw1.name} เรียบร้อยแล้ว` : 'ตั้งค่า hostname, enable secret หรือ interface vlan 1 บน Switch'
                },
                {
                    label: 'พอร์ตเชื่อมต่อบน Switch สถานะ UP พร้อมเรียนรู้ MAC Address',
                    passed: !!(sw1 && sw1.ports['Fa0/1']?.up && sw1.ports['Fa0/2']?.up),
                    reason: (sw1?.ports['Fa0/1']?.up && sw1?.ports['Fa0/2']?.up) ? 'พอร์ต Fa0/1 และ Fa0/2 สถานะ UP' : 'พอร์ตบน Switch ยังปิดอยู่'
                },
                {
                    label: 'ทดสอบส่ง Ping ในวงแลนเดียวกันจาก PC1 ➔ File-SRV สำเร็จ',
                    passed: !!pingSim.success,
                    reason: pingSim.reason
                }
            );
        } else if (this.activePresetId === 'subnets' || this.activePresetId === 'lab2') {
            title = 'Lab 02: Basic Router Configuration & Default Gateway';
            const r1 = this.devices.find(d => d.type === 'router');
            const pc1 = this.devices.find(d => d.name === 'PC1');
            const srv = this.devices.find(d => d.name === 'Web-SRV');
            const pingSim = runSim('PC1', 'Web-SRV', 'icmp');
            checks.push(
                {
                    label: 'ตั้งค่า IP และเปิดพอร์ต Gig0/0, Gig0/1 บน R1-Core (no shutdown)',
                    passed: !!(r1 && r1.ports['Gig0/0']?.ip && r1.ports['Gig0/0']?.up && r1.ports['Gig0/1']?.ip && r1.ports['Gig0/1']?.up),
                    reason: (r1?.ports['Gig0/0']?.up && r1?.ports['Gig0/1']?.up) ? 'Gig0/0 และ Gig0/1 มี IP และสถานะ UP' : 'ตรวจสอบ ip address และ no shutdown บน Gig0/0, Gig0/1'
                },
                {
                    label: 'ตั้งค่า Default Gateway บน PC1 (192.168.10.1) และ Web-SRV (192.168.20.1)',
                    passed: !!(pc1?.gateway === '192.168.10.1' && srv?.gateway === '192.168.20.1'),
                    reason: (pc1?.gateway === '192.168.10.1' && srv?.gateway === '192.168.20.1') ? 'Default Gateway ทั้งสองฝั่งถูกต้อง' : 'ตรวจสอบค่า Default Gateway ของ PC1 และ Web-SRV'
                },
                {
                    label: 'ส่ง Ping ข้ามวงแลนจาก PC1 ➔ Web-SRV สำเร็จ',
                    passed: !!pingSim.success,
                    reason: pingSim.reason
                }
            );
        } else if (this.activePresetId === 'lab3') {
            title = 'Lab 03: IPv4 Addressing & VLSM Subnetting (/26)';
            const r1 = this.devices.find(d => d.type === 'router');
            const pc1 = this.devices.find(d => d.name === 'Sales-PC');
            const srv = this.devices.find(d => d.name === 'IT-SRV');
            const pingSim = runSim('Sales-PC', 'IT-SRV', 'icmp');
            const maskOk = r1?.ports['Gig0/0']?.mask === '255.255.255.192' && r1?.ports['Gig0/1']?.mask === '255.255.255.192';
            checks.push(
                {
                    label: 'กำหนด Subnet Mask /26 (255.255.255.192) บน R1-VLSM ทั้งสองพอร์ต',
                    passed: !!maskOk,
                    reason: maskOk ? 'Gig0/0 (.1/26) และ Gig0/1 (.65/26) ใช้ Mask 255.255.255.192 ถูกต้อง' : 'ต้องใช้ Subnet Mask 255.255.255.192 (/26) ทั้งสองวง'
                },
                {
                    label: 'จัดสรร IP ใน Subnet แรก (.1–.62) ให้ Sales-PC และ Subnet ที่สอง (.65–.126) ให้ IT-SRV',
                    passed: !!(pc1 && srv && NetworkEngine.isSameSubnet(pc1.ports['Eth0']?.ip, '192.168.10.1', '255.255.255.192') && NetworkEngine.isSameSubnet(srv.ports['Eth0']?.ip, '192.168.10.65', '255.255.255.192')),
                    reason: 'Sales-PC อยู่ในวง 192.168.10.0/26 และ IT-SRV อยู่ในวง 192.168.10.64/26'
                },
                {
                    label: 'ส่ง Ping ข้าม VLSM Subnet ระหว่าง Sales-PC ⟷ IT-SRV สำเร็จ',
                    passed: !!pingSim.success,
                    reason: pingSim.reason
                }
            );
        } else if (this.activePresetId === 'static-route' || this.activePresetId === 'lab4') {
            title = 'Lab 04: IPv4 Static & Default Routing';
            const r1 = this.devices.find(d => d.name === 'R1-HQ');
            const r2 = this.devices.find(d => d.name === 'R2-Branch');
            const pingSim = runSim('HQ-PC', 'Branch-SRV', 'icmp');
            checks.push(
                {
                    label: 'กำหนด Static Route บน R1-HQ ไปยัง 192.168.30.0/24',
                    passed: !!(r1 && r1.routes?.length > 0),
                    reason: r1?.routes?.length > 0 ? 'พบ Static Route บน R1-HQ แล้ว' : 'ใช้คำสั่ง ip route 192.168.30.0 255.255.255.0 10.0.0.2 บน R1-HQ'
                },
                {
                    label: 'กำหนด Static Route ขากลับบน R2-Branch ไปยัง 192.168.10.0/24',
                    passed: !!(r2 && r2.routes?.length > 0),
                    reason: r2?.routes?.length > 0 ? 'พบ Static Route ขากลับบน R2-Branch แล้ว' : 'ใช้คำสั่ง ip route 192.168.10.0 255.255.255.0 10.0.0.1 บน R2-Branch'
                },
                {
                    label: 'ส่ง Ping ข้ามเราเตอร์จาก HQ-PC ➔ Branch-SRV สำเร็จทั้งขาไปและขากลับ',
                    passed: !!pingSim.success,
                    reason: pingSim.reason
                }
            );
        } else if (this.activePresetId === 'lab5') {
            title = 'Lab 05: VLANs, Access Ports & 802.1Q Trunking';
            const sw1 = this.devices.find(d => d.name === 'SW1');
            const sw2 = this.devices.find(d => d.name === 'SW2');
            const sameVlanSim = runSim('HR-PC1', 'HR-PC2', 'icmp');
            const crossVlanSim = runSim('HR-PC1', 'Sales-PC1', 'icmp');
            const trunksOk = sw1?.ports['Fa0/1']?.mode === 'trunk' && sw2?.ports['Fa0/1']?.mode === 'trunk';
            checks.push(
                {
                    label: 'ตั้งค่าพอร์ตเชื่อมต่อระหว่าง SW1 (Fa0/1) และ SW2 (Fa0/1) เป็น 802.1Q Trunk',
                    passed: !!trunksOk,
                    reason: trunksOk ? 'พอร์ต Fa0/1 ทั้งสองฝั่งเป็น 802.1Q Trunk' : 'ใช้คำสั่ง switchport mode trunk บนพอร์ต Fa0/1 ของ SW1 และ SW2'
                },
                {
                    label: 'ส่ง Ping ข้าม Switch ใน VLAN 10 เดียวกัน (HR-PC1 ➔ HR-PC2) สำเร็จ',
                    passed: !!sameVlanSim.success,
                    reason: sameVlanSim.reason
                },
                {
                    label: 'VLAN Isolation กั้นการสื่อสารระหว่าง VLAN 10 (HR-PC1) กับ VLAN 20 (Sales-PC1)',
                    passed: !crossVlanSim.success,
                    reason: !crossVlanSim.success ? 'VLAN Isolation ทำงานถูกต้อง (แยก Broadcast Domain ระหว่าง VLAN 10 และ 20)' : 'พอร์ตยังอยู่ VLAN เดียวกัน'
                }
            );
        } else if (this.activePresetId === 'roas-vlan' || this.activePresetId === 'lab6') {
            title = 'Lab 06: Inter-VLAN Routing (Router-on-a-Stick 802.1Q)';
            const sw = this.devices.find(d => d.type === 'switch');
            const r1 = this.devices.find(d => d.type === 'router');
            const pingSim = runSim('HR-PC (VLAN10)', 'DB-SRV (VLAN20)', 'icmp');
            checks.push(
                {
                    label: 'ตั้งค่า 802.1Q Trunk บนพอร์ต Fa0/1 ของ Switch',
                    passed: !!(sw && sw.ports['Fa0/1']?.mode === 'trunk'),
                    reason: sw?.ports['Fa0/1']?.mode === 'trunk' ? 'Fa0/1 เป็น 802.1Q Trunk แล้ว' : 'พอร์ต Fa0/1 ยังไม่ได้ตั้งเป็น switchport mode trunk'
                },
                {
                    label: 'สร้าง Sub-interface Gig0/0.10 และ Gig0/0.20 บน Router',
                    passed: !!(r1 && r1.ports['Gig0/0.10']?.ip && r1.ports['Gig0/0.20']?.ip),
                    reason: (r1?.ports['Gig0/0.10']?.ip && r1?.ports['Gig0/0.20']?.ip) ? 'Sub-interfaces .10 และ .20 พร้อมใช้งาน' : 'ต้องสร้าง Sub-interface Gig0/0.10 และ Gig0/0.20 พร้อมกำหนด encapsulation dot1Q และ IP'
                },
                {
                    label: 'Ping ข้าม VLAN ระหว่าง HR-PC (VLAN10) ⟷ DB-SRV (VLAN20) สำเร็จ',
                    passed: !!pingSim.success,
                    reason: pingSim.reason
                }
            );
        } else if (this.activePresetId === 'lab7') {
            title = 'Lab 07: DHCPv4 Server, Excluded IP & DORA Process';
            const r1 = this.devices.find(d => d.name === 'R1-DHCP');
            const pc1 = this.devices.find(d => d.name === 'Client-PC1');
            const pc2 = this.devices.find(d => d.name === 'Client-PC2');
            const pingSim = runSim('Client-PC1', 'R1-DHCP', 'icmp');
            const hasPool = !!(r1 && r1.dhcpPools?.length > 0 && r1.dhcpExcluded?.length > 0);
            const hasLeases = !!(pc1?.ports['Eth0']?.ip && pc2?.ports['Eth0']?.ip && pc1.ports['Eth0'].ip !== pc2.ports['Eth0'].ip);
            checks.push(
                {
                    label: 'ตั้งค่า ip dhcp excluded-address และ ip dhcp pool บน R1-DHCP',
                    passed: hasPool,
                    reason: hasPool ? `ตั้งค่า DHCP Pool "${r1.dhcpPools[0].name}" และ Excluded IP เรียบร้อย` : 'ต้องกำหนด ip dhcp excluded-address และ ip dhcp pool บน R1-DHCP'
                },
                {
                    label: 'Client-PC1 และ Client-PC2 ขอรับ IP ผ่านกระบวนการ DORA สำเร็จ (IP ไม่ซ้ำกัน)',
                    passed: hasLeases,
                    reason: hasLeases ? `PC1=${pc1.ports['Eth0'].ip}, PC2=${pc2.ports['Eth0'].ip}` : 'รันคำสั่ง ip address dhcp บนพอร์ตของ Client-PC1 และ Client-PC2'
                },
                {
                    label: 'ส่ง Ping จาก Client-PC1 ไปยัง Default Gateway (R1-DHCP) สำเร็จ',
                    passed: !!pingSim.success,
                    reason: pingSim.reason
                }
            );
        } else if (this.activePresetId === 'ospf-core' || this.activePresetId === 'lab8') {
            title = 'Lab 08: Single-Area OSPFv2 Dynamic Routing';
            const r1 = this.devices.find(d => d.name === 'R1-Edge');
            const r2 = this.devices.find(d => d.name === 'R2-Core');
            const neigs = r1 ? NetworkEngine.getOspfNeighbors(r1, this.devices, this.cables) : [];
            const pingSim = runSim('Edge-PC', 'Cloud-SRV', 'icmp');
            checks.push(
                {
                    label: 'เปิดใช้งาน OSPF Process 1 บน R1-Edge และ R2-Core',
                    passed: !!(r1?.ospf?.networks?.length > 0 && r2?.ospf?.networks?.length > 0),
                    reason: (r1?.ospf?.networks?.length > 0 && r2?.ospf?.networks?.length > 0) ? 'ประกาศ OSPF Network ครบทั้ง 2 เราเตอร์' : 'ยังไม่ได้ประกาศ network ใน router ospf 1'
                },
                {
                    label: 'OSPF Neighbor Adjacency สถานะ FULL (Area ตรงกัน)',
                    passed: neigs.length > 0,
                    reason: neigs.length > 0 ? `OSPF Neighbor ${neigs[0].neighborId} สถานะ ${neigs[0].state}` : 'ไม่พบ OSPF Neighbor (ตรวจสอบว่า Area ID ตรงกันและพอร์ต UP)'
                },
                {
                    label: 'Ping ข้ามเราเตอร์ OSPF จาก Edge-PC ➔ Cloud-SRV สำเร็จ',
                    passed: !!pingSim.success,
                    reason: pingSim.reason
                }
            );
        } else if (this.activePresetId === 'lab9') {
            title = 'Lab 09: Standard & Extended IPv4 ACL Firewall (Implicit Deny)';
            const r1 = this.devices.find(d => d.name === 'R1-FW');
            const pingSim = runSim('Staff-PC', 'Web-SRV', 'icmp');
            const httpSim = runSim('Staff-PC', 'Web-SRV', 'tcp');
            const hasBoundAcl = !!(r1 && r1.acls?.length > 0 && Object.values(r1.ports).some(p => p.aclIn || p.aclOut || p.aclGroup));
            checks.push(
                {
                    label: 'สร้าง Extended ACL 100 และผูกกับ Interface (ip access-group) บน R1-FW',
                    passed: hasBoundAcl,
                    reason: hasBoundAcl ? 'สร้างและผูก ACL กับ Interface เรียบร้อย' : 'สร้าง access-list 100 และผูกด้วยคำสั่ง ip access-group 100 in บนพอร์ต Gig0/0'
                },
                {
                    label: 'กฎ ACL บล็อก ICMP Ping จาก Staff-PC ➔ Web-SRV',
                    passed: !pingSim.success && !!pingSim.aclBlocked,
                    reason: pingSim.aclBlocked ? pingSim.reason : 'Ping ต้องถูกบล็อกด้วยกฎ ACL บน R1-FW'
                },
                {
                    label: 'กฎ ACL อนุญาตให้เปิดเว็บ HTTP (TCP Port 80) จาก Staff-PC ➔ Web-SRV สำเร็จ',
                    passed: !!httpSim.success,
                    reason: httpSim.reason
                }
            );
        } else if (this.activePresetId === 'acl-nat' || this.activePresetId === 'lab10') {
            title = 'Lab 10: NAT/PAT Overload, Firewall ACL & ISP Cloud';
            const r1 = this.devices.find(d => d.name === 'R1-Firewall');
            const pingSim = runSim('Corp-PC', 'ISP-Cloud', 'icmp');
            const httpSim = runSim('Corp-PC', 'ISP-Cloud', 'tcp');
            const pingBlockedByAcl = !pingSim.success && !!pingSim.aclBlocked;
            const httpAllowedAndNatted = !!httpSim.success && !!httpSim.natTranslated;
            checks.push(
                {
                    label: 'เปิดใช้งาน NAT Overload (Inside/Outside) บน R1-Firewall',
                    passed: !!(r1 && r1.natEnabled && httpAllowedAndNatted),
                    reason: httpAllowedAndNatted ? 'แปลง Private IP เป็น Public IP (PAT Overload) สำเร็จ' : 'ต้องเปิดใช้งาน NAT บน R1-Firewall และส่งทราฟฟิกออกทาง Outside'
                },
                {
                    label: 'ตั้งกฎ ACL บล็อก ICMP Ping แต่เปิดให้เข้าเว็บ HTTP Port 80 ได้',
                    passed: pingBlockedByAcl && !!httpSim.success,
                    reason: pingBlockedByAcl ? pingSim.reason : 'Ping ต้องถูกบล็อกด้วยกฎ ACL (ไม่ใช่เพราะสายหลุดหรือพอร์ตปิด) และ HTTP ต้องผ่านได้'
                },
                {
                    label: 'เปิดเข้าเว็บ HTTP (Port 80) จาก Corp-PC ไปยัง ISP-Cloud สำเร็จ',
                    passed: !!httpSim.success,
                    reason: httpSim.reason
                }
            );
        } else if (this.activePresetId === 'troubleshoot' || this.activePresetId === 'lab11') {
            title = 'Lab 11: Network Troubleshooting Challenge (ซ่อมระบบล่ม 3 จุด)';
            const r1 = this.devices.find(d => d.name === 'R1-Gateway');
            const pc1 = this.devices.find(d => d.name === 'PC1');
            const srv = this.devices.find(d => d.name === 'Payroll-SRV');
            const pingSim = runSim('PC1', 'Payroll-SRV', 'icmp');
            checks.push(
                {
                    label: 'เปิดพอร์ต Gig0/1 บน R1-Gateway (no shutdown)',
                    passed: !!(r1 && r1.ports['Gig0/1']?.up),
                    reason: r1?.ports['Gig0/1']?.up ? 'พอร์ต Gig0/1 สถานะ UP' : 'พอร์ต Gig0/1 ยังถูก Shutdown อยู่'
                },
                {
                    label: 'ตั้งค่า Default Gateway ของ PC1 เป็น 192.168.10.1',
                    passed: !!(pc1 && pc1.gateway === '192.168.10.1'),
                    reason: pc1?.gateway === '192.168.10.1' ? 'Default Gateway ถูกต้อง (192.168.10.1)' : `Gateway ปัจจุบันคือ ${pc1?.gateway || 'ไม่ได้ตั้งค่า'}`
                },
                {
                    label: 'แก้ IP ของ Payroll-SRV เป็น 192.168.20.100',
                    passed: !!(srv && srv.ports['Eth0']?.ip === '192.168.20.100'),
                    reason: srv?.ports['Eth0']?.ip === '192.168.20.100' ? 'IP อยู่ในวง 192.168.20.0/24 ถูกต้อง' : `IP ปัจจุบันคือ ${srv?.ports['Eth0']?.ip || 'ไม่มี'} (คนละวงกับ R1 Gig0/1)`
                },
                {
                    label: 'ส่ง Ping จาก PC1 ไปยัง Payroll-SRV สำเร็จ',
                    passed: !!pingSim.success,
                    reason: pingSim.reason
                }
            );
        } else if (this.activePresetId === 'lab12') {
            title = 'Lab 12: Integrated Enterprise Network (Capstone Lab)';
            const sw = this.devices.find(d => d.name === 'SW-Core');
            const r1 = this.devices.find(d => d.name === 'R1-HQ');
            const r2 = this.devices.find(d => d.name === 'R2-Edge');
            const neigs = r1 ? NetworkEngine.getOspfNeighbors(r1, this.devices, this.cables) : [];
            const httpSim = runSim('HQ-PC1', 'ISP-Server', 'tcp');
            const swOk = !!(sw && sw.ports['Fa0/1']?.mode === 'trunk' && sw.ports['Fa0/2']?.portSecurity?.enabled);
            checks.push(
                {
                    label: 'Switching & Security: ตั้งค่า 802.1Q Trunk (Fa0/1) และ Port Security (Fa0/2) บน SW-Core',
                    passed: swOk,
                    reason: swOk ? 'Trunk 802.1Q และ Port Security ทำงานสมบูรณ์' : 'ตรวจสอบ switchport mode trunk บน Fa0/1 และ switchport port-security บน Fa0/2'
                },
                {
                    label: 'Routing: R1-HQ (ROAS) และ R2-Edge สร้าง OSPF Area 0 Neighbor สำเร็จ',
                    passed: neigs.length > 0,
                    reason: neigs.length > 0 ? `OSPF Neighbor ${neigs[0].neighborId} (${neigs[0].state})` : 'ตรวจสอบการตั้งค่า OSPF Area 0 ระหว่าง R1-HQ และ R2-Edge'
                },
                {
                    label: 'WAN & NAT: ส่ง HTTP ข้าม VLAN ➔ OSPF ➔ PAT Overload ไปยัง ISP-Server สำเร็จ',
                    passed: !!httpSim.success && !!httpSim.natTranslated,
                    reason: httpSim.reason
                }
            );
        } else {
            // General connectivity check across all hosts with IP
            title = `Lab Assessment (${this.activePresetId.toUpperCase()})`;
            const hosts = this.devices.filter(d => (d.type === 'pc' || d.type === 'server' || d.type === 'cloud') && Object.values(d.ports).some(p => p.ip));
            checks.push({
                label: 'มีอุปกรณ์และสายเชื่อมต่อครบถ้วน (อย่างน้อย 2 โหนด)',
                passed: this.devices.length >= 2 && this.cables.length >= 1,
                reason: this.devices.length >= 2 && this.cables.length >= 1 ? `มีอุปกรณ์ ${this.devices.length} โหนด และสาย ${this.cables.length} เส้น` : 'กรุณาวางอุปกรณ์และเชื่อมสายสัญญาณ'
            });
            if (hosts.length >= 2) {
                const sim = runSim(hosts[0].name, hosts[hosts.length - 1].name, 'icmp');
                checks.push({
                    label: `เชื่อมต่อระหว่าง ${hosts[0].name} ⟷ ${hosts[hosts.length - 1].name} สำเร็จ`,
                    passed: !!sim.success,
                    reason: sim.reason
                });
            }
        }

        const passedCount = checks.filter(c => c.passed).length;
        const percent = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 100;
        return { title, checks, passedCount, percent, percentage: percent };
    },

    updateLiveGradeBadge() {
        const report = this.evaluateLabGrade();
        if (report.percent === 100 && window.AcademyTutor && typeof window.AcademyTutor.recordLabCompletion === 'function') {
            window.AcademyTutor.recordLabCompletion(this.activePresetId, 100);
        }
        const badge = typeof document !== 'undefined' ? document.getElementById('liveGradeScoreText') : null;
        if (!badge) return;
        badge.textContent = `Score: ${report.percent}%`;
    },

    updateMissionBanner() {
        const banner = typeof document !== 'undefined' ? document.getElementById('missionCard') : null;
        if (!banner) return;

        if (this.activePresetId !== 'troubleshoot' && this.activePresetId !== 'lab11') {
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
        if (window.CanvasUI && typeof window.CanvasUI.resetView === 'function') {
            window.CanvasUI.resetView();
        }

        const containerEl = typeof document !== 'undefined' ? document.getElementById('canvasContainer') : null;
        const rect = containerEl ? containerEl.getBoundingClientRect() : { width: 960, height: 600 };
        const cx = Math.max(340, rect.width / 2);
        const cy = Math.max(220, rect.height / 2);

        if (type === 'lan' || type === 'lab1') {
            // Lab 01: Basic Switch Configuration & Device Hardening
            const sw1 = this.createDeviceObject('switch', cx, cy - 30, 'SW1-Access');
            sw1.enableSecret = 'class';
            sw1.passwordEncryption = true;
            sw1.ports['Vlan1'] = { ip: '192.168.1.2', mask: '255.255.255.0', up: true, vlan: 1, isSvi: true, mac: NetworkEngine.generateMac('switch') };

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
            this.logEvent('LAB 01', 'โหลดแล็บ Basic Switch Configuration & Device Hardening (192.168.1.0/24) เรียบร้อย', 'ok');
        } else if (type === 'subnets' || type === 'lab2') {
            // Lab 02: Basic Router Configuration & Default Gateway
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
            this.logEvent('LAB 02', 'โหลดแล็บ Basic Router Configuration & Default Gateway (192.168.10.0/24 ⟷ .20.0/24)', 'ok');
        } else if (type === 'lab3') {
            // Lab 03: IPv4 Addressing & VLSM Subnetting (/26)
            const r1 = this.createDeviceObject('router', cx, cy - 95, 'R1-VLSM');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.192', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/1'] = { ip: '192.168.10.65', mask: '255.255.255.192', up: true, mac: NetworkEngine.generateMac('router') };

            const sw1 = this.createDeviceObject('switch', cx - 180, cy + 15, 'SW-Sales');
            const sw2 = this.createDeviceObject('switch', cx + 180, cy + 15, 'SW-IT');

            const pc1 = this.createDeviceObject('pc', cx - 250, cy + 140, 'Sales-PC');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.192', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.10.1';

            const srv1 = this.createDeviceObject('server', cx + 250, cy + 140, 'IT-SRV');
            srv1.ports['Eth0'] = { ip: '192.168.10.70', mask: '255.255.255.192', up: true, mac: NetworkEngine.generateMac('server') };
            srv1.gateway = '192.168.10.65';

            this.devices.push(r1, sw1, sw2, pc1, srv1);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c2', from: r1.id, fromPort: 'Gig0/1', to: sw2.id, toPort: 'Fa0/1' },
                { id: 'c3', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c4', from: sw2.id, fromPort: 'Fa0/2', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 03', 'โหลดแล็บ IPv4 Addressing & VLSM Subnetting (192.168.10.0/26 และ 192.168.10.64/26)', 'ok');
        } else if (type === 'static-route' || type === 'lab4') {
            // Lab 04: IPv4 Static & Default Routing
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
            this.logEvent('LAB 04', 'โหลดแล็บ IPv4 Static & Default Routing (R1-HQ ⟷ R2-Branch ผ่าน WAN 10.0.0.0/30)', 'ok');
        } else if (type === 'lab5') {
            // Lab 05: VLANs, Access Ports & 802.1Q Trunking
            const sw1 = this.createDeviceObject('switch', cx - 150, cy - 30, 'SW1');
            sw1.vlans = { 1: 'default', 10: 'HR', 20: 'Sales' };
            sw1.ports['Fa0/1'] = { ip: '', mask: '', up: true, vlan: 1, mode: 'trunk', mac: NetworkEngine.generateMac('switch') };
            sw1.ports['Fa0/2'] = { ip: '', mask: '', up: true, vlan: 10, mode: 'access', mac: NetworkEngine.generateMac('switch') };
            sw1.ports['Fa0/3'] = { ip: '', mask: '', up: true, vlan: 20, mode: 'access', mac: NetworkEngine.generateMac('switch') };

            const sw2 = this.createDeviceObject('switch', cx + 150, cy - 30, 'SW2');
            sw2.vlans = { 1: 'default', 10: 'HR', 20: 'Sales' };
            sw2.ports['Fa0/1'] = { ip: '', mask: '', up: true, vlan: 1, mode: 'trunk', mac: NetworkEngine.generateMac('switch') };
            sw2.ports['Fa0/2'] = { ip: '', mask: '', up: true, vlan: 10, mode: 'access', mac: NetworkEngine.generateMac('switch') };
            sw2.ports['Fa0/3'] = { ip: '', mask: '', up: true, vlan: 20, mode: 'access', mac: NetworkEngine.generateMac('switch') };

            const pc1 = this.createDeviceObject('pc', cx - 260, cy + 125, 'HR-PC1');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };

            const pc2 = this.createDeviceObject('pc', cx - 100, cy + 125, 'Sales-PC1');
            pc2.ports['Eth0'] = { ip: '192.168.10.20', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };

            const pc3 = this.createDeviceObject('pc', cx + 100, cy + 125, 'HR-PC2');
            pc3.ports['Eth0'] = { ip: '192.168.10.11', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };

            const pc4 = this.createDeviceObject('pc', cx + 260, cy + 125, 'Sales-PC2');
            pc4.ports['Eth0'] = { ip: '192.168.10.21', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };

            this.devices.push(sw1, sw2, pc1, pc2, pc3, pc4);
            this.cables.push(
                { id: 'c1', from: sw1.id, fromPort: 'Fa0/1', to: sw2.id, toPort: 'Fa0/1' },
                { id: 'c2', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c3', from: sw1.id, fromPort: 'Fa0/3', to: pc2.id, toPort: 'Eth0' },
                { id: 'c4', from: sw2.id, fromPort: 'Fa0/2', to: pc3.id, toPort: 'Eth0' },
                { id: 'c5', from: sw2.id, fromPort: 'Fa0/3', to: pc4.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = sw1.id;
            this.logEvent('LAB 05', 'โหลดแล็บ VLANs, Access Ports & 802.1Q Trunking (VLAN 10 HR & VLAN 20 Sales)', 'ok');
        } else if (type === 'roas-vlan' || type === 'lab6') {
            // Lab 06: Inter-VLAN Routing (Router-on-a-Stick)
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
            this.logEvent('LAB 06', 'โหลดแล็บ Router-on-a-Stick (802.1Q Trunk + Sub-interfaces Gig0/0.10 & .20) สำเร็จ!', 'ok');
        } else if (type === 'lab7') {
            // Lab 07: DHCPv4 Server, Excluded IP & DORA Process
            const r1 = this.createDeviceObject('router', cx, cy - 95, 'R1-DHCP');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r1.dhcpExcluded = [{ low: '192.168.10.1', high: '192.168.10.9' }];
            r1.dhcpPools = [{
                name: 'LAN_POOL',
                network: '192.168.10.0',
                mask: '255.255.255.0',
                defaultRouter: '192.168.10.1',
                dnsServer: '8.8.8.8'
            }];

            const sw1 = this.createDeviceObject('switch', cx, cy + 15, 'SW1');
            const pc1 = this.createDeviceObject('pc', cx - 200, cy + 140, 'Client-PC1');
            const pc2 = this.createDeviceObject('pc', cx + 200, cy + 140, 'Client-PC2');

            this.devices.push(r1, sw1, pc1, pc2);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c2', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c3', from: sw1.id, fromPort: 'Fa0/3', to: pc2.id, toPort: 'Eth0' }
            );
            NetworkEngine.requestDhcpLease(pc1, this.devices, this.cables);
            NetworkEngine.requestDhcpLease(pc2, this.devices, this.cables);
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 07', 'โหลดแล็บ DHCPv4 Server (Excluded .1-.9 + Pool LAN_POOL + DORA Lease) สำเร็จ!', 'ok');
        } else if (type === 'ospf-core' || type === 'lab8') {
            // Lab 08: Single-Area OSPFv2 Dynamic Routing
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
            this.logEvent('LAB 08', 'โหลดแล็บ Single-Area OSPFv2 Dynamic Routing (Area 0) สำเร็จ!', 'ok');
        } else if (type === 'lab9') {
            // Lab 09: Standard & Extended IPv4 ACL Firewall (Implicit Deny)
            const r1 = this.createDeviceObject('router', cx, cy - 85, 'R1-FW');
            r1.ports['Gig0/0'] = {
                ip: '192.168.10.1',
                mask: '255.255.255.0',
                up: true,
                aclIn: 100,
                aclGroup: { id: 100, direction: 'in' },
                mac: NetworkEngine.generateMac('router')
            };
            r1.ports['Gig0/1'] = { ip: '192.168.20.1', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r1.acls = [
                { id: 100, action: 'deny', protocol: 'icmp', src: 'any', srcWildcard: '255.255.255.255', dst: '192.168.20.100', dstWildcard: '0.0.0.0', hits: 0 },
                { id: 100, action: 'permit', protocol: 'tcp', src: 'any', srcWildcard: '255.255.255.255', dst: '192.168.20.100', dstWildcard: '0.0.0.0', dstPort: 80, hits: 0 }
            ];

            const sw1 = this.createDeviceObject('switch', cx - 180, cy + 25, 'SW1');
            const pc1 = this.createDeviceObject('pc', cx - 230, cy + 145, 'Staff-PC');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.10.1';

            const srv1 = this.createDeviceObject('server', cx + 220, cy + 45, 'Web-SRV');
            srv1.ports['Eth0'] = { ip: '192.168.20.100', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') };
            srv1.gateway = '192.168.20.1';

            this.devices.push(r1, sw1, pc1, srv1);
            this.cables.push(
                { id: 'c1', from: r1.id, fromPort: 'Gig0/0', to: sw1.id, toPort: 'Fa0/1' },
                { id: 'c2', from: sw1.id, fromPort: 'Fa0/2', to: pc1.id, toPort: 'Eth0' },
                { id: 'c3', from: r1.id, fromPort: 'Gig0/1', to: srv1.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 09', '🛡️ โหลดแล็บ Extended IPv4 ACL (ip access-group 100 in): บล็อก ICMP Ping แต่เปิด TCP Port 80 พร้อม Implicit Deny!', 'ok');
        } else if (type === 'acl-nat' || type === 'lab10') {
            // Lab 10: NAT/PAT Overload & Firewall ACL
            const r1 = this.createDeviceObject('router', cx, cy - 55, 'R1-Firewall');
            r1.ports['Gig0/0'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, nat: 'inside', mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/1'] = { ip: '203.0.113.1', mask: '255.255.255.0', up: true, nat: 'outside', mac: NetworkEngine.generateMac('router') };
            r1.natEnabled = true;
            r1.natRule = { aclId: 1, outInterface: 'Gig0/1', overload: true };
            r1.acls = [
                { id: 1, action: 'permit', protocol: 'ip', src: '192.168.10.0', srcWildcard: '0.0.0.255', dst: 'any', dstWildcard: '255.255.255.255', hits: 0 },
                { id: 100, action: 'deny', protocol: 'icmp', src: 'any', srcWildcard: '255.255.255.255', dst: '203.0.113.8', dstWildcard: '0.0.0.0', hits: 0 },
                { id: 100, action: 'permit', protocol: 'tcp', src: 'any', srcWildcard: '255.255.255.255', dst: 'any', dstWildcard: '255.255.255.255', hits: 0 }
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
            this.logEvent('LAB 10', '🌐 โหลดแล็บ NAT/PAT Overload & ACL Firewall: ลองกด "เปิดเว็บ HTTP" เพื่อดูการแปลง PAT Port ใน show ip nat translations!', 'warn');
        } else if (type === 'troubleshoot' || type === 'lab11') {
            // Lab 11: Network Troubleshooting Challenge (Multi-Layer)
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
            this.logEvent('LAB 11', '⚠️ โจทย์ซ่อมเครือข่าย (Network Troubleshooting): แก้ปัญหา 3 จุดเพื่อให้ได้คะแนน Grader 100%!', 'warn');
        } else if (type === 'lab12') {
            // Lab 12: Integrated Enterprise Network (Capstone: VLAN + Port Security + ROAS + OSPF + PAT Overload)
            const sw1 = this.createDeviceObject('switch', cx - 240, cy + 20, 'SW-Core');
            sw1.vlans = { 1: 'default', 10: 'Corp_VLAN10' };
            sw1.ports['Fa0/1'] = { ip: '', mask: '', up: true, vlan: 1, mode: 'trunk', mac: NetworkEngine.generateMac('switch') };
            sw1.ports['Fa0/2'] = {
                ip: '',
                mask: '',
                up: true,
                vlan: 10,
                mode: 'access',
                portfast: true,
                portSecurity: { enabled: true, maximum: 1, violation: 'shutdown', sticky: true, secureMacs: [], violationCount: 0 },
                mac: NetworkEngine.generateMac('switch')
            };

            const r1 = this.createDeviceObject('router', cx - 90, cy - 80, 'R1-HQ');
            r1.ports['Gig0/0'] = { ip: '', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/0.10'] = { ip: '192.168.10.1', mask: '255.255.255.0', up: true, vlan: 10, isSubIf: true, parentPort: 'Gig0/0', mac: NetworkEngine.generateMac('router') };
            r1.ports['Gig0/1'] = { ip: '10.0.0.1', mask: '255.255.255.252', up: true, mac: NetworkEngine.generateMac('router') };
            r1.ospf = {
                processId: 1,
                routerId: '1.1.1.1',
                networks: [
                    { network: '192.168.10.0', wildcard: '0.0.0.255', area: 0 },
                    { network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 }
                ]
            };

            const r2 = this.createDeviceObject('router', cx + 110, cy - 80, 'R2-Edge');
            r2.ports['Gig0/0'] = { ip: '10.0.0.2', mask: '255.255.255.252', up: true, nat: 'inside', mac: NetworkEngine.generateMac('router') };
            r2.ports['Gig0/1'] = { ip: '203.0.113.1', mask: '255.255.255.0', up: true, nat: 'outside', mac: NetworkEngine.generateMac('router') };
            r2.ospf = {
                processId: 1,
                routerId: '2.2.2.2',
                networks: [
                    { network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 },
                    { network: '203.0.113.0', wildcard: '0.0.0.255', area: 0 }
                ]
            };
            r2.natEnabled = true;
            r2.natRule = { aclId: 1, outInterface: 'Gig0/1', overload: true };
            r2.acls = [
                { id: 1, action: 'permit', protocol: 'ip', src: '192.168.10.0', srcWildcard: '0.0.0.255', dst: 'any', dstWildcard: '255.255.255.255', hits: 0 }
            ];

            const pc1 = this.createDeviceObject('pc', cx - 260, cy + 150, 'HQ-PC1');
            pc1.ports['Eth0'] = { ip: '192.168.10.10', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('pc') };
            pc1.gateway = '192.168.10.1';

            const isp = this.createDeviceObject('server', cx + 260, cy + 50, 'ISP-Server');
            isp.ports['Eth0'] = { ip: '203.0.113.8', mask: '255.255.255.0', up: true, mac: NetworkEngine.generateMac('server') };
            isp.gateway = '203.0.113.1';

            this.devices.push(sw1, r1, r2, pc1, isp);
            this.cables.push(
                { id: 'c1', from: pc1.id, fromPort: 'Eth0', to: sw1.id, toPort: 'Fa0/2' },
                { id: 'c2', from: sw1.id, fromPort: 'Fa0/1', to: r1.id, toPort: 'Gig0/0' },
                { id: 'c3', from: r1.id, fromPort: 'Gig0/1', to: r2.id, toPort: 'Gig0/0' },
                { id: 'c4', from: r2.id, fromPort: 'Gig0/1', to: isp.id, toPort: 'Eth0' }
            );
            this.selectedDeviceId = r1.id;
            this.logEvent('LAB 12', '🏆 โหลดแล็บ Capstone บูรณาการ (VLAN 10 + Port Security + ROAS + OSPF Area 0 + PAT Overload)!', 'ok');
        } else if (type === 'blank') {
            this.logEvent('SYSTEM', 'ล้างกระดานสร้างแล็บใหม่เรียบร้อย', 'info');
        }

        if (shouldSave) {
            this.customLabConfig = { title: '', rules: [] };
            this.saveToLocalStorage();
        }
        this.renderAll();
    },

    saveToLocalStorage() {
        try {
            if (typeof localStorage === 'undefined') return;
            const payload = {
                version: '5.1',
                activePresetId: this.activePresetId,
                customLabConfig: this.customLabConfig || { title: '', rules: [] },
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
            this.customLabConfig = data.customLabConfig || { title: '', rules: [] };
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
            version: '5.1',
            exportedAt: new Date().toISOString(),
            activePresetId: this.activePresetId,
            customLabConfig: this.customLabConfig || { title: '', rules: [] },
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
            this.customLabConfig = data.customLabConfig || { title: '', rules: [] };
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
        if (typeof document === 'undefined') return;
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
        if (typeof document === 'undefined') return;
        const box = document.getElementById('eventLogList');
        if (box) box.innerHTML = '';
    }
};

window.appState = appState;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.onload = () => appState.init();
}
