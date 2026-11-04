/**
 * NetSim Touch - Cisco IOS CLI Simulator Engine
 * Replicates hierarchical CLI modes, command parsing, and touch-friendly quick chips.
 */

class CiscoCLI {
    constructor(device, onStateChange = null) {
        this.device = device;
        this.onStateChange = onStateChange; // callback to re-render UI if device state changes (e.g. hostname, IP, status)
    }

    getPrompt() {
        const name = this.device.name;
        switch (this.device.cliMode) {
            case 'privileged': return `${name}#`;
            case 'config': return `${name}(config)#`;
            case 'config-if': return `${name}(config-if)#`;
            case 'user':
            default: return `${name}>`;
        }
    }

    getQuickChips() {
        const mode = this.device.cliMode;
        if (mode === 'user') {
            return [
                { label: 'enable', cmd: 'enable', run: true },
                { label: 'ping ...', cmd: 'ping ', run: false },
                { label: 'show ip int brief', cmd: 'show ip int brief', run: true },
                { label: '?', cmd: '?', run: true }
            ];
        } else if (mode === 'privileged') {
            return [
                { label: 'conf t', cmd: 'configure terminal', run: true },
                { label: 'show ip int br', cmd: 'show ip int brief', run: true },
                { label: 'show ip route', cmd: 'show ip route', run: true },
                { label: 'show run', cmd: 'show running-config', run: true },
                { label: 'disable', cmd: 'disable', run: true },
                { label: 'ping ...', cmd: 'ping ', run: false },
                { label: '?', cmd: '?', run: true }
            ];
        } else if (mode === 'config') {
            const chips = [];
            // Add interfaces as chips
            Object.keys(this.device.ports).forEach(p => {
                chips.push({ label: `int ${p}`, cmd: `interface ${p}`, run: true });
            });
            chips.push(
                { label: 'hostname ...', cmd: 'hostname ', run: false },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            );
            return chips;
        } else if (mode === 'config-if') {
            return [
                { label: 'ip add ...', cmd: 'ip address ', run: false },
                { label: 'no shutdown', cmd: 'no shutdown', run: true },
                { label: 'shutdown', cmd: 'shutdown', run: true },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            ];
        }
        return [];
    }

    execute(rawInput) {
        const input = (rawInput || '').trim();
        if (!input) return '';

        const tokens = input.split(/\s+/);
        const cmd = tokens[0].toLowerCase();
        const arg1 = (tokens[1] || '').toLowerCase();
        const arg2 = (tokens[2] || '').toLowerCase();
        const arg3 = (tokens[3] || '').toLowerCase();

        // Global commands available across modes
        if (cmd === 'clear') {
            this.device.cliHistory = '';
            return '__CLEARED__';
        }
        if (cmd === '?' || cmd === 'help') {
            return this.getHelpText();
        }

        // ================= USER MODE =================
        if (this.device.cliMode === 'user') {
            if (cmd === 'enable' || cmd === 'en') {
                this.device.cliMode = 'privileged';
                return '';
            }
            if (cmd === 'show' || cmd === 'sh') {
                return this.handleShowCommand(tokens.slice(1));
            }
            if (cmd === 'ping') {
                return this.handlePingCommand(tokens[1]);
            }
            return `% Invalid input detected at '^' marker.\nType '?' or 'enable' to proceed.`;
        }

        // ================= PRIVILEGED MODE =================
        if (this.device.cliMode === 'privileged') {
            if (cmd === 'disable') {
                this.device.cliMode = 'user';
                return '';
            }
            if ((cmd === 'configure' && (arg1 === 'terminal' || arg1 === 't')) || (cmd === 'conf' && (arg1 === 't' || arg1 === 'terminal'))) {
                this.device.cliMode = 'config';
                return 'Enter configuration commands, one per line. End with CNTL/Z or end.';
            }
            if (cmd === 'show' || cmd === 'sh') {
                return this.handleShowCommand(tokens.slice(1));
            }
            if (cmd === 'ping') {
                return this.handlePingCommand(tokens[1]);
            }
            if (cmd === 'exit') {
                this.device.cliMode = 'user';
                return '';
            }
            return `% Invalid input or command incomplete.\nType '?' or 'configure terminal' to configure.`;
        }

        // ================= GLOBAL CONFIG MODE =================
        if (this.device.cliMode === 'config') {
            if (cmd === 'exit' || cmd === 'ex') {
                this.device.cliMode = 'privileged';
                return '';
            }
            if (cmd === 'end') {
                this.device.cliMode = 'privileged';
                return '';
            }
            if (cmd === 'hostname' || cmd === 'host') {
                if (!tokens[1]) return '% Incomplete command. Usage: hostname <name>';
                this.device.name = tokens[1];
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'interface' || cmd === 'int') {
                if (!tokens[1]) return '% Incomplete command. Usage: interface <Gig0/0 | Fa0/1 | Eth0>';
                const matchedPort = this.findMatchingPort(tokens[1]);
                if (!matchedPort) {
                    return `% Invalid interface type or number. Available: ${Object.keys(this.device.ports).join(', ')}`;
                }
                this.device.cliMode = 'config-if';
                this.device.cliCurrentIf = matchedPort;
                return '';
            }
            if (cmd === 'ip' && (arg1 === 'default-gateway' || arg1 === 'def')) {
                if (!tokens[2] || !NetworkEngine.isValidIPv4(tokens[2])) {
                    return '% Invalid IP address for default gateway.';
                }
                this.device.gateway = tokens[2];
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'do') {
                // allow 'do show ...'
                return this.execute(tokens.slice(1).join(' '));
            }
            return `% Invalid command in global config mode.`;
        }

        // ================= INTERFACE CONFIG MODE =================
        if (this.device.cliMode === 'config-if') {
            const currentPort = this.device.cliCurrentIf;
            const portObj = this.device.ports[currentPort];

            if (cmd === 'exit' || cmd === 'ex') {
                this.device.cliMode = 'config';
                this.device.cliCurrentIf = null;
                return '';
            }
            if (cmd === 'end') {
                this.device.cliMode = 'privileged';
                this.device.cliCurrentIf = null;
                return '';
            }
            if (cmd === 'ip' && (arg1 === 'address' || arg1 === 'add')) {
                const ip = tokens[2];
                const mask = tokens[3] || '255.255.255.0';
                if (!NetworkEngine.isValidIPv4(ip)) {
                    return '% Invalid IP address format. Example: ip address 192.168.10.1 255.255.255.0';
                }
                if (!NetworkEngine.isValidMask(mask)) {
                    return '% Invalid subnet mask format. Example: 255.255.255.0';
                }
                portObj.ip = ip;
                portObj.mask = mask;
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'no' && (arg1 === 'shutdown' || arg1 === 'shut')) {
                portObj.up = true;
                if (this.onStateChange) this.onStateChange();
                return `%LINK-5-CHANGED: Interface ${currentPort}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${currentPort}, changed state to up`;
            }
            if (cmd === 'shutdown' || cmd === 'shut') {
                portObj.up = false;
                if (this.onStateChange) this.onStateChange();
                return `%LINK-5-CHANGED: Interface ${currentPort}, changed state to administratively down\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${currentPort}, changed state to down`;
            }
            if (cmd === 'do') {
                return this.execute(tokens.slice(1).join(' '));
            }
            return `% Invalid command in interface config mode.`;
        }

        return `% Unrecognized command.`;
    }

    findMatchingPort(str) {
        const query = str.toLowerCase().replace(/[\s\-\_]/g, '');
        for (const p of Object.keys(this.device.ports)) {
            const clean = p.toLowerCase().replace(/[\s\-\_]/g, '');
            if (clean === query || clean.startsWith(query) || query.includes(clean)) {
                return p;
            }
            // Match shorthand e.g. g0/0 -> Gig0/0, fa0/1 -> Fa0/1, e0 -> Eth0
            if (query.replace('gigabitethernet', 'g').replace('gig', 'g').replace('fastethernet', 'fa') === 
                clean.replace('gigabitethernet', 'g').replace('gig', 'g').replace('fastethernet', 'fa')) {
                return p;
            }
        }
        return null;
    }

    handleShowCommand(args) {
        const full = args.join(' ').toLowerCase();

        // show ip interface brief
        if (full.startsWith('ip int') || full === 'ip interface brief') {
            let out = 'Interface              IP-Address      OK? Method Status                Protocol\n';
            out +=    '--------------------------------------------------------------------------------\n';
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                const namePadded = pName.padEnd(22, ' ');
                const ipPadded = (pObj.ip || 'unassigned').padEnd(16, ' ');
                const statusPadded = (pObj.up ? 'up' : 'administratively down').padEnd(22, ' ');
                const proto = pObj.up ? 'up' : 'down';
                out += `${namePadded}${ipPadded}YES manual ${statusPadded}${proto}\n`;
            }
            return out.trimEnd();
        }

        // show ip route
        if (full.startsWith('ip ro')) {
            if (this.device.type !== 'router') {
                return `IP routing is not enabled on this device.\nDefault gateway is ${this.device.gateway || 'not set'}`;
            }
            let out = 'Codes: C - connected, L - local, S - static, R - RIP\n\nGateway of last resort is not set\n\n';
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                if (pObj.ip && pObj.up) {
                    const net = NetworkEngine.getNetworkAddress(pObj.ip, pObj.mask);
                    out += `C    ${net}/24 is directly connected, ${pName}\n`;
                    out += `L    ${pObj.ip}/32 is directly connected, ${pName}\n`;
                }
            }
            return out.trimEnd();
        }

        // show running-config
        if (full.startsWith('run')) {
            let out = `Building configuration...\n\nCurrent configuration : 650 bytes\n!\n`;
            out += `hostname ${this.device.name}\n!\n`;
            if (this.device.gateway) {
                out += `ip default-gateway ${this.device.gateway}\n!\n`;
            }
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                out += `interface ${pName}\n`;
                if (pObj.ip) {
                    out += ` ip address ${pObj.ip} ${pObj.mask || '255.255.255.0'}\n`;
                } else {
                    out += ` no ip address\n`;
                }
                out += ` ${pObj.up ? 'no shutdown' : 'shutdown'}\n!\n`;
            }
            out += `end`;
            return out;
        }

        return `% Incomplete or unsupported show command.\nTry: show ip int brief, show ip route, show running-config`;
    }

    handlePingCommand(targetIp) {
        if (!targetIp || !NetworkEngine.isValidIPv4(targetIp)) {
            return '% Usage: ping <valid_ip_address>';
        }

        // Find target device in global devices array
        const allDevices = window.appState ? window.appState.devices : [];
        const allCables = window.appState ? window.appState.cables : [];
        let targetDev = null;

        for (const dev of allDevices) {
            for (const p of Object.values(dev.ports)) {
                if (p.ip === targetIp) {
                    targetDev = dev;
                    break;
                }
            }
            if (targetDev) break;
        }

        if (!targetDev) {
            return `Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5)`;
        }

        const sim = NetworkEngine.simulatePing(this.device, targetDev, allDevices, allCables);
        if (sim.success) {
            return `Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`;
        } else {
            return `Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5) (${sim.reason})`;
        }
    }

    getHelpText() {
        const mode = this.device.cliMode;
        if (mode === 'user') {
            return `Available commands in User Exec mode:
  enable             Turn on privileged commands
  show               Show running system information
  ping <ip>          Send ICMP echo request
  help / ?           Display this list of commands`;
        } else if (mode === 'privileged') {
            return `Available commands in Privileged Exec mode:
  configure terminal Enter configuration mode
  disable            Turn off privileged commands
  show ip int brief  Brief summary of interface status
  show ip route      Display IP routing table
  show run           Display current running configuration
  ping <ip>          Send ICMP echo request
  exit               Exit to user mode`;
        } else if (mode === 'config') {
            return `Available commands in Global Config mode:
  hostname <name>    Set system's network name
  interface <port>   Select an interface to configure
  ip default-gateway Set default gateway
  exit               Exit from configure mode
  end                Exit to privileged exec mode`;
        } else if (mode === 'config-if') {
            return `Available commands in Interface Config mode:
  ip address <ip> <m> Set IP address and subnet mask
  no shutdown        Enable this interface
  shutdown           Administratively disable this interface
  exit               Exit interface configuration
  end                Exit to privileged exec mode`;
        }
        return '';
    }
}

window.CiscoCLI = CiscoCLI;
