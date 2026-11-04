/**
 * NetSim Touch v4.0 Ultimate - Modal UI Controller
 * Manages:
 * - Port Selector
 * - Device GUI Config (IPv4, DHCP DORA, Switch Access/Trunk VLANs, Router 802.1Q Sub-if, Static Routes, OSPF, ACL Firewall, NAT)
 * - Cisco IOS Terminal (Tab Auto-complete & Command History)
 * - OSI 7-Layer PDU Inspector Modal
 * - Built-in HTTP Web Browser Modal (Layer 7 Test)
 * - Packet Tracer (.pka) Auto-Grader & Score Certificate Modal
 * - Lab Presets (7 Curated CCNA Labs) & JSON File Export/Import
 */

const ModalController = {
    activeDeviceId: null,
    cliInstance: null,
    portPendingSource: null,
    portPendingTarget: null,
    selectedSrcPort: null,
    selectedDstPort: null,
    selectedOsiHopIndex: 0,

    // ================= PORT SELECTOR MODAL =================
    openPortModal(srcDev, dstDev) {
        this.portPendingSource = srcDev;
        this.portPendingTarget = dstDev;

        document.getElementById('portSourceTitle').textContent = `ต้นทาง: ${srcDev.name} (${srcDev.type.toUpperCase()})`;
        document.getElementById('portTargetTitle').textContent = `ปลายทาง: ${dstDev.name} (${dstDev.type.toUpperCase()})`;

        const srcList = document.getElementById('portSourceList');
        const dstList = document.getElementById('portTargetList');
        srcList.innerHTML = '';
        dstList.innerHTML = '';

        const isPortOccupied = (devId, portName) => {
            return window.appState.cables.some(c => 
                (c.from === devId && c.fromPort === portName) ||
                (c.to === devId && c.toPort === portName)
            );
        };

        const srcPhysicalPorts = Object.keys(srcDev.ports).filter(p => !p.includes('.'));
        if (!this.selectedSrcPort || isPortOccupied(srcDev.id, this.selectedSrcPort) || !srcPhysicalPorts.includes(this.selectedSrcPort)) {
            this.selectedSrcPort = srcPhysicalPorts.find(p => !isPortOccupied(srcDev.id, p)) || null;
        }

        srcPhysicalPorts.forEach(port => {
            const occupied = isPortOccupied(srcDev.id, port);
            const btn = document.createElement('button');
            btn.className = `w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition flex items-center justify-between ${
                occupied 
                    ? 'bg-slate-900/50 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60' 
                    : (port === this.selectedSrcPort ? 'bg-cyan-500/25 border-2 border-cyan-400 text-cyan-200' : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700')
            }`;
            btn.innerHTML = `<span>${port}</span><span class="text-[10px]">${occupied ? 'ใช้งานแล้ว' : 'ว่าง'}</span>`;
            if (!occupied) {
                btn.onclick = () => {
                    this.selectedSrcPort = port;
                    this.openPortModal(srcDev, dstDev);
                };
            }
            srcList.appendChild(btn);
        });

        const dstPhysicalPorts = Object.keys(dstDev.ports).filter(p => !p.includes('.'));
        if (!this.selectedDstPort || isPortOccupied(dstDev.id, this.selectedDstPort) || !dstPhysicalPorts.includes(this.selectedDstPort)) {
            this.selectedDstPort = dstPhysicalPorts.find(p => !isPortOccupied(dstDev.id, p)) || null;
        }

        dstPhysicalPorts.forEach(port => {
            const occupied = isPortOccupied(dstDev.id, port);
            const btn = document.createElement('button');
            btn.className = `w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition flex items-center justify-between ${
                occupied 
                    ? 'bg-slate-900/50 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60' 
                    : (port === this.selectedDstPort ? 'bg-emerald-500/25 border-2 border-emerald-400 text-emerald-200' : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700')
            }`;
            btn.innerHTML = `<span>${port}</span><span class="text-[10px]">${occupied ? 'ใช้งานแล้ว' : 'ว่าง'}</span>`;
            if (!occupied) {
                btn.onclick = () => {
                    this.selectedDstPort = port;
                    this.openPortModal(srcDev, dstDev);
                };
            }
            dstList.appendChild(btn);
        });

        document.getElementById('portModal').classList.remove('hidden');
    },

    closePortModal() {
        this.selectedSrcPort = null;
        this.selectedDstPort = null;
        document.getElementById('portModal').classList.add('hidden');
    },

    confirmCableConnection() {
        if (!this.selectedSrcPort || !this.selectedDstPort) {
            alert('ไม่มีพอร์ตว่างสำหรับเชื่อมต่อ หรือยังไม่ได้เลือกพอร์ตทั้งสองฝั่ง');
            return;
        }
        window.appState.addCable(this.portPendingSource.id, this.selectedSrcPort, this.portPendingTarget.id, this.selectedDstPort);
        this.closePortModal();
        window.appState.setTool('select');
    },

    // ================= DEVICE CONFIG & CLI MODAL =================
    openConfigModal(deviceId, defaultTab = 'gui') {
        const dev = window.appState.devices.find(d => d.id === deviceId);
        if (!dev) return;

        this.activeDeviceId = deviceId;
        this.cliInstance = new CiscoCLI(dev, () => {
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
            this.renderGuiInterfaces(dev);
            this.renderStaticRoutesSection(dev);
            this.renderOspfSection(dev);
            this.renderAclAndNatSection(dev);
            this.updateCliUI();
        });

        const badge = document.getElementById('modalDeviceBadge');
        badge.textContent = dev.type[0].toUpperCase();
        document.getElementById('modalDeviceTitle').textContent = dev.name;
        document.getElementById('modalDeviceSub').textContent = 
            dev.type === 'router' ? 'Cisco 2911 ISR (L3 Static / OSPF / ACL / NAT / 802.1Q)' :
            dev.type === 'switch' ? 'Cisco Catalyst 2960 Switch (Access & 802.1Q Trunk)' :
            dev.type === 'cloud' ? 'ISP Public Cloud Node (WAN / DNS / Web)' :
            dev.type === 'pc' ? 'PC Workstation (DHCP Client & HTTP Browser)' : 'Enterprise Web Server (HTTP Port 80)';

        document.getElementById('guiHostname').value = dev.name;

        const gwBox = document.getElementById('guiGatewayBox');
        const dhcpBox = document.getElementById('guiDhcpActionBox');
        const subIfBtnBox = document.getElementById('guiAddSubIfBox');

        if (dev.type === 'router') {
            gwBox.classList.add('hidden');
            if (dhcpBox) dhcpBox.classList.add('hidden');
            if (subIfBtnBox) subIfBtnBox.classList.remove('hidden');
        } else if (dev.type === 'switch' || dev.type === 'cloud') {
            gwBox.classList.remove('hidden');
            document.getElementById('guiGateway').value = dev.gateway || '';
            if (dhcpBox) dhcpBox.classList.add('hidden');
            if (subIfBtnBox) subIfBtnBox.classList.add('hidden');
        } else {
            gwBox.classList.remove('hidden');
            document.getElementById('guiGateway').value = dev.gateway || '';
            if (dhcpBox) dhcpBox.classList.remove('hidden');
            if (subIfBtnBox) subIfBtnBox.classList.add('hidden');
        }

        this.renderGuiInterfaces(dev);
        this.renderStaticRoutesSection(dev);
        this.renderOspfSection(dev);
        this.renderAclAndNatSection(dev);
        this.updateCliUI();
        this.switchConfigTab(defaultTab);

        document.getElementById('configModal').classList.remove('hidden');
    },

    closeConfigModal() {
        document.getElementById('configModal').classList.add('hidden');
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    switchConfigTab(tab) {
        const isGui = tab === 'gui';
        document.getElementById('tabContentGui').classList.toggle('hidden', !isGui);
        document.getElementById('tabContentCli').classList.toggle('hidden', isGui);

        document.getElementById('tabBtnGui').className = isGui 
            ? 'px-4 py-1.5 rounded-lg text-xs font-bold transition bg-cyan-500 text-slate-950 shadow' 
            : 'px-4 py-1.5 rounded-lg text-xs font-semibold transition text-slate-400 hover:text-white';

        document.getElementById('tabBtnCli').className = !isGui 
            ? 'px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition bg-cyan-500 text-slate-950 shadow' 
            : 'px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition text-slate-400 hover:text-white';

        if (!isGui) {
            setTimeout(() => {
                const term = document.getElementById('cliTerminalOutput');
                term.scrollTop = term.scrollHeight;
                document.getElementById('cliInput').focus();
            }, 50);
        }
    },

    triggerGuiDhcpRequest() {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev) return;
        const res = NetworkEngine.requestDhcpLease(dev, window.appState.devices, window.appState.cables);
        if (res.success) {
            document.getElementById('guiGateway').value = dev.gateway || '';
            this.renderGuiInterfaces(dev);
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
            window.appState.logEvent('DHCP DORA', `${dev.name} ได้รับ IP ${res.ip} / GW ${res.gateway} จาก ${res.dhcpServer}`, 'ok');
            if (res.hops && res.hops.length > 1) {
                CanvasUI.animatePacket(res.hops, true);
            }
        } else {
            window.appState.logEvent('DHCP FAIL', res.reason, 'fail');
            alert(res.reason);
        }
    },

    addRouterSubInterfaceFromGui() {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || dev.type !== 'router') return;

        const basePort = document.getElementById('newSubIfBase').value || 'Gig0/0';
        const vlanId = parseInt(document.getElementById('newSubIfVlan').value, 10);
        const ip = document.getElementById('newSubIfIp').value.trim();

        if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
            alert('กรุณาระบุ VLAN ID ระหว่าง 1 ถึง 4094 (เช่น 10 หรือ 20)');
            return;
        }
        if (ip && !NetworkEngine.isValidIPv4(ip)) {
            alert('รูปแบบ IP Address ไม่ถูกต้อง');
            return;
        }

        const subName = `${basePort}.${vlanId}`;
        dev.ports[subName] = {
            ip: ip || `192.168.${vlanId}.1`,
            mask: '255.255.255.0',
            up: true,
            vlan: vlanId,
            isSubIf: true,
            parentPort: basePort,
            mac: NetworkEngine.generateMac('router')
        };
        if (dev.ports[basePort]) {
            dev.ports[basePort].up = true;
        }

        document.getElementById('newSubIfVlan').value = '';
        document.getElementById('newSubIfIp').value = '';
        this.renderGuiInterfaces(dev);
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
        window.appState.logEvent('DOT1Q SUB-IF', `สร้าง Sub-interface ${subName} (802.1Q VLAN ${vlanId}) บน ${dev.name}`, 'ok');
    },

    removeSubInterface(portName) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || !dev.ports[portName]) return;
        delete dev.ports[portName];
        this.renderGuiInterfaces(dev);
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    renderGuiInterfaces(dev) {
        const container = document.getElementById('guiInterfacesList');
        container.innerHTML = '';

        Object.entries(dev.ports).forEach(([pName, pObj]) => {
            if (!pObj.mac) pObj.mac = NetworkEngine.generateMac(dev.type);
            const card = document.createElement('div');
            card.className = 'p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3';
            
            const isSwitch = dev.type === 'switch';
            const isSubIf = pName.includes('.');
            const vlanVal = pObj.vlan || 1;
            const swMode = pObj.mode || 'access';
            const isUp = NetworkEngine.isInterfaceUp(dev, pName);

            card.innerHTML = `
                <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-500'}"></span>
                        <span class="font-mono text-xs font-bold text-white">${pName}</span>
                        ${isSubIf ? `<span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">802.1Q VLAN ${pObj.vlan}</span>` : ''}
                        <span class="text-[10px] font-mono text-slate-500 hidden sm:inline">MAC: ${pObj.mac}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        ${isSubIf ? `<button onclick="ModalController.removeSubInterface('${pName}')" class="text-[11px] text-rose-400 hover:text-rose-300 font-bold">ลบ Sub-if</button>` : ''}
                        <label class="flex items-center gap-2 cursor-pointer">
                            <span class="text-[11px] font-semibold text-slate-400">Status:</span>
                            <input type="checkbox" ${pObj.up ? 'checked' : ''} onchange="ModalController.togglePortStatus('${pName}', this.checked)" class="w-4 h-4 rounded text-cyan-500 focus:ring-0">
                            <span class="text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}">${isUp ? 'Up' : 'Down'}</span>
                        </label>
                    </div>
                </div>
                ${isSwitch ? `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div class="flex items-center justify-between sm:justify-start gap-2">
                            <label class="text-[11px] font-semibold text-slate-400">Switchport Mode:</label>
                            <select onchange="ModalController.savePortSwitchMode('${pName}', this.value)" class="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs text-cyan-300 focus:outline-none">
                                <option value="access" ${swMode === 'access' ? 'selected' : ''}>Access (1 VLAN)</option>
                                <option value="trunk" ${swMode === 'trunk' ? 'selected' : ''}>802.1Q Trunk (All VLANs)</option>
                            </select>
                        </div>
                        ${swMode === 'access' ? `
                        <div class="flex items-center justify-between sm:justify-end gap-2">
                            <label class="text-[11px] font-semibold text-cyan-300">Access VLAN ID:</label>
                            <input type="number" min="1" max="4094" value="${vlanVal}" onchange="ModalController.savePortVlan('${pName}', this.value)" class="w-20 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-cyan-400">
                        </div>
                        ` : `
                        <div class="text-right text-[11px] font-mono text-amber-300">802.1Q Tagging Active (VLAN 1–4094)</div>
                        `}
                    </div>
                ` : `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 mb-1">IP Address ${pObj.dhcp ? '<span class="text-emerald-400">(DHCP)</span>' : ''}</label>
                            <input type="text" value="${pObj.ip || ''}" placeholder="เช่น 192.168.10.1" onchange="ModalController.savePortIp('${pName}', this.value)" class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-cyan-400">
                        </div>
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Subnet Mask</label>
                            <input type="text" value="${pObj.mask || '255.255.255.0'}" placeholder="255.255.255.0" onchange="ModalController.savePortMask('${pName}', this.value)" class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-cyan-400">
                        </div>
                    </div>
                `}
            `;
            container.appendChild(card);
        });
    },

    renderAclAndNatSection(dev) {
        const box = document.getElementById('guiAclNatBox');
        if (!box) return;
        if (dev.type !== 'router') {
            box.classList.add('hidden');
            return;
        }
        box.classList.remove('hidden');
        dev.acls = dev.acls || [];

        const natCheck = document.getElementById('guiNatToggle');
        if (natCheck) natCheck.checked = !!dev.natEnabled;

        const list = document.getElementById('guiAclList');
        list.innerHTML = '';
        if (dev.acls.length === 0) {
            list.innerHTML = `<div class="text-xs text-slate-500 font-mono py-1">ไม่มีกฎ Firewall ACL (อนุญาตทุกการเชื่อมต่อ)</div>`;
        } else {
            dev.acls.forEach((a, idx) => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs';
                const badgeColor = a.action === 'deny' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold';
                item.innerHTML = `
                    <div class="text-slate-200"><span class="text-slate-400">ACL ${a.id}:</span> <span class="${badgeColor}">${a.action.toUpperCase()}</span> ${a.protocol.toUpperCase()} ${a.src} ➔ ${a.dst} <span class="text-slate-500">(${a.hits || 0} hits)</span></div>
                    <button onclick="ModalController.removeAclRule(${idx})" class="text-rose-400 hover:text-rose-300 font-bold px-2">ลบ</button>
                `;
                list.appendChild(item);
            });
        }
    },

    toggleRouterNat(enabled) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || dev.type !== 'router') return;
        dev.natEnabled = enabled;
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    addAclRuleFromGui() {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || dev.type !== 'router') return;

        const action = document.getElementById('newAclAction').value;
        const protocol = document.getElementById('newAclProto').value;
        const src = document.getElementById('newAclSrc').value.trim() || 'any';
        const dst = document.getElementById('newAclDst').value.trim() || 'any';

        dev.acls = dev.acls || [];
        dev.acls.push({
            id: 100,
            action,
            protocol,
            src,
            srcWildcard: '0.0.0.0',
            dst,
            dstWildcard: '0.0.0.0',
            hits: 0
        });

        document.getElementById('newAclSrc').value = '';
        document.getElementById('newAclDst').value = '';
        this.renderAclAndNatSection(dev);
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    removeAclRule(idx) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || !dev.acls) return;
        dev.acls.splice(idx, 1);
        this.renderAclAndNatSection(dev);
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    renderStaticRoutesSection(dev) {
        const box = document.getElementById('guiStaticRoutesBox');
        if (!box) return;
        if (dev.type !== 'router') {
            box.classList.add('hidden');
            return;
        }
        box.classList.remove('hidden');
        dev.routes = dev.routes || [];

        const list = document.getElementById('guiStaticRoutesList');
        list.innerHTML = '';

        if (dev.routes.length === 0) {
            list.innerHTML = `<div class="text-xs text-slate-500 font-mono py-1">ยังไม่มี Static Route</div>`;
        } else {
            dev.routes.forEach((r, idx) => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs';
                item.innerHTML = `
                    <div class="text-slate-200"><span class="text-cyan-400 font-bold">ip route</span> ${r.network} ${r.mask} <span class="text-emerald-400">➔ ${r.nextHop}</span></div>
                    <button onclick="ModalController.removeStaticRoute(${idx})" class="text-rose-400 hover:text-rose-300 font-bold px-2">ลบ</button>
                `;
                list.appendChild(item);
            });
        }
    },

    renderOspfSection(dev) {
        const box = document.getElementById('guiOspfBox');
        if (!box) return;
        if (dev.type !== 'router') {
            box.classList.add('hidden');
            return;
        }
        box.classList.remove('hidden');
        dev.ospf = dev.ospf || { processId: 1, networks: [] };

        const list = document.getElementById('guiOspfNetworksList');
        list.innerHTML = '';

        if (!dev.ospf.networks || dev.ospf.networks.length === 0) {
            list.innerHTML = `<div class="text-xs text-slate-500 font-mono py-1">ยังไม่ได้เปิดใช้งาน OSPF Network</div>`;
        } else {
            dev.ospf.networks.forEach((n, idx) => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-xs';
                item.innerHTML = `
                    <div class="text-slate-200"><span class="text-amber-400 font-bold">OSPF ${dev.ospf.processId || 1}:</span> network ${n.network} ${n.wildcard} <span class="text-cyan-300">area ${n.area}</span></div>
                    <button onclick="ModalController.removeOspfNetwork(${idx})" class="text-rose-400 hover:text-rose-300 font-bold px-2">ลบ</button>
                `;
                list.appendChild(item);
            });
        }
    },

    addOspfNetworkFromGui() {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || dev.type !== 'router') return;

        const netEl = document.getElementById('newOspfNet');
        const wcEl = document.getElementById('newOspfWildcard');
        const areaEl = document.getElementById('newOspfArea');

        const net = netEl.value.trim();
        const wildcard = wcEl.value.trim() || '0.0.0.255';
        const area = parseInt(areaEl.value.trim() || '0', 10) || 0;

        if (!NetworkEngine.isValidIPv4(net) || !NetworkEngine.isValidIPv4(wildcard)) {
            alert('กรุณากรอก Network IP และ Wildcard Mask ให้ถูกต้อง');
            return;
        }

        const mask = NetworkEngine.wildcardToMask(wildcard);
        const normalizedNet = NetworkEngine.getNetworkAddress(net, mask);
        dev.ospf = dev.ospf || { processId: 1, networks: [] };
        dev.ospf.processId = dev.ospf.processId || 1;
        if (!dev.ospf.networks.some(n => n.network === normalizedNet && n.wildcard === wildcard)) {
            dev.ospf.networks.push({ network: normalizedNet, wildcard, area });
        }

        netEl.value = '';
        this.renderOspfSection(dev);
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    removeOspfNetwork(idx) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || !dev.ospf?.networks) return;
        dev.ospf.networks.splice(idx, 1);
        this.renderOspfSection(dev);
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    addStaticRouteFromGui() {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || dev.type !== 'router') return;

        const netEl = document.getElementById('newRouteNet');
        const maskEl = document.getElementById('newRouteMask');
        const nhEl = document.getElementById('newRouteNextHop');

        const net = netEl.value.trim();
        const mask = maskEl.value.trim() || '255.255.255.0';
        const nextHop = nhEl.value.trim();

        if (!NetworkEngine.isValidIPv4(net) || !NetworkEngine.isValidMask(mask) || !NetworkEngine.isValidIPv4(nextHop)) {
            alert('กรุณากรอก Network, Subnet Mask และ Next-Hop IP ให้ถูกต้อง');
            return;
        }

        const normalizedNet = NetworkEngine.getNetworkAddress(net, mask);
        dev.routes = dev.routes || [];
        const existingIdx = dev.routes.findIndex(r => r.network === normalizedNet && r.mask === mask);
        if (existingIdx >= 0) {
            dev.routes[existingIdx].nextHop = nextHop;
        } else {
            dev.routes.push({ network: normalizedNet, mask, nextHop });
        }

        netEl.value = '';
        nhEl.value = '';
        this.renderStaticRoutesSection(dev);
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    removeStaticRoute(idx) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (!dev || !dev.routes) return;
        dev.routes.splice(idx, 1);
        this.renderStaticRoutesSection(dev);
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    saveGuiHostname(val) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && val.trim()) {
            dev.name = val.trim();
            document.getElementById('modalDeviceTitle').textContent = dev.name;
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
            this.updateCliUI();
        }
    },

    saveGuiGateway(val) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev) {
            dev.gateway = val.trim();
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
        }
    },

    togglePortStatus(portName, isUp) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && dev.ports[portName]) {
            dev.ports[portName].up = isUp;
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
            this.renderGuiInterfaces(dev);
        }
    },

    savePortIp(portName, ip) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && dev.ports[portName]) {
            dev.ports[portName].ip = ip.trim();
            dev.ports[portName].dhcp = false;
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
        }
    },

    savePortMask(portName, mask) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && dev.ports[portName]) {
            dev.ports[portName].mask = mask.trim();
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
        }
    },

    savePortVlan(portName, vlanStr) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        const v = parseInt(vlanStr, 10);
        if (dev && dev.ports[portName] && !isNaN(v) && v >= 1 && v <= 4094) {
            dev.ports[portName].vlan = v;
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
        }
    },

    savePortSwitchMode(portName, mode) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && dev.ports[portName]) {
            dev.ports[portName].mode = mode;
            this.renderGuiInterfaces(dev);
            window.appState.saveToLocalStorage();
            window.appState.renderAll();
        }
    },

    // ================= CLI HANDLING =================
    updateCliUI() {
        if (!this.cliInstance) return;
        const prompt = this.cliInstance.getPrompt();
        document.getElementById('cliPromptLabel').textContent = prompt;

        const term = document.getElementById('cliTerminalOutput');
        term.textContent = this.cliInstance.device.cliHistory;
        term.scrollTop = term.scrollHeight;

        if (window.AcademyTutor && typeof window.AcademyTutor.updateInTerminalCoachBanner === 'function') {
            window.AcademyTutor.updateInTerminalCoachBanner();
        }

        const chipsContainer = document.getElementById('cliQuickChips');
        chipsContainer.innerHTML = '';
        const chips = this.cliInstance.getQuickChips();

        chips.forEach(chip => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 border border-slate-700 text-xs font-mono font-medium shrink-0 transition shadow-sm';
            btn.textContent = chip.label;
            btn.onclick = () => {
                if (chip.run) {
                    this.submitCliCommand(chip.cmd);
                } else {
                    const input = document.getElementById('cliInput');
                    input.value = chip.cmd;
                    input.focus();
                }
            };
            chipsContainer.appendChild(btn);
        });
    },

    handleCliKeyDown(e) {
        if (!this.cliInstance) return;
        const inputEl = document.getElementById('cliInput');

        if (e.key === 'Tab') {
            e.preventDefault();
            inputEl.value = this.cliInstance.autoComplete(inputEl.value);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            inputEl.value = this.cliInstance.getHistoryCommand(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            inputEl.value = this.cliInstance.getHistoryCommand(1);
        }
    },

    triggerCliTabComplete() {
        if (!this.cliInstance) return;
        const inputEl = document.getElementById('cliInput');
        inputEl.value = this.cliInstance.autoComplete(inputEl.value);
        inputEl.focus();
    },

    triggerCliHistoryUp() {
        if (!this.cliInstance) return;
        const inputEl = document.getElementById('cliInput');
        inputEl.value = this.cliInstance.getHistoryCommand(-1);
        inputEl.focus();
    },

    submitCliCommand(rawCmd = null) {
        if (!this.cliInstance) return;
        const inputEl = document.getElementById('cliInput');
        const cmd = rawCmd !== null ? rawCmd : inputEl.value;
        inputEl.value = '';

        const prompt = this.cliInstance.getPrompt();
        const output = this.cliInstance.execute(cmd);

        if (output === '__CLEARED__') {
            this.updateCliUI();
            return;
        }

        let fullBlock = `${prompt} ${cmd}\n`;
        if (output) {
            fullBlock += `${output}\n`;
        }

        this.cliInstance.device.cliHistory += fullBlock;
        this.updateCliUI();
        window.appState.saveToLocalStorage();
        window.appState.renderAll();
    },

    // ================= OSI 7-LAYER PDU INSPECTOR MODAL =================
    openPduInspectorModal(hopIndex = 0) {
        const sim = window.appState.lastPduSimulation;
        if (!sim || !sim.osiSteps || sim.osiSteps.length === 0) {
            alert('ยังไม่มีข้อมูลแพ็กเก็ต PDU ล่าสุด กรุณากดส่ง Ping หรือเปิดเว็บ HTTP ระหว่างอุปกรณ์ก่อนครับ');
            return;
        }
        this.selectedOsiHopIndex = Math.max(0, Math.min(sim.osiSteps.length - 1, hopIndex));
        this.renderPduInspectorContent();
        document.getElementById('pduInspectorModal').classList.remove('hidden');
    },

    closePduInspectorModal() {
        document.getElementById('pduInspectorModal').classList.add('hidden');
    },

    selectPduHop(idx) {
        this.selectedOsiHopIndex = idx;
        this.renderPduInspectorContent();
    },

    renderPduInspectorContent() {
        const sim = window.appState.lastPduSimulation;
        if (!sim || !sim.osiSteps) return;

        const steps = sim.osiSteps;
        const current = steps[this.selectedOsiHopIndex];

        const hopsBar = document.getElementById('pduHopStepper');
        hopsBar.innerHTML = '';
        steps.forEach((step, idx) => {
            const active = idx === this.selectedOsiHopIndex;
            const btn = document.createElement('button');
            btn.className = `px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                active
                    ? 'bg-cyan-500 text-slate-950 shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`;
            btn.innerHTML = `<span>Hop ${idx + 1}: ${step.deviceName}</span>`;
            btn.onclick = () => this.selectPduHop(idx);
            hopsBar.appendChild(btn);
        });

        const detailsBox = document.getElementById('pduOsiLayersGrid');
        const isL2Only = current.deviceType === 'switch';
        const isHttp = (current.icmpType || '').includes('HTTP');

        detailsBox.innerHTML = `
            <div class="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <div class="text-xs font-bold text-cyan-300">📍 อุปกรณ์ปัจจุบัน: ${current.deviceName} (${current.deviceType.toUpperCase()})</div>
                    <div class="text-[11px] text-slate-300 font-mono mt-0.5">${current.note}</div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${sim.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}">
                    ${sim.success ? 'PDU DELIVERED' : 'PDU DROPPED / BLOCKED'}
                </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                <div class="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div class="text-[10px] font-bold uppercase text-purple-400 mb-1">Layers 7–5 • Application / Session</div>
                    <div class="text-slate-300">Protocol: <span class="text-white">${isHttp ? 'HTTP/1.1 GET /index.html (Port 80)' : 'ICMP Echo Payload (32 bytes)'}</span></div>
                    <div class="text-[11px] text-slate-500 mt-0.5">${isHttp ? 'User-Agent: NetSim-Touch-Browser/4.0' : 'Data: 0x6162636465666768696a6b6c'}</div>
                </div>

                <div class="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <div class="text-[10px] font-bold uppercase text-amber-400 mb-1">Layer 4 • Transport / Control</div>
                    <div class="text-slate-300">Header: <span class="text-amber-300 font-bold">${current.icmpType}</span></div>
                    <div class="text-[11px] text-slate-400 mt-0.5">${isHttp ? 'Src Port: 54120 ➔ Dst Port: 80 (SYN/ACK)' : 'Checksum: 0x4d5a (Verified) • ID: 0x0001'}</div>
                </div>

                <div class="p-3.5 rounded-2xl ${isL2Only ? 'bg-slate-900/40 border border-slate-800/60 opacity-75' : 'bg-indigo-950/30 border border-indigo-500/40'}">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-bold uppercase text-indigo-400">Layer 3 • Network (IPv4 Packet Header)</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">TTL: ${current.ttl}</span>
                    </div>
                    <div class="space-y-1 text-slate-200">
                        <div>SRC IP: <span class="text-cyan-300 font-bold">${current.srcIp}</span></div>
                        <div>DST IP: <span class="text-emerald-300 font-bold">${current.dstIp}</span></div>
                        <div class="text-[11px] text-slate-400">Protocol: ${isHttp ? '6 (TCP)' : '1 (ICMP)'} • Version: 4</div>
                    </div>
                </div>

                <div class="p-3.5 rounded-2xl bg-cyan-950/25 border border-cyan-500/40">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[10px] font-bold uppercase text-cyan-400">Layer 2 • Data Link (Ethernet II / 802.1Q)</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded ${current.tagged ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-300'}">
                            VLAN ${current.vlan} (${current.tagged ? '802.1Q Tagged' : 'Untagged'})
                        </span>
                    </div>
                    <div class="space-y-1 text-slate-200">
                        <div>SRC MAC: <span class="text-amber-300 font-bold">${current.outSrcMac}</span></div>
                        <div>DST MAC: <span class="text-emerald-300 font-bold">${current.outDstMac}</span></div>
                        <div class="text-[11px] text-slate-400">EtherType: ${current.tagged ? '0x8100 (802.1Q) ➔ 0x0800' : '0x0800 (IPv4)'}</div>
                    </div>
                </div>

                <div class="md:col-span-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <span class="text-[10px] font-bold uppercase text-emerald-400 block">Layer 1 • Physical Interface & Signaling</span>
                        <span class="text-slate-300">Ingress Port: <strong class="text-white">${current.inPort}</strong> ➔ Egress Port: <strong class="text-cyan-300">${current.outPort}</strong></span>
                    </div>
                    <div class="text-[11px] text-slate-400">1000BASE-T Full-Duplex • IEEE 802.3ab</div>
                </div>
            </div>
        `;
    },

    // ================= PKA AUTO-GRADER & SCORE REPORT MODAL =================
    openGraderModal() {
        const report = window.appState.evaluateLabGrade();
        const scoreEl = document.getElementById('graderScoreNumber');
        const titleEl = document.getElementById('graderLabTitle');
        const listEl = document.getElementById('graderChecklist');

        if (scoreEl) {
            scoreEl.textContent = `${report.percent}%`;
            scoreEl.className = `text-3xl font-mono font-bold ${report.percent === 100 ? 'text-emerald-400' : 'text-amber-400'}`;
        }
        if (titleEl) titleEl.textContent = report.title;
        if (listEl) {
            listEl.innerHTML = '';
            report.checks.forEach(c => {
                const row = document.createElement('div');
                row.className = `p-3 rounded-2xl border font-mono text-xs flex items-center justify-between ${
                    c.passed
                        ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/25 border-rose-500/30 text-rose-300'
                }`;
                row.innerHTML = `
                    <span>${c.passed ? '✅' : '❌'} ${c.label}</span>
                    <span class="font-bold">${c.passed ? '+Pass' : 'Pending'}</span>
                `;
                listEl.appendChild(row);
            });
        }

        document.getElementById('graderModal').classList.remove('hidden');
    },

    closeGraderModal() {
        document.getElementById('graderModal').classList.add('hidden');
    },

    copyGradeReport() {
        const report = window.appState.evaluateLabGrade();
        const lines = [
            `=== NetSim Touch v4.0 - Lab Assessment Report ===`,
            `Lab: ${report.title}`,
            `Score: ${report.percent}% (${report.passedCount}/${report.checks.length} Objectives Passed)`,
            `Timestamp: ${new Date().toLocaleString('th-TH')}`,
            `------------------------------------------------`
        ];
        report.checks.forEach(c => {
            lines.push(`[${c.passed ? 'PASS' : 'FAIL'}] ${c.label}`);
        });
        navigator.clipboard.writeText(lines.join('\n')).then(() => {
            alert('คัดลอกใบรายงานผลคะแนน (Grade Report) เรียบร้อยแล้ว!');
        });
    },

    // ================= LAB PRESETS MODAL =================
    openPresetModal() {
        document.getElementById('presetModal').classList.remove('hidden');
    },

    closePresetModal() {
        document.getElementById('presetModal').classList.add('hidden');
    },

    selectPresetLab(presetId) {
        window.appState.loadPresetTopology(presetId);
        this.closePresetModal();
    },

    // ================= LAB SAVE / LOAD MODAL =================
    openLabModal() {
        const json = window.appState.exportLabJson();
        document.getElementById('labJsonTextArea').value = json;
        document.getElementById('labModal').classList.remove('hidden');
    },

    closeLabModal() {
        document.getElementById('labModal').classList.add('hidden');
    },

    copyLabJson() {
        const text = document.getElementById('labJsonTextArea').value;
        navigator.clipboard.writeText(text).then(() => {
            window.appState.logEvent('LAB', 'คัดลอก JSON ลง Clipboard เรียบร้อยแล้ว', 'ok');
            alert('คัดลอก JSON เรียบร้อยแล้ว!');
        });
    },

    downloadLabJsonFile() {
        const json = window.appState.exportLabJson();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `netsim-lab-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        window.appState.logEvent('LAB', 'ดาวน์โหลดไฟล์ .json สำเร็จ', 'ok');
    },

    triggerUploadJsonFile() {
        const fileInput = document.getElementById('labJsonFileInput');
        if (fileInput) fileInput.click();
    },

    handleFileUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            document.getElementById('labJsonTextArea').value = content;
            const ok = window.appState.importLabJson(content);
            if (ok) this.closeLabModal();
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    importLabJson() {
        const text = document.getElementById('labJsonTextArea').value;
        if (!text.trim()) return;
        const ok = window.appState.importLabJson(text);
        if (ok) {
            this.closeLabModal();
        }
    }
};

window.ModalController = ModalController;
