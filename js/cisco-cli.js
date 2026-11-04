/**
 * NetSim Touch v4.0 Ultimate - Cisco IOS CLI Simulator Engine
 * Supports:
 * - Hierarchical Modes: User (>), Privileged (#), Global Config (config#), Interface (config-if#), Sub-interface (config-subif#), Router OSPF (config-router#)
 * - Tab Auto-Completion & Command History (ArrowUp / ArrowDown)
 * - 802.1Q Trunking & Router-on-a-Stick (encapsulation dot1Q <vlan>)
 * - OSPF Dynamic Routing & Multi-Hop Static Routing
 * - Extended Access Control Lists (access-list 100 permit/deny icmp|tcp|ip ...) & show access-lists
 * - Network Address Translation (ip nat inside/outside, show ip nat translations)
 * - DHCP Client (ip address dhcp), HTTP Client (http <ip>), Traceroute, ARP, and MAC Table
 */

class CiscoCLI {
    constructor(device, onStateChange = null) {
        this.device = device;
        if (!this.device.routes) this.device.routes = [];
        if (!this.device.acls) this.device.acls = [];
        if (!this.device.natTranslations) this.device.natTranslations = [];
        if (!this.device.ospf) this.device.ospf = { processId: null, networks: [] };
        if (!this.device.cmdHistory) this.device.cmdHistory = [];
        this.historyCursor = this.device.cmdHistory.length;
        this.onStateChange = onStateChange;
    }

    getPrompt() {
        const name = this.device.name;
        switch (this.device.cliMode) {
            case 'privileged': return `${name}#`;
            case 'config': return `${name}(config)#`;
            case 'config-if':
                return (this.device.cliCurrentIf && this.device.cliCurrentIf.includes('.'))
                    ? `${name}(config-subif)#`
                    : `${name}(config-if)#`;
            case 'config-router': return `${name}(config-router)#`;
            case 'user':
            default: return `${name}>`;
        }
    }

    getQuickChips() {
        const mode = this.device.cliMode;
        const isSwitch = this.device.type === 'switch';
        const isRouter = this.device.type === 'router';

        if (mode === 'user') {
            const chips = [
                { label: 'enable', cmd: 'enable', run: true },
                { label: 'ping ...', cmd: 'ping ', run: false },
                { label: 'http ...', cmd: 'http ', run: false },
                { label: 'traceroute ...', cmd: 'traceroute ', run: false },
                { label: 'show ip int br', cmd: 'show ip int brief', run: true }
            ];
            if (isSwitch) {
                chips.push({ label: 'show vlan br', cmd: 'show vlan brief', run: true });
            }
            chips.push({ label: '?', cmd: '?', run: true });
            return chips;
        } else if (mode === 'privileged') {
            const chips = [
                { label: 'conf t', cmd: 'configure terminal', run: true },
                { label: 'show ip int br', cmd: 'show ip int brief', run: true }
            ];
            if (isRouter) {
                chips.push(
                    { label: 'show ip route', cmd: 'show ip route', run: true },
                    { label: 'show access-lists', cmd: 'show access-lists', run: true },
                    { label: 'show ip nat tr', cmd: 'show ip nat translations', run: true },
                    { label: 'show ip ospf nei', cmd: 'show ip ospf neighbor', run: true }
                );
            }
            if (isSwitch) {
                chips.push(
                    { label: 'show vlan br', cmd: 'show vlan brief', run: true },
                    { label: 'show int trunk', cmd: 'show interfaces trunk', run: true },
                    { label: 'show mac address-table', cmd: 'show mac address-table', run: true }
                );
            }
            chips.push(
                { label: 'show run', cmd: 'show running-config', run: true },
                { label: 'ping ...', cmd: 'ping ', run: false },
                { label: 'http ...', cmd: 'http ', run: false },
                { label: 'write', cmd: 'write', run: true }
            );
            return chips;
        } else if (mode === 'config') {
            const chips = [];
            Object.keys(this.device.ports).forEach(p => {
                chips.push({ label: `int ${p}`, cmd: `interface ${p}`, run: true });
            });
            if (isRouter) {
                chips.push(
                    { label: 'ip route ...', cmd: 'ip route ', run: false },
                    { label: 'router ospf 1', cmd: 'router ospf 1', run: true },
                    { label: 'access-list 100 deny icmp ...', cmd: 'access-list 100 deny icmp any any', run: false },
                    { label: 'ip nat overload', cmd: 'ip nat inside source list 1 interface Gig0/1 overload', run: true }
                );
            } else if (!isSwitch) {
                chips.push({ label: 'ip default-gw ...', cmd: 'ip default-gateway ', run: false });
            }
            chips.push(
                { label: 'hostname ...', cmd: 'hostname ', run: false },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            );
            return chips;
        } else if (mode === 'config-if') {
            const chips = [];
            const isSubIf = this.device.cliCurrentIf && this.device.cliCurrentIf.includes('.');
            if (isSwitch) {
                chips.push(
                    { label: 'mode trunk', cmd: 'switchport mode trunk', run: true },
                    { label: 'mode access', cmd: 'switchport mode access', run: true },
                    { label: 'vlan 10', cmd: 'switchport access vlan 10', run: true },
                    { label: 'vlan 20', cmd: 'switchport access vlan 20', run: true }
                );
            } else {
                if (isSubIf) {
                    const subVlan = this.device.cliCurrentIf.split('.')[1] || '10';
                    chips.push({ label: `encap dot1Q ${subVlan}`, cmd: `encapsulation dot1Q ${subVlan}`, run: true });
                }
                chips.push({ label: 'ip add ...', cmd: 'ip address ', run: false });
                if (isRouter) {
                    chips.push(
                        { label: 'ip nat inside', cmd: 'ip nat inside', run: true },
                        { label: 'ip nat outside', cmd: 'ip nat outside', run: true }
                    );
                }
                if (this.device.type === 'pc' || this.device.type === 'server') {
                    chips.push({ label: 'ip add dhcp', cmd: 'ip address dhcp', run: true });
                }
            }
            chips.push(
                { label: 'no shutdown', cmd: 'no shutdown', run: true },
                { label: 'shutdown', cmd: 'shutdown', run: true },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            );
            return chips;
        } else if (mode === 'config-router') {
            return [
                { label: 'network ... area 0', cmd: 'network 192.168.10.0 0.0.0.255 area 0', run: false },
                { label: 'net 10.0.0.0 0.0.0.3 area 0', cmd: 'network 10.0.0.0 0.0.0.3 area 0', run: true },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            ];
        }
        return [];
    }

    autoComplete(rawInput) {
        const trimmed = (rawInput || '').trimStart();
        if (!trimmed) return rawInput;

        const mode = this.device.cliMode;
        const candidatesByMode = {
            'user': [
                'enable', 'ping ', 'http ', 'traceroute ', 'show ip interface brief', 'show vlan brief', 'help'
            ],
            'privileged': [
                'configure terminal', 'show ip interface brief', 'show ip route', 'show access-lists',
                'show ip nat translations', 'show ip ospf neighbor', 'show ip arp', 'show running-config',
                'show vlan brief', 'show interfaces trunk', 'show mac address-table', 'ping ', 'http ',
                'traceroute ', 'write', 'disable', 'clear', 'exit'
            ],
            'config': [
                'interface ', 'hostname ', 'ip route ', 'no ip route ', 'ip default-gateway ',
                'router ospf 1', 'access-list 100 ', 'no access-list ', 'ip nat inside source list 1 interface Gig0/1 overload',
                'exit', 'end'
            ],
            'config-if': [
                'ip address ', 'ip address dhcp', 'ip nat inside', 'ip nat outside',
                'encapsulation dot1Q ', 'switchport mode trunk', 'switchport mode access',
                'switchport access vlan ', 'no shutdown', 'shutdown', 'exit', 'end'
            ],
            'config-router': [
                'network ', 'no network ', 'exit', 'end'
            ]
        };

        const lower = trimmed.toLowerCase();
        const shorthandMap = {
            'en': 'enable',
            'conf': 'configure terminal',
            'conf t': 'configure terminal',
            'sh ip int': 'show ip interface brief',
            'sh ip int br': 'show ip interface brief',
            'sh ip ro': 'show ip route',
            'sh ip os': 'show ip ospf neighbor',
            'sh ip na': 'show ip nat translations',
            'sh ip nat tr': 'show ip nat translations',
            'sh acc': 'show access-lists',
            'sh run': 'show running-config',
            'sh vl': 'show vlan brief',
            'sh mac': 'show mac address-table',
            'sh int tr': 'show interfaces trunk',
            'sw m t': 'switchport mode trunk',
            'sw m a': 'switchport mode access',
            'sw a v': 'switchport access vlan ',
            'encap': 'encapsulation dot1Q ',
            'no sh': 'no shutdown',
            'ip add': 'ip address ',
            'ip def': 'ip default-gateway ',
            'ro os': 'router ospf 1',
            'acc': 'access-list 100 deny icmp any any'
        };
        if (shorthandMap[lower]) {
            return shorthandMap[lower];
        }

        if ((mode === 'config' || mode === 'config-if') && (lower.startsWith('int ') || lower.startsWith('interface '))) {
            const portPart = trimmed.split(/\s+/)[1] || '';
            const matched = this.findMatchingPort(portPart);
            if (matched) return `interface ${matched}`;
        }

        const list = candidatesByMode[mode] || [];
        const match = list.find(c => c.toLowerCase().startsWith(lower));
        return match || rawInput;
    }

    getHistoryCommand(direction) {
        const hist = this.device.cmdHistory || [];
        if (hist.length === 0) return '';
        this.historyCursor = Math.max(0, Math.min(hist.length, this.historyCursor + direction));
        if (this.historyCursor >= hist.length) return '';
        return hist[this.historyCursor];
    }

    execute(rawInput) {
        const input = (rawInput || '').trim();
        if (!input) return '';

        this.device.cmdHistory = this.device.cmdHistory || [];
        if (this.device.cmdHistory[this.device.cmdHistory.length - 1] !== input) {
            this.device.cmdHistory.push(input);
        }
        this.historyCursor = this.device.cmdHistory.length;

        const tokens = input.split(/\s+/);
        const cmd = tokens[0].toLowerCase();
        const arg1 = (tokens[1] || '').toLowerCase();
        const arg2 = (tokens[2] || '').toLowerCase();
        const arg3 = (tokens[3] || '').toLowerCase();

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
            if (cmd === 'http' || cmd === 'curl') {
                return this.handleHttpCommand(tokens[1]);
            }
            if (cmd === 'traceroute' || cmd === 'tracert') {
                return this.handleTracerouteCommand(tokens[1]);
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
            if (cmd === 'http' || cmd === 'curl') {
                return this.handleHttpCommand(tokens[1]);
            }
            if (cmd === 'traceroute' || cmd === 'tracert') {
                return this.handleTracerouteCommand(tokens[1]);
            }
            if (cmd === 'arp') {
                return this.handleShowCommand(['ip', 'arp']);
            }
            if (cmd === 'write' || cmd === 'wr' || (cmd === 'copy' && arg1.startsWith('run'))) {
                if (window.appState) window.appState.saveToLocalStorage();
                return 'Building configuration...\n[OK]';
            }
            if (cmd === 'exit') {
                this.device.cliMode = 'user';
                return '';
            }
            return `% Invalid input or command incomplete.\nType '?' or 'configure terminal' to configure.`;
        }

        // ================= GLOBAL CONFIG MODE =================
        if (this.device.cliMode === 'config') {
            if (cmd === 'exit' || cmd === 'ex' || cmd === 'end') {
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
                if (!tokens[1]) return '% Incomplete command. Usage: interface <Gig0/0 | Gig0/0.10 | Fa0/1>';
                const rawIf = tokens.slice(1).join('');
                if (rawIf.includes('.') && this.device.type === 'router') {
                    const [basePart, subId] = rawIf.split('.');
                    const matchedBase = this.findMatchingPort(basePart);
                    const subNum = parseInt(subId, 10);
                    if (!matchedBase || isNaN(subNum) || subNum < 1 || subNum > 4094) {
                        return `% Invalid sub-interface. Example: interface Gig0/0.10`;
                    }
                    const fullSubName = `${matchedBase}.${subNum}`;
                    if (!this.device.ports[fullSubName]) {
                        this.device.ports[fullSubName] = {
                            ip: '',
                            mask: '255.255.255.0',
                            up: true,
                            vlan: subNum,
                            isSubIf: true,
                            parentPort: matchedBase,
                            mac: NetworkEngine.generateMac('router')
                        };
                    }
                    this.device.cliMode = 'config-if';
                    this.device.cliCurrentIf = fullSubName;
                    if (this.onStateChange) this.onStateChange();
                    return `%LINK-5-CHANGED: Interface ${fullSubName}, changed state to up`;
                }

                const matchedPort = this.findMatchingPort(rawIf);
                if (!matchedPort) {
                    return `% Invalid interface type or number. Available: ${Object.keys(this.device.ports).join(', ')}`;
                }
                this.device.cliMode = 'config-if';
                this.device.cliCurrentIf = matchedPort;
                return '';
            }
            if (cmd === 'router' && arg1 === 'ospf') {
                if (this.device.type !== 'router') {
                    return '% OSPF routing is only supported on Router devices.';
                }
                const pid = parseInt(tokens[2] || '1', 10) || 1;
                this.device.ospf = this.device.ospf || { processId: pid, networks: [] };
                this.device.ospf.processId = pid;
                this.device.cliMode = 'config-router';
                return '';
            }
            // Extended ACL: access-list <100-199> <permit|deny> <icmp|tcp|ip|http> <src|any> [<dst|any>]
            if (cmd === 'access-list') {
                if (this.device.type !== 'router') {
                    return '% Access-lists are only supported on Router devices.';
                }
                const aclId = parseInt(tokens[1], 10) || 100;
                const action = (tokens[2] || '').toLowerCase();
                const proto = (tokens[3] || '').toLowerCase();
                const src = (tokens[4] || 'any').toLowerCase();
                const dst = (tokens[5] || 'any').toLowerCase();

                if (!['permit', 'deny'].includes(action) || !['icmp', 'tcp', 'ip', 'http'].includes(proto)) {
                    return '% Usage: access-list <100-199> <permit|deny> <icmp|tcp|ip> <src-ip|any> <dst-ip|any>\nExample: access-list 100 deny icmp any 192.168.20.100';
                }

                this.device.acls = this.device.acls || [];
                this.device.acls.push({
                    id: aclId,
                    action,
                    protocol: proto === 'http' ? 'tcp' : proto,
                    src,
                    srcWildcard: '0.0.0.0',
                    dst,
                    dstWildcard: '0.0.0.0',
                    hits: 0
                });
                if (this.onStateChange) this.onStateChange();
                return `%SEC-6-ACL_ADDED: Extended IP access list ${aclId} (${action} ${proto} ${src} -> ${dst}) active`;
            }
            if (cmd === 'no' && arg1 === 'access-list') {
                const aclId = parseInt(tokens[2], 10);
                if (isNaN(aclId)) {
                    this.device.acls = [];
                } else {
                    this.device.acls = (this.device.acls || []).filter(a => a.id !== aclId);
                }
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            // NAT Overload: ip nat inside source ...
            if (cmd === 'ip' && arg1 === 'nat') {
                if (this.device.type !== 'router') return '% NAT is only supported on Router devices.';
                this.device.natEnabled = true;
                if (this.onStateChange) this.onStateChange();
                return `%NAT-6-ENABLED: Dynamic NAT/PAT Overload enabled on ${this.device.name}`;
            }
            if (cmd === 'no' && arg1 === 'ip' && arg2 === 'nat') {
                this.device.natEnabled = false;
                this.device.natTranslations = [];
                if (this.onStateChange) this.onStateChange();
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
            if (cmd === 'ip' && arg1 === 'route') {
                if (this.device.type !== 'router') {
                    return '% IP routing is only supported on Router devices.';
                }
                const net = tokens[2];
                const mask = tokens[3];
                const nextHop = tokens[4];
                if (!net || !mask || !nextHop || !NetworkEngine.isValidIPv4(net) || !NetworkEngine.isValidMask(mask) || !NetworkEngine.isValidIPv4(nextHop)) {
                    return '% Incomplete or invalid static route.\nUsage: ip route <network> <mask> <next-hop-ip>';
                }
                const normalizedNet = NetworkEngine.getNetworkAddress(net, mask);
                this.device.routes = this.device.routes || [];
                const existingIdx = this.device.routes.findIndex(r => r.network === normalizedNet && r.mask === mask);
                if (existingIdx >= 0) {
                    this.device.routes[existingIdx].nextHop = nextHop;
                } else {
                    this.device.routes.push({ network: normalizedNet, mask, nextHop });
                }
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'no' && arg1 === 'ip' && arg2 === 'route') {
                const net = tokens[3];
                const mask = tokens[4];
                if (!net || !mask) return '% Usage: no ip route <network> <mask>';
                const normalizedNet = NetworkEngine.getNetworkAddress(net, mask) || net;
                this.device.routes = (this.device.routes || []).filter(r => !(r.network === normalizedNet && r.mask === mask));
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'do') {
                return this.executeInPrivilegedContext(tokens.slice(1).join(' '));
            }
            return `% Invalid command in global config mode.`;
        }

        // ================= ROUTER OSPF CONFIG MODE =================
        if (this.device.cliMode === 'config-router') {
            if (cmd === 'exit' || cmd === 'ex') {
                this.device.cliMode = 'config';
                return '';
            }
            if (cmd === 'end') {
                this.device.cliMode = 'privileged';
                return '';
            }
            if (cmd === 'network' || cmd === 'net') {
                const netIp = tokens[1];
                const wildcard = tokens[2] || '0.0.0.255';
                const areaKeyword = (tokens[3] || '').toLowerCase();
                const areaId = parseInt(tokens[4] ?? '0', 10);

                if (!NetworkEngine.isValidIPv4(netIp) || !NetworkEngine.isValidIPv4(wildcard) || (areaKeyword && areaKeyword !== 'area')) {
                    return '% Incomplete command. Usage: network <network-ip> <wildcard-mask> area <area-id>';
                }
                const mask = NetworkEngine.wildcardToMask(wildcard);
                const normalizedNet = NetworkEngine.getNetworkAddress(netIp, mask);
                this.device.ospf = this.device.ospf || { processId: 1, networks: [] };
                const exists = this.device.ospf.networks.some(n => n.network === normalizedNet && n.wildcard === wildcard);
                if (!exists) {
                    this.device.ospf.networks.push({ network: normalizedNet, wildcard, area: isNaN(areaId) ? 0 : areaId });
                }
                if (this.onStateChange) this.onStateChange();
                return `%OSPF-5-ADJCHG: OSPF network ${normalizedNet} (wildcard ${wildcard}) enabled in Area ${isNaN(areaId) ? 0 : areaId}`;
            }
            if (cmd === 'no' && (arg1 === 'network' || arg1 === 'net')) {
                const netIp = tokens[2];
                this.device.ospf.networks = (this.device.ospf?.networks || []).filter(n => n.network !== netIp);
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'do') {
                return this.executeInPrivilegedContext(tokens.slice(1).join(' '));
            }
            return `% Invalid command in router OSPF configuration mode.`;
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
            // ip nat inside / outside
            if (cmd === 'ip' && arg1 === 'nat' && (arg2 === 'inside' || arg2 === 'outside')) {
                if (this.device.type !== 'router') return '% IP NAT is only supported on Router interfaces.';
                portObj.nat = arg2;
                this.device.natEnabled = true;
                if (this.onStateChange) this.onStateChange();
                return `%NAT-6-INTF: Interface ${currentPort} configured as IP NAT ${arg2.toUpperCase()}`;
            }
            if (cmd === 'encapsulation' || cmd === 'encap') {
                if (this.device.type !== 'router') {
                    return '% Encapsulation dot1Q is only valid on Router sub-interfaces.';
                }
                const vlanId = parseInt(tokens[2], 10);
                if (arg1 !== 'dot1q' || isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
                    return '% Usage: encapsulation dot1Q <1-4094>';
                }
                portObj.vlan = vlanId;
                if (this.onStateChange) this.onStateChange();
                return `% 802.1Q VLAN tagging set to VLAN ${vlanId} on ${currentPort}`;
            }
            if (cmd === 'switchport' || cmd === 'sw') {
                if (this.device.type !== 'switch') {
                    return '% Switchport commands are only valid on Switch interfaces.';
                }
                if (arg1 === 'mode' && (arg2 === 'trunk' || arg2 === 'tr')) {
                    portObj.mode = 'trunk';
                    if (this.onStateChange) this.onStateChange();
                    return `%LINEPROTO-5-UPDOWN: Interface ${currentPort} configured as 802.1Q Trunk port`;
                }
                if (arg1 === 'mode' && (arg2 === 'access' || arg2 === 'acc')) {
                    portObj.mode = 'access';
                    if (this.onStateChange) this.onStateChange();
                    return `% Interface ${currentPort} configured as Access port (VLAN ${portObj.vlan || 1})`;
                }
                if (arg1 === 'access' && arg2 === 'vlan') {
                    const vlanId = parseInt(tokens[3], 10);
                    if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
                        return '% Invalid VLAN ID. Specify a value between 1 and 4094.';
                    }
                    portObj.mode = 'access';
                    portObj.vlan = vlanId;
                    if (this.onStateChange) this.onStateChange();
                    return `% Access VLAN on ${currentPort} set to VLAN ${vlanId}`;
                }
                return '% Usage: switchport mode <access|trunk> OR switchport access vlan <1-4094>';
            }
            if (cmd === 'ip' && (arg1 === 'address' || arg1 === 'add')) {
                if (this.device.type === 'switch') {
                    return '% Layer 2 switch port cannot be assigned an IP address directly.';
                }
                if (arg2 === 'dhcp') {
                    const allDevs = window.appState ? window.appState.devices : [];
                    const allCables = window.appState ? window.appState.cables : [];
                    const lease = NetworkEngine.requestDhcpLease(this.device, allDevs, allCables);
                    if (this.onStateChange) this.onStateChange();
                    if (lease.success) {
                        return `%DHCP-6-ADDRESS_ASSIGN: Interface ${currentPort} assigned DHCP address ${lease.ip}, mask ${lease.mask}, gateway ${lease.gateway} (from ${lease.dhcpServer})`;
                    }
                    return `%DHCP-4-FAIL: ${lease.reason}`;
                }
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
                portObj.dhcp = false;
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'no' && arg1 === 'ip' && (arg2 === 'address' || arg2 === 'add')) {
                portObj.ip = '';
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
                return this.executeInPrivilegedContext(tokens.slice(1).join(' '));
            }
            return `% Invalid command in interface config mode.`;
        }

        return `% Unrecognized command.`;
    }

    executeInPrivilegedContext(subCmd) {
        const prevMode = this.device.cliMode;
        this.device.cliMode = 'privileged';
        const res = this.execute(subCmd);
        this.device.cliMode = prevMode;
        return res;
    }

    findMatchingPort(str) {
        const query = (str || '').toLowerCase().replace(/[\s\-\_]/g, '');
        for (const p of Object.keys(this.device.ports)) {
            const clean = p.toLowerCase().replace(/[\s\-\_]/g, '');
            if (clean === query || clean.startsWith(query)) {
                return p;
            }
            if (query.replace('gigabitethernet', 'g').replace('gig', 'g').replace('fastethernet', 'fa') === 
                clean.replace('gigabitethernet', 'g').replace('gig', 'g').replace('fastethernet', 'fa')) {
                return p;
            }
        }
        return null;
    }

    handleShowCommand(args) {
        const full = args.join(' ').toLowerCase();
        const allDevices = window.appState ? window.appState.devices : [];
        const allCables = window.appState ? window.appState.cables : [];

        // show ip interface brief
        if (full.startsWith('ip int') || full === 'ip interface brief') {
            let out = 'Interface              IP-Address      OK? Method Status                Protocol\n';
            out +=    '--------------------------------------------------------------------------------\n';
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                const namePadded = pName.padEnd(22, ' ');
                let ipLabel = pObj.ip || 'unassigned';
                if (this.device.type === 'switch') {
                    ipLabel = pObj.mode === 'trunk' ? 'TRUNK (802.1Q)' : `VLAN ${pObj.vlan || 1}`;
                }
                const ipPadded = ipLabel.padEnd(16, ' ');
                const method = (pObj.dhcp ? 'DHCP  ' : 'manual');
                const isUp = NetworkEngine.isInterfaceUp(this.device, pName);
                const statusPadded = (isUp ? 'up' : 'administratively down').padEnd(22, ' ');
                const proto = isUp ? 'up' : 'down';
                out += `${namePadded}${ipPadded}YES ${method} ${statusPadded}${proto}\n`;
            }
            return out.trimEnd();
        }

        // show access-lists
        if (full.startsWith('acc')) {
            const acls = this.device.acls || [];
            if (acls.length === 0) {
                return 'No IP access lists configured.';
            }
            let out = 'Extended IP access list 100\n';
            acls.forEach((r, idx) => {
                const seq = (idx + 1) * 10;
                const eqSuffix = r.protocol === 'tcp' ? ' eq www (80)' : '';
                out += `    ${seq} ${r.action} ${r.protocol} ${r.src} ${r.dst}${eqSuffix} (${r.hits || 0} matches)\n`;
            });
            return out.trimEnd();
        }

        // show ip nat translations
        if (full.startsWith('ip nat')) {
            const trans = this.device.natTranslations || [];
            if (trans.length === 0) {
                return `Pro Inside global      Inside local       Outside local      Outside global\n(No active NAT translations yet — send Ping or HTTP across NAT router)`;
            }
            let out = 'Pro Inside global      Inside local       Outside local      Outside global\n';
            trans.forEach(t => {
                out += `${t.proto.padEnd(4, ' ')}${t.insideGlobal.padEnd(19, ' ')}${t.insideLocal.padEnd(19, ' ')}${t.outsideLocal.padEnd(19, ' ')}${t.outsideGlobal}\n`;
            });
            return out.trimEnd();
        }

        // show interfaces trunk
        if (full.includes('trunk')) {
            if (this.device.type !== 'switch') {
                return '% Command is only valid on Catalyst Switches.';
            }
            const trunks = Object.entries(this.device.ports).filter(([, p]) => p.mode === 'trunk');
            if (trunks.length === 0) {
                return 'No trunk ports configured on this switch.';
            }
            let out = 'Port        Mode         Encapsulation  Status        Native vlan\n';
            for (const [pName] of trunks) {
                out += `${pName.padEnd(12, ' ')}on           802.1q         trunking      1\n`;
            }
            return out.trimEnd();
        }

        // show vlan brief
        if (full.startsWith('vlan')) {
            if (this.device.type !== 'switch') {
                return '% Ambiguous command: "show vlan" is only available on Catalyst Switches.';
            }
            const vlanGroups = { 1: [] };
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                if (pObj.mode === 'trunk') continue;
                const v = pObj.vlan || 1;
                if (!vlanGroups[v]) vlanGroups[v] = [];
                vlanGroups[v].push(pName);
            }

            let out = 'VLAN Name                             Status    Ports\n';
            out +=    '---- -------------------------------- --------- -------------------------------\n';
            Object.keys(vlanGroups).sort((a, b) => Number(a) - Number(b)).forEach(v => {
                const vPadded = String(v).padEnd(5, ' ');
                const vName = (v === '1' ? 'default' : `VLAN${String(v).padStart(4, '0')}`).padEnd(33, ' ');
                const portsStr = vlanGroups[v].join(', ');
                out += `${vPadded}${vName}active    ${portsStr}\n`;
            });
            return out.trimEnd();
        }

        // show mac address-table
        if (full.startsWith('mac')) {
            if (this.device.type !== 'switch') {
                return '% MAC Address Table is only available on Switches.';
            }
            let out = '          Mac Address Table\n-------------------------------------------\n';
            out += 'Vlan    Mac Address       Type        Ports\n';
            out += '----    -----------       --------    -----\n';
            const myCables = allCables.filter(c => c.from === this.device.id || c.to === this.device.id);
            myCables.forEach(c => {
                const myPort = c.from === this.device.id ? c.fromPort : c.toPort;
                const peerId = c.from === this.device.id ? c.to : c.from;
                const peerPort = c.from === this.device.id ? c.toPort : c.fromPort;
                const peerDev = allDevices.find(d => d.id === peerId);
                if (peerDev && this.device.ports[myPort]?.up && peerDev.ports[peerPort]?.up) {
                    const pObj = peerDev.ports[peerPort];
                    if (!pObj.mac) pObj.mac = NetworkEngine.generateMac(peerDev.type);
                    const vlan = this.device.ports[myPort]?.mode === 'trunk' ? 'ALL' : String(this.device.ports[myPort]?.vlan || 1);
                    out += `${vlan.padEnd(8, ' ')}${pObj.mac.padEnd(18, ' ')}DYNAMIC     ${myPort} (${peerDev.name})\n`;
                }
            });
            return out.trimEnd();
        }

        // show ip arp
        if (full.startsWith('ip arp') || full === 'arp') {
            let out = 'Protocol  Address          Age (min)  Hardware Addr   Type   Interface\n';
            allDevices.forEach(dev => {
                Object.entries(dev.ports).forEach(([pName, pObj]) => {
                    if (pObj.ip && NetworkEngine.isInterfaceUp(dev, pName)) {
                        if (!pObj.mac) pObj.mac = NetworkEngine.generateMac(dev.type);
                        const age = dev.id === this.device.id ? '-' : '0';
                        out += `Internet  ${pObj.ip.padEnd(17, ' ')}${age.padEnd(11, ' ')}${pObj.mac.padEnd(16, ' ')}ARPA   ${dev.name}(${pName})\n`;
                    }
                });
            });
            return out.trimEnd();
        }

        // show ip ospf neighbor
        if (full.startsWith('ip ospf')) {
            if (this.device.type !== 'router') {
                return '% OSPF is only supported on Router devices.';
            }
            const neighbors = NetworkEngine.getOspfNeighbors(this.device, allDevices, allCables);
            if (neighbors.length === 0) {
                return 'No active OSPF neighbors found. Verify "router ospf" network statements and interface status.';
            }
            let out = 'Neighbor ID     Pri   State           Dead Time   Address         Interface\n';
            neighbors.forEach(n => {
                out += `${n.neighborId.padEnd(16, ' ')}${String(n.pri).padEnd(6, ' ')}${n.state.padEnd(16, ' ')}00:00:38    ${n.address.padEnd(16, ' ')}${n.interface} (${n.hostname})\n`;
            });
            return out.trimEnd();
        }

        // show ip route
        if (full.startsWith('ip ro')) {
            if (this.device.type !== 'router') {
                return `IP routing is not enabled on this device.\nDefault gateway is ${this.device.gateway || 'not set'}`;
            }
            let out = 'Codes: C - connected, L - local, S - static, O - OSPF\n\nGateway of last resort is not set\n\n';
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                if (pObj.ip && NetworkEngine.isInterfaceUp(this.device, pName)) {
                    const cidr = NetworkEngine.maskToCidr(pObj.mask || '255.255.255.0');
                    const net = NetworkEngine.getNetworkAddress(pObj.ip, pObj.mask || '255.255.255.0');
                    const vlanSuffix = pObj.vlan ? ` (dot1Q VLAN ${pObj.vlan})` : '';
                    out += `C    ${net}/${cidr} is directly connected, ${pName}${vlanSuffix}\n`;
                    out += `L    ${pObj.ip}/32 is directly connected, ${pName}\n`;
                }
            }
            const routes = this.device.routes || [];
            for (const r of routes) {
                const cidr = NetworkEngine.maskToCidr(r.mask || '255.255.255.0');
                out += `S    ${r.network}/${cidr} [1/0] via ${r.nextHop}\n`;
            }
            const ospfRoutes = NetworkEngine.computeOspfRoutes(this.device, allDevices, allCables);
            for (const r of ospfRoutes) {
                const cidr = NetworkEngine.maskToCidr(r.mask || '255.255.255.0');
                out += `O    ${r.network}/${cidr} [110/${r.metric}] via ${r.nextHop}, 00:02:14, ${r.outPort}\n`;
            }
            return out.trimEnd();
        }

        // show running-config
        if (full.startsWith('run')) {
            let out = `Building configuration...\n\nCurrent configuration : 1080 bytes\n!\n`;
            out += `hostname ${this.device.name}\n!\n`;
            if (this.device.gateway) {
                out += `ip default-gateway ${this.device.gateway}\n!\n`;
            }
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                out += `interface ${pName}\n`;
                if (this.device.type === 'switch') {
                    if (pObj.mode === 'trunk') {
                        out += ` switchport mode trunk\n`;
                    } else {
                        out += ` switchport mode access\n`;
                        out += ` switchport access vlan ${pObj.vlan || 1}\n`;
                    }
                } else {
                    if (pObj.vlan && pName.includes('.')) {
                        out += ` encapsulation dot1Q ${pObj.vlan}\n`;
                    }
                    if (pObj.ip) {
                        out += ` ip address ${pObj.ip} ${pObj.mask || '255.255.255.0'}\n`;
                    } else {
                        out += ` no ip address\n`;
                    }
                    if (pObj.nat) {
                        out += ` ip nat ${pObj.nat}\n`;
                    }
                }
                out += ` ${pObj.up ? 'no shutdown' : 'shutdown'}\n!\n`;
            }
            if (this.device.type === 'router' && this.device.ospf?.networks?.length > 0) {
                out += `router ospf ${this.device.ospf.processId || 1}\n`;
                for (const n of this.device.ospf.networks) {
                    out += ` network ${n.network} ${n.wildcard} area ${n.area}\n`;
                }
                out += `!\n`;
            }
            if (this.device.type === 'router' && this.device.routes?.length > 0) {
                for (const r of this.device.routes) {
                    out += `ip route ${r.network} ${r.mask} ${r.nextHop}\n`;
                }
                out += `!\n`;
            }
            if (this.device.type === 'router' && this.device.acls?.length > 0) {
                for (const a of this.device.acls) {
                    out += `access-list ${a.id} ${a.action} ${a.protocol} ${a.src} ${a.dst}\n`;
                }
                out += `!\n`;
            }
            out += `end`;
            return out;
        }

        return `% Incomplete or unsupported show command.\nTry: show ip int brief, show ip route, show access-lists, show ip nat translations, show ip ospf neighbor, show vlan brief, show run`;
    }

    handlePingCommand(targetIp) {
        if (!targetIp || !NetworkEngine.isValidIPv4(targetIp)) {
            return '% Usage: ping <valid_ip_address>';
        }

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
            return `Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5) (Destination IP not found in topology)`;
        }

        const sim = NetworkEngine.simulatePing(this.device, targetDev, allDevices, allCables);
        if (window.appState) {
            window.appState.lastPduSimulation = sim;
        }
        if (sim.success) {
            return `Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms\n(${sim.reason})`;
        } else {
            const sym = sim.aclBlocked ? 'U.U.U' : '.....';
            return `Sending 5, 100-byte ICMP Echos to ${targetIp}, timeout is 2 seconds:\n${sym}\nSuccess rate is 0 percent (0/5)\nReason: ${sim.reason}`;
        }
    }

    handleHttpCommand(targetIp) {
        if (!targetIp || !NetworkEngine.isValidIPv4(targetIp)) {
            return '% Usage: http <server_ip_address>';
        }

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
            return `Connecting to http://${targetIp}:80 ... Failed (Host unreachable)`;
        }

        const sim = NetworkEngine.simulateHttp(this.device, targetDev, allDevices, allCables);
        if (window.appState) {
            window.appState.lastPduSimulation = sim;
        }
        if (sim.success) {
            return `GET /index.html HTTP/1.1\nHost: ${targetIp}:80\n\nHTTP/1.1 200 OK\nServer: Cisco-NetSim-Web/4.0 (${targetDev.name})\nContent-Type: text/html\n\n<html><body><h1>Welcome to ${targetDev.name} (${targetIp})</h1></body></html>`;
        } else {
            return `Connecting to http://${targetIp}:80 ... Failed!\nReason: ${sim.reason}`;
        }
    }

    handleTracerouteCommand(targetIp) {
        if (!targetIp || !NetworkEngine.isValidIPv4(targetIp)) {
            return '% Usage: traceroute <valid_ip_address>';
        }

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

        let out = `Type escape sequence to abort.\nTracing the route to ${targetIp}\n\n`;
        if (!targetDev) {
            out += `  1  *  *  *  (Destination host ${targetIp} not found)`;
            return out;
        }

        const sim = NetworkEngine.simulatePing(this.device, targetDev, allDevices, allCables);
        let hopNum = 1;
        if (sim.routerHopIps && sim.routerHopIps.length > 0) {
            for (const rHop of sim.routerHopIps) {
                const rtt = hopNum * 2;
                out += `  ${hopNum}  ${rHop.ip} (${rHop.name})  ${rtt} msec  ${rtt} msec  ${rtt} msec\n`;
                hopNum++;
            }
        }
        if (sim.success) {
            const finalRtt = hopNum * 2;
            out += `  ${hopNum}  ${targetIp} (${targetDev.name})  ${finalRtt} msec  ${finalRtt} msec  ${finalRtt} msec`;
        } else {
            out += `  ${hopNum}  *  *  *  (${sim.reason})`;
        }
        return out;
    }

    getHelpText() {
        const mode = this.device.cliMode;
        if (mode === 'user') {
            return `Available commands in User Exec mode:
  enable                  Turn on privileged commands
  show ip int brief       Summary of interface IP status
  ping <ip>               Send ICMP echo request
  http <ip>               Send TCP Port 80 HTTP GET request
  traceroute <ip>         Trace route to destination IP`;
        } else if (mode === 'privileged') {
            return `Available commands in Privileged Exec mode:
  configure terminal      Enter global configuration mode
  show ip int brief       Brief summary of interface status
  show ip route           Display IP routing table (Connected/Static/OSPF)
  show access-lists       Display Extended ACL firewall rules & hit counts
  show ip nat translations Display active NAT/PAT table
  show ip ospf neighbor   Display OSPF neighbor adjacencies
  show ip arp             Display IP-to-MAC ARP table
  show vlan brief         Display VLAN assignments (Switch)
  show interfaces trunk   Display 802.1Q trunk ports (Switch)
  show mac address-table  Display L2 MAC forwarding table (Switch)
  show run                Display current running configuration
  ping / http / traceroute Test network connectivity`;
        } else if (mode === 'config') {
            return `Available commands in Global Config mode:
  hostname <name>                 Set system network name
  interface <port | port.vlan>    Select interface or 802.1Q sub-interface
  router ospf <process-id>        Enable OSPF dynamic routing process
  access-list 100 <permit|deny> <icmp|tcp|ip> <src> <dst>  Add Firewall ACL rule
  ip nat inside source ...        Enable NAT/PAT Overload on Router
  ip route <net> <mask> <nexthop> Add static route (Router)
  ip default-gateway <ip>         Set default gateway (PC/Server/Switch)
  exit / end                      Exit configuration mode`;
        } else if (mode === 'config-router') {
            return `Available commands in Router OSPF mode:
  network <ip> <wildcard> area <id> Advertise subnet in OSPF
  exit / end                        Exit router configuration`;
        } else if (mode === 'config-if') {
            return `Available commands in Interface Config mode:
  ip address <ip> <mask>          Set IPv4 address and subnet mask
  ip address dhcp                 Acquire IPv4 address via DHCP
  ip nat <inside|outside>         Set NAT interface role (Router)
  encapsulation dot1Q <vlan-id>   Set 802.1Q VLAN tag on Router sub-interface
  switchport mode <access|trunk>  Set switchport L2 mode (Access or 802.1Q Trunk)
  switchport access vlan <1-4094> Set access VLAN ID (Switch port)
  no shutdown / shutdown          Enable or disable this interface`;
        }
        return '';
    }
}

window.CiscoCLI = CiscoCLI;
