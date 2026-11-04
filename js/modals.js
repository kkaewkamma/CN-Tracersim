/**
 * NetSim Touch - Modal UI Controller
 * Manages Port Selector, Device GUI Config, Cisco IOS Terminal, and Lab Export/Import.
 */

const ModalController = {
    // Current Active States
    activeDeviceId: null,
    cliInstance: null,
    portPendingSource: null,
    portPendingTarget: null,
    selectedSrcPort: null,
    selectedDstPort: null,

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

        // Helper to check if port is already connected
        const isPortOccupied = (devId, portName) => {
            return window.appState.cables.some(c => 
                (c.from === devId && c.fromPort === portName) ||
                (c.to === devId && c.toPort === portName)
            );
        };

        // Populate Source Ports
        const srcAvailablePorts = Object.keys(srcDev.ports);
        this.selectedSrcPort = srcAvailablePorts.find(p => !isPortOccupied(srcDev.id, p)) || srcAvailablePorts[0];

        srcAvailablePorts.forEach(port => {
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
                    this.openPortModal(srcDev, dstDev); // re-render buttons
                };
            }
            srcList.appendChild(btn);
        });

        // Populate Target Ports
        const dstAvailablePorts = Object.keys(dstDev.ports);
        this.selectedDstPort = dstAvailablePorts.find(p => !isPortOccupied(dstDev.id, p)) || dstAvailablePorts[0];

        dstAvailablePorts.forEach(port => {
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
        document.getElementById('portModal').classList.add('hidden');
    },

    confirmCableConnection() {
        if (!this.selectedSrcPort || !this.selectedDstPort) {
            alert('กรุณาเลือกพอร์ตที่ว่างทั้งสองฝั่ง');
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
            window.appState.renderAll();
            this.renderGuiInterfaces(dev);
            this.updateCliUI();
        });

        // Modal Header Info
        const badge = document.getElementById('modalDeviceBadge');
        badge.textContent = dev.type[0].toUpperCase();
        document.getElementById('modalDeviceTitle').textContent = dev.name;
        document.getElementById('modalDeviceSub').textContent = 
            dev.type === 'router' ? 'Cisco 2911 Integrated Services Router' :
            dev.type === 'switch' ? 'Cisco Catalyst 2960 Switch' :
            dev.type === 'pc' ? 'PC Workstation (End Device)' : 'Data Center Web Server';

        // GUI Fields
        document.getElementById('guiHostname').value = dev.name;

        const gwBox = document.getElementById('guiGatewayBox');
        if (dev.type === 'router') {
            gwBox.classList.add('hidden');
        } else {
            gwBox.classList.remove('hidden');
            document.getElementById('guiGateway').value = dev.gateway || '';
        }

        this.renderGuiInterfaces(dev);
        this.updateCliUI();
        this.switchConfigTab(defaultTab);

        document.getElementById('configModal').classList.remove('hidden');
    },

    closeConfigModal() {
        document.getElementById('configModal').classList.add('hidden');
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

    renderGuiInterfaces(dev) {
        const container = document.getElementById('guiInterfacesList');
        container.innerHTML = '';

        Object.entries(dev.ports).forEach(([pName, pObj]) => {
            const card = document.createElement('div');
            card.className = 'p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3';
            
            const isSwitch = dev.type === 'switch';
            card.innerHTML = `
                <div class="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full ${pObj.up ? 'bg-emerald-400' : 'bg-rose-500'}"></span>
                        <span class="font-mono text-xs font-bold text-white">${pName}</span>
                    </div>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <span class="text-[11px] font-semibold text-slate-400">Port Status:</span>
                        <input type="checkbox" ${pObj.up ? 'checked' : ''} onchange="ModalController.togglePortStatus('${pName}', this.checked)" class="w-4 h-4 rounded text-cyan-500 focus:ring-0">
                        <span class="text-xs font-bold ${pObj.up ? 'text-emerald-400' : 'text-rose-400'}">${pObj.up ? 'Up (No Shut)' : 'Down'}</span>
                    </label>
                </div>
                ${isSwitch ? `
                    <div class="text-[11px] text-slate-400 font-mono">Layer 2 Switchport (VLAN 1 Default / Bridged)</div>
                ` : `
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 mb-1">IP Address</label>
                            <input type="text" value="${pObj.ip || ''}" placeholder="เช่น 192.168.1.1" onchange="ModalController.savePortIp('${pName}', this.value)" class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:border-cyan-400">
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

    saveGuiHostname(val) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && val.trim()) {
            dev.name = val.trim();
            window.appState.renderAll();
            this.updateCliUI();
        }
    },

    saveGuiGateway(val) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev) {
            dev.gateway = val.trim();
            window.appState.renderAll();
        }
    },

    togglePortStatus(portName, isUp) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && dev.ports[portName]) {
            dev.ports[portName].up = isUp;
            window.appState.renderAll();
            this.renderGuiInterfaces(dev);
        }
    },

    savePortIp(portName, ip) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && dev.ports[portName]) {
            dev.ports[portName].ip = ip.trim();
            window.appState.renderAll();
        }
    },

    savePortMask(portName, mask) {
        const dev = window.appState.devices.find(d => d.id === this.activeDeviceId);
        if (dev && dev.ports[portName]) {
            dev.ports[portName].mask = mask.trim();
            window.appState.renderAll();
        }
    },

    // ================= CLI HANDLING =================
    updateCliUI() {
        if (!this.cliInstance) return;
        const prompt = this.cliInstance.getPrompt();
        document.getElementById('cliPromptLabel').textContent = prompt;

        // Terminal history text
        const term = document.getElementById('cliTerminalOutput');
        term.textContent = this.cliInstance.device.cliHistory;
        term.scrollTop = term.scrollHeight;

        // Quick Chips
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
        window.appState.renderAll();
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
            alert('คัดลอก JSON เรียบร้อยแล้ว!');
        });
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
