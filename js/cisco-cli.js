/**
 * NetSim Touch v5.0 Academy Edition - Complete Cisco IOS CLI Simulator Engine
 * Supports 100% of University Network Course Syllabus Commands:
 * - Hierarchical Modes: User (>), Privileged (#), Global Config (config#), Interface (config-if#),
 *   Sub-interface (config-subif#), VLAN Config (config-vlan#), Line Config (config-line#), Router OSPF (config-router#)
 * - Basic Switch & Security: hostname, enable secret, service password-encryption, banner motd,
 *   line console 0, line vty 0 4, password, login, transport input ssh, crypto key generate rsa
 * - VLANs & Inter-VLAN: vlan <id> + name <name>, switchport mode access/trunk, switchport trunk native vlan <id>,
 *   interface vlan <id> (SVI), ip routing (Layer 3 Switch), encapsulation dot1Q <id> (Router-on-a-Stick)
 * - IPv4 & IPv6: ip address, ip address dhcp, ipv6 unicast-routing, ipv6 address <addr/prefix|autoconfig>, ping ipv6
 * - Routing: ip route (Static/Default Route), router ospf 1 + network <ip> <wildcard> area 0
 * - Security & WAN: Standard ACL (1-99), Extended ACL (100-199), ip access-group <id> in/out,
 *   Static NAT (ip nat inside source static) & PAT Overload (ip nat inside source list 1 interface ... overload)
 */

class CiscoCLI {
    constructor(device, onStateChange = null) {
        this.device = device;
        if (!this.device.routes) this.device.routes = [];
        if (!this.device.acls) this.device.acls = [];
        if (!this.device.staticNat) this.device.staticNat = [];
        if (!this.device.natTranslations) this.device.natTranslations = [];
        if (!this.device.vlans) this.device.vlans = { 1: 'default' };
        if (!this.device.ospf) this.device.ospf = { processId: null, networks: [] };
        if (!this.device.dhcpPools) this.device.dhcpPools = [];
        if (!this.device.dhcpExcluded) this.device.dhcpExcluded = [];
        if (!this.device.dhcpBindings) this.device.dhcpBindings = [];
        if (!this.device.arpCache) this.device.arpCache = {};
        if (!this.device.macTable) this.device.macTable = [];
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
            case 'config-vlan': return `${name}(config-vlan)#`;
            case 'config-line': return `${name}(config-line)#`;
            case 'config-router': return `${name}(config-router)#`;
            case 'config-dhcp': return `${name}(dhcp-config)#`;
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
                { label: 'arp -a', cmd: 'arp -a', run: true },
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
            if (isRouter || this.device.ipRouting) {
                chips.push(
                    { label: 'show ip route', cmd: 'show ip route', run: true },
                    { label: 'show ipv6 int br', cmd: 'show ipv6 int brief', run: true },
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
                { label: 'show ip arp', cmd: 'show ip arp', run: true },
                { label: 'show run', cmd: 'show running-config', run: true },
                { label: 'ping ...', cmd: 'ping ', run: false },
                { label: 'write', cmd: 'write', run: true }
            );
            return chips;
        } else if (mode === 'config') {
            const chips = [];
            Object.keys(this.device.ports).forEach(p => {
                chips.push({ label: `int ${p}`, cmd: `interface ${p}`, run: true });
            });
            if (isSwitch) {
                chips.push(
                    { label: 'vlan 10', cmd: 'vlan 10', run: true },
                    { label: 'int vlan 1', cmd: 'interface vlan 1', run: true },
                    { label: 'ip routing (L3 SW)', cmd: 'ip routing', run: true },
                    { label: 'enable secret class', cmd: 'enable secret class', run: true },
                    { label: 'line vty 0 4', cmd: 'line vty 0 4', run: true }
                );
            } else if (isRouter) {
                chips.push(
                    { label: 'ip route ...', cmd: 'ip route ', run: false },
                    { label: 'router ospf 1', cmd: 'router ospf 1', run: true },
                    { label: 'ipv6 unicast-routing', cmd: 'ipv6 unicast-routing', run: true },
                    { label: 'access-list 100 ...', cmd: 'access-list 100 deny icmp any any', run: false },
                    { label: 'ip nat overload', cmd: 'ip nat inside source list 1 interface Gig0/1 overload', run: true }
                );
            } else {
                chips.push({ label: 'ip default-gw ...', cmd: 'ip default-gateway ', run: false });
            }
            chips.push(
                { label: 'hostname ...', cmd: 'hostname ', run: false },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            );
            return chips;
        } else if (mode === 'config-vlan') {
            return [
                { label: 'name Sales', cmd: 'name Sales', run: true },
                { label: 'name Engineering', cmd: 'name Engineering', run: true },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            ];
        } else if (mode === 'config-line') {
            return [
                { label: 'password cisco', cmd: 'password cisco', run: true },
                { label: 'login', cmd: 'login', run: true },
                { label: 'transport input ssh', cmd: 'transport input ssh', run: true },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            ];
        } else if (mode === 'config-if') {
            const chips = [];
            const isSubIf = this.device.cliCurrentIf && this.device.cliCurrentIf.includes('.');
            const isSvi = this.device.cliCurrentIf && this.device.cliCurrentIf.toLowerCase().startsWith('vlan');
            if (isSwitch && !isSvi) {
                chips.push(
                    { label: 'mode trunk', cmd: 'switchport mode trunk', run: true },
                    { label: 'mode access', cmd: 'switchport mode access', run: true },
                    { label: 'vlan 10', cmd: 'switchport access vlan 10', run: true },
                    { label: 'vlan 20', cmd: 'switchport access vlan 20', run: true },
                    { label: 'native vlan 99', cmd: 'switchport trunk native vlan 99', run: true }
                );
            } else {
                if (isSubIf) {
                    const subVlan = this.device.cliCurrentIf.split('.')[1] || '10';
                    chips.push({ label: `encap dot1Q ${subVlan}`, cmd: `encapsulation dot1Q ${subVlan}`, run: true });
                }
                chips.push(
                    { label: 'ip add ...', cmd: 'ip address ', run: false },
                    { label: 'ipv6 add ...', cmd: 'ipv6 address 2001:db8:10::1/64', run: false }
                );
                if (isRouter) {
                    chips.push(
                        { label: 'ip nat inside', cmd: 'ip nat inside', run: true },
                        { label: 'ip nat outside', cmd: 'ip nat outside', run: true },
                        { label: 'ip access-group 100 in', cmd: 'ip access-group 100 in', run: true }
                    );
                }
                if (this.device.type === 'pc' || this.device.type === 'server') {
                    chips.push(
                        { label: 'ip add dhcp', cmd: 'ip address dhcp', run: true },
                        { label: 'ipv6 autoconfig (SLAAC)', cmd: 'ipv6 address autoconfig', run: true }
                    );
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
                { label: 'router-id ...', cmd: 'router-id 1.1.1.1', run: false },
                { label: 'exit', cmd: 'exit', run: true },
                { label: 'end', cmd: 'end', run: true }
            ];
        } else if (mode === 'config-dhcp') {
            return [
                { label: 'network ...', cmd: 'network 192.168.10.0 255.255.255.0', run: false },
                { label: 'default-router ...', cmd: 'default-router 192.168.10.1', run: false },
                { label: 'dns-server 8.8.8.8', cmd: 'dns-server 8.8.8.8', run: true },
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
                'enable', 'ping ', 'http ', 'traceroute ', 'arp -a', 'show ip interface brief', 'show vlan brief', 'help'
            ],
            'privileged': [
                'configure terminal', 'show ip interface brief', 'show ipv6 interface brief', 'show ip route', 'show access-lists',
                'show ip nat translations', 'show ip ospf neighbor', 'show ip arp', 'show ip dhcp binding', 'show ip dhcp pool',
                'show running-config', 'show vlan brief', 'show interfaces trunk', 'show mac address-table', 'ping ', 'http ',
                'traceroute ', 'clear arp-cache', 'clear ip nat translations *', 'write', 'disable', 'clear', 'exit'
            ],
            'config': [
                'interface ', 'interface vlan ', 'vlan ', 'hostname ', 'enable secret ', 'service password-encryption',
                'banner motd #Authorized Access Only#', 'line console 0', 'line vty 0 4', 'crypto key generate rsa',
                'ip routing', 'ipv6 unicast-routing', 'ip route ', 'no ip route ', 'ip default-gateway ',
                'ip dhcp excluded-address ', 'ip dhcp pool ', 'router ospf 1', 'access-list 100 ',
                'ip nat inside source static ', 'ip nat inside source list 1 interface Gig0/1 overload', 'exit', 'end'
            ],
            'config-vlan': ['name ', 'exit', 'end'],
            'config-line': ['password ', 'login', 'login local', 'transport input ssh', 'exit', 'end'],
            'config-if': [
                'ip address ', 'ip address dhcp', 'ipv6 address ', 'ipv6 address autoconfig',
                'ip nat inside', 'ip nat outside', 'ip access-group 100 in', 'ip ospf cost ',
                'encapsulation dot1Q ', 'switchport mode trunk', 'switchport mode access',
                'switchport access vlan ', 'switchport trunk native vlan ', 'no shutdown', 'shutdown', 'exit', 'end'
            ],
            'config-router': [
                'network ', 'no network ', 'router-id ', 'exit', 'end'
            ],
            'config-dhcp': [
                'network ', 'default-router ', 'dns-server ', 'domain-name ', 'exit', 'end'
            ]
        };

        const lower = trimmed.toLowerCase();
        const shorthandMap = {
            'en': 'enable',
            'conf': 'configure terminal',
            'conf t': 'configure terminal',
            'sh ip int': 'show ip interface brief',
            'sh ip int br': 'show ip interface brief',
            'sh ipv6 int br': 'show ipv6 interface brief',
            'sh ip ro': 'show ip route',
            'sh ip os': 'show ip ospf neighbor',
            'sh ip na': 'show ip nat translations',
            'sh ip nat tr': 'show ip nat translations',
            'sh ip dh': 'show ip dhcp binding',
            'sh ip dhcp bi': 'show ip dhcp binding',
            'sh acc': 'show access-lists',
            'sh run': 'show running-config',
            'sh vl': 'show vlan brief',
            'sh mac': 'show mac address-table',
            'sh int tr': 'show interfaces trunk',
            'sw m t': 'switchport mode trunk',
            'sw m a': 'switchport mode access',
            'sw a v': 'switchport access vlan ',
            'sw t n v': 'switchport trunk native vlan ',
            'encap': 'encapsulation dot1Q ',
            'no sh': 'no shutdown',
            'ip add': 'ip address ',
            'ipv6 add': 'ipv6 address ',
            'ip def': 'ip default-gateway ',
            'ro os': 'router ospf 1',
            'en sec': 'enable secret ',
            'serv pass': 'service password-encryption',
            'trans in ssh': 'transport input ssh'
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

        const out = this._executeInternal(input);

        if (window.AcademyTutor && typeof window.AcademyTutor.onCliCommandExecuted === 'function') {
            window.AcademyTutor.onCliCommandExecuted(this.device, input, out);
        }

        return out;
    }

    _executeInternal(input) {
        const tokens = input.split(/\s+/);
        const cmd = tokens[0].toLowerCase();
        const arg1 = (tokens[1] || '').toLowerCase();
        const arg2 = (tokens[2] || '').toLowerCase();
        const arg3 = (tokens[3] || '').toLowerCase();

        if (cmd === 'clear' && !arg1) {
            this.device.cliHistory = '';
            return '__CLEARED__';
        }
        if (cmd === 'clear' && (arg1.startsWith('arp') || (arg1 === 'ip' && arg2 === 'arp'))) {
            this.device.arpCache = {};
            if (this.onStateChange) this.onStateChange();
            return '%ARP-6-CACHE_CLEARED: IP ARP cache cleared on all interfaces.';
        }
        if (cmd === 'clear' && arg1 === 'ip' && arg2 === 'nat') {
            this.device.natTranslations = [];
            if (this.onStateChange) this.onStateChange();
            return '%NAT-6-CLEARED: Dynamic NAT/PAT translation table cleared.';
        }
        if (cmd === 'clear' && arg1 === 'ip' && arg2 === 'dhcp') {
            this.device.dhcpBindings = [];
            if (this.onStateChange) this.onStateChange();
            return '%DHCP-6-CLEARED: DHCP lease binding table cleared.';
        }
        if (cmd === 'clear' && arg1.startsWith('mac')) {
            this.device.macTable = [];
            if (this.onStateChange) this.onStateChange();
            return '%SW-6-MAC_CLEARED: Dynamic MAC address table cleared.';
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
            if (cmd === 'arp') {
                return this.handleShowCommand(['ip', 'arp']);
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

        // Cisco IOS Sub-Configuration Mode Automatic Transition:
        // Allows typing `interface ...`, `router ospf ...`, `vlan ...`, `line ...`, `access-list ...`,
        // `ip route ...`, `ip dhcp ...`, or `ip nat inside source ...` directly from any config-* sub-mode!
        if (['config-if', 'config-vlan', 'config-line', 'config-router', 'config-dhcp'].includes(this.device.cliMode)) {
            const isGlobalTransition =
                cmd === 'interface' || cmd === 'int' ||
                cmd === 'vlan' || cmd === 'line' || cmd === 'router' ||
                cmd === 'hostname' || cmd === 'access-list' ||
                (cmd === 'ip' && (arg1 === 'route' || arg1 === 'dhcp' || arg1 === 'default-gateway' || (arg1 === 'nat' && arg2 === 'inside' && arg3 === 'source')));
            if (isGlobalTransition) {
                this.device.cliMode = 'config';
                this.device.cliCurrentIf = null;
                this.device.cliCurrentDhcpPool = null;
            }
        }

        // ================= VLAN CONFIG MODE (config-vlan)# =================
        if (this.device.cliMode === 'config-vlan') {
            if (cmd === 'exit' || cmd === 'ex') {
                this.device.cliMode = 'config';
                return '';
            }
            if (cmd === 'end') {
                this.device.cliMode = 'privileged';
                return '';
            }
            if (cmd === 'name') {
                const vName = tokens[1] || `VLAN${this.device.cliCurrentVlan}`;
                this.device.vlans = this.device.vlans || { 1: 'default' };
                this.device.vlans[this.device.cliCurrentVlan] = vName;
                if (this.onStateChange) this.onStateChange();
                return `%VLAN-6-NAME: VLAN ${this.device.cliCurrentVlan} named "${vName}"`;
            }
            if (cmd === 'do') {
                return this.executeInPrivilegedContext(tokens.slice(1).join(' '));
            }
            return `% Usage in VLAN mode: name <vlan-name> or exit`;
        }

        // ================= LINE CONFIG MODE (config-line)# =================
        if (this.device.cliMode === 'config-line') {
            if (cmd === 'exit' || cmd === 'ex') {
                this.device.cliMode = 'config';
                return '';
            }
            if (cmd === 'end') {
                this.device.cliMode = 'privileged';
                return '';
            }
            if (cmd === 'password') {
                this.device.linePassword = tokens[1] || 'cisco';
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'login') {
                this.device.lineLogin = arg1 === 'local' ? 'local' : true;
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'transport' && arg1 === 'input') {
                this.device.sshEnabled = (arg2 === 'ssh' || arg2 === 'all');
                if (this.onStateChange) this.onStateChange();
                return `%LINE-6-TRANSPORT: VTY transport input set to ${(arg2 || 'ssh').toUpperCase()}`;
            }
            if (cmd === 'exec-timeout') {
                return '';
            }
            if (cmd === 'do') {
                return this.executeInPrivilegedContext(tokens.slice(1).join(' '));
            }
            return `% Usage in Line mode: password <pw>, login, transport input ssh, exit`;
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
            // Basic Security: enable secret / enable password
            if (cmd === 'enable' && (arg1 === 'secret' || arg1 === 'password')) {
                if (!tokens[2]) return '% Usage: enable secret <password>';
                this.device.enableSecret = tokens[2];
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            // service password-encryption
            if (cmd === 'service' && arg1.startsWith('password')) {
                this.device.passwordEncryption = true;
                if (this.onStateChange) this.onStateChange();
                return '%SEC-6-PASS_ENCRYPT: Password encryption service enabled';
            }
            // banner motd
            if (cmd === 'banner' && arg1 === 'motd') {
                this.device.bannerMotd = tokens.slice(2).join(' ').replace(/^[^a-zA-Z0-9ก-๙]+|[^a-zA-Z0-9ก-๙!]+$/g, '');
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            // line console 0 / line vty 0 4
            if (cmd === 'line' && (arg1.startsWith('con') || arg1.startsWith('vty'))) {
                this.device.cliMode = 'config-line';
                this.device.cliCurrentLine = tokens.slice(1).join(' ');
                return '';
            }
            // SSH setup: ip domain-name, username, crypto key generate rsa
            if (cmd === 'ip' && arg1 === 'domain-name') {
                this.device.domainName = tokens[2] || 'cisco.local';
                return '';
            }
            if (cmd === 'username') {
                this.device.sshUser = tokens[1] || 'admin';
                return '';
            }
            if (cmd === 'crypto' && arg1 === 'key' && arg2 === 'generate') {
                this.device.sshEnabled = true;
                if (this.onStateChange) this.onStateChange();
                return `The name for the keys will be: ${this.device.name}.${this.device.domainName || 'cisco.local'}\nGenerating 1024 bit RSA keys, keys will be non-exportable...[OK]\n%SSH-5-ENABLED: SSH 1.99/2.0 has been enabled`;
            }
            // VLAN creation: vlan <id>
            if (cmd === 'vlan') {
                if (this.device.type !== 'switch') return '% VLAN database configuration is only supported on Switches.';
                const vId = parseInt(tokens[1], 10);
                if (isNaN(vId) || vId < 1 || vId > 4094) return '% Usage: vlan <1-4094>';
                this.device.vlans = this.device.vlans || { 1: 'default' };
                if (!this.device.vlans[vId]) {
                    this.device.vlans[vId] = `VLAN${String(vId).padStart(4, '0')}`;
                }
                this.device.cliMode = 'config-vlan';
                this.device.cliCurrentVlan = vId;
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            // Layer 3 Switch routing: ip routing
            if (cmd === 'ip' && arg1 === 'routing') {
                this.device.ipRouting = true;
                if (this.onStateChange) this.onStateChange();
                return `%MLS-6-IPROUTING: Layer 3 Switch IPv4 Inter-VLAN Routing enabled on ${this.device.name}`;
            }
            // IPv6 Unicast Routing: ipv6 unicast-routing
            if (cmd === 'ipv6' && arg1.startsWith('unicast')) {
                this.device.ipv6Routing = true;
                if (this.onStateChange) this.onStateChange();
                return `%IPV6-6-ENABLED: IPv6 Unicast Routing enabled on ${this.device.name}`;
            }
            // Interface / Sub-interface / SVI (interface vlan X)
            if (cmd === 'interface' || cmd === 'int') {
                if (!tokens[1]) return '% Incomplete command. Usage: interface <Gig0/0 | Gig0/0.10 | Fa0/1 | vlan 10>';
                const rawIf = tokens.slice(1).join('');

                // Handle SVI: interface vlan <id>
                if (rawIf.toLowerCase().startsWith('vlan')) {
                    const vlanNum = parseInt(rawIf.replace(/vlan/i, ''), 10);
                    if (isNaN(vlanNum) || vlanNum < 1 || vlanNum > 4094) {
                        return '% Invalid VLAN interface. Example: interface vlan 10';
                    }
                    const sviName = `Vlan${vlanNum}`;
                    if (!this.device.ports[sviName]) {
                        this.device.ports[sviName] = {
                            ip: '',
                            mask: '255.255.255.0',
                            up: true,
                            vlan: vlanNum,
                            isSvi: true,
                            mac: NetworkEngine.generateMac(this.device.type)
                        };
                    }
                    this.device.cliMode = 'config-if';
                    this.device.cliCurrentIf = sviName;
                    if (this.onStateChange) this.onStateChange();
                    return `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${sviName}, changed state to up`;
                }

                // Handle Router 802.1Q Sub-interface: interface Gig0/0.10
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
                if (!NetworkEngine.isL3Device(this.device)) {
                    return '% OSPF routing requires a Router or Layer 3 Switch (enable "ip routing" first).';
                }
                const pid = parseInt(tokens[2] || '1', 10) || 1;
                this.device.ospf = this.device.ospf || { processId: pid, networks: [] };
                this.device.ospf.processId = pid;
                this.device.cliMode = 'config-router';
                return '';
            }
            // Standard ACL (1-99) & Extended ACL (100-199)
            if (cmd === 'access-list') {
                if (this.device.type !== 'router') {
                    return '% Access-lists are only supported on Router devices.';
                }
                const aclId = parseInt(tokens[1], 10);
                const action = (tokens[2] || '').toLowerCase();
                if (isNaN(aclId) || aclId < 1 || aclId > 199 || !['permit', 'deny'].includes(action)) {
                    return '% Usage:\n  Standard ACL (1-99):  access-list <1-99> <permit|deny> <src-ip|host ip|any> [wildcard]\n  Extended ACL (100+):  access-list <100-199> <permit|deny> <icmp|tcp|udp|ip> <src> [<src-wildcard>] <dst> [<dst-wildcard>] [eq <port>]';
                }

                // Standard ACL (1-99): access-list 1 permit|deny <src|any|host X> [wildcard]
                if (aclId >= 1 && aclId <= 99) {
                    let src = (tokens[3] || 'any').toLowerCase();
                    let srcWildcard = tokens[4] || '0.0.0.0';
                    if (src === 'any') {
                        srcWildcard = '255.255.255.255';
                    } else if (src === 'host') {
                        src = tokens[4] || 'any';
                        srcWildcard = '0.0.0.0';
                    } else if (!NetworkEngine.isValidIPv4(src)) {
                        return '% Invalid source IP address in Standard ACL.';
                    } else if (!tokens[4]) {
                        srcWildcard = '0.0.0.0';
                    } else if (!NetworkEngine.isValidIPv4(srcWildcard)) {
                        return '% Invalid wildcard mask in Standard ACL.';
                    }
                    this.device.acls = this.device.acls || [];
                    this.device.acls.push({
                        id: aclId,
                        action,
                        protocol: 'ip',
                        src,
                        srcWildcard,
                        dst: 'any',
                        dstWildcard: '255.255.255.255',
                        hits: 0
                    });
                    if (this.onStateChange) this.onStateChange();
                    return `%SEC-6-ACL_ADDED: Standard IP access list ${aclId} (${action} ${src} ${srcWildcard}) active`;
                }

                // Extended ACL (100-199)
                const proto = (tokens[3] || 'ip').toLowerCase();
                if (!['icmp', 'tcp', 'udp', 'ip', 'http'].includes(proto)) {
                    return '% Usage: access-list <100-199> <permit|deny> <icmp|tcp|udp|ip> <src> [<src-wildcard>] <dst> [<dst-wildcard>] [eq <port>]';
                }

                const parsedAcl = this._parseExtendedAclArgs(tokens.slice(4), proto);
                if (!parsedAcl.valid) {
                    return `% ${parsedAcl.error}`;
                }

                this.device.acls = this.device.acls || [];
                const ruleObj = {
                    id: aclId,
                    action,
                    protocol: proto === 'http' ? 'tcp' : proto,
                    src: parsedAcl.src,
                    srcWildcard: parsedAcl.srcWildcard,
                    dst: parsedAcl.dst,
                    dstWildcard: parsedAcl.dstWildcard,
                    hits: 0
                };
                if (parsedAcl.dstPort) {
                    ruleObj.dstPort = parsedAcl.dstPort;
                } else if (proto === 'http') {
                    ruleObj.dstPort = 80;
                }
                this.device.acls.push(ruleObj);
                if (this.onStateChange) this.onStateChange();
                const portNote = ruleObj.dstPort ? ` eq ${ruleObj.dstPort}` : '';
                return `%SEC-6-ACL_ADDED: Extended IP access list ${aclId} (${action} ${ruleObj.protocol} ${ruleObj.src} -> ${ruleObj.dst}${portNote}) active`;
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
            // DHCP Server: ip dhcp excluded-address & ip dhcp pool
            if (cmd === 'ip' && arg1 === 'dhcp') {
                if (!NetworkEngine.isL3Device(this.device)) {
                    return '% DHCP server configuration is only supported on Routers or Layer 3 Switches.';
                }
                if (arg2.startsWith('excluded')) {
                    const lowIp = tokens[3];
                    const highIp = tokens[4] || lowIp;
                    if (!NetworkEngine.isValidIPv4(lowIp) || !NetworkEngine.isValidIPv4(highIp)) {
                        return '% Usage: ip dhcp excluded-address <low-ip> [<high-ip>]';
                    }
                    this.device.dhcpExcluded = this.device.dhcpExcluded || [];
                    this.device.dhcpExcluded.push({ low: lowIp, high: highIp });
                    if (this.onStateChange) this.onStateChange();
                    return `%DHCPD-6-EXCLUDED: Excluded IP range ${lowIp} - ${highIp} registered`;
                }
                if (arg2 === 'pool') {
                    const poolName = tokens[3];
                    if (!poolName) return '% Usage: ip dhcp pool <pool-name>';
                    this.device.dhcpPools = this.device.dhcpPools || [];
                    let pool = this.device.dhcpPools.find(p => p.name === poolName);
                    if (!pool) {
                        pool = { name: poolName, network: '', mask: '255.255.255.0', defaultRouter: '', dnsServer: '' };
                        this.device.dhcpPools.push(pool);
                    }
                    this.device.cliCurrentDhcpPool = poolName;
                    this.device.cliMode = 'config-dhcp';
                    if (this.onStateChange) this.onStateChange();
                    return '';
                }
                return '% Usage: ip dhcp pool <name> or ip dhcp excluded-address <low-ip> [<high-ip>]';
            }
            if (cmd === 'no' && arg1 === 'ip' && arg2 === 'dhcp') {
                if (arg3.startsWith('excluded')) {
                    const lowIp = tokens[4];
                    if (!lowIp) {
                        this.device.dhcpExcluded = [];
                    } else {
                        this.device.dhcpExcluded = (this.device.dhcpExcluded || []).filter(r => r.low !== lowIp);
                    }
                    if (this.onStateChange) this.onStateChange();
                    return '';
                }
                if (arg3 === 'pool') {
                    const poolName = tokens[4];
                    this.device.dhcpPools = (this.device.dhcpPools || []).filter(p => p.name !== poolName);
                    if (this.onStateChange) this.onStateChange();
                    return '';
                }
            }
            // Static NAT & Dynamic NAT / PAT Overload
            if (cmd === 'ip' && arg1 === 'nat') {
                if (this.device.type !== 'router') return '% NAT is only supported on Router devices.';
                if (arg2 === 'inside' && arg3 === 'source' && (tokens[4] || '').toLowerCase() === 'static') {
                    const localIp = tokens[5];
                    const globalIp = tokens[6];
                    if (!NetworkEngine.isValidIPv4(localIp) || !NetworkEngine.isValidIPv4(globalIp)) {
                        return '% Usage: ip nat inside source static <inside-local-ip> <inside-global-ip>';
                    }
                    this.device.staticNat = this.device.staticNat || [];
                    const existing = this.device.staticNat.find(s => s.insideLocal === localIp);
                    if (existing) {
                        existing.insideGlobal = globalIp;
                    } else {
                        this.device.staticNat.push({ insideLocal: localIp, insideGlobal: globalIp });
                    }
                    this.device.natEnabled = true;
                    this.device.natTranslations = this.device.natTranslations || [];
                    this.device.natTranslations.unshift({
                        proto: '---',
                        insideGlobal: globalIp,
                        insideLocal: localIp,
                        outsideLocal: '---',
                        outsideGlobal: '---'
                    });
                    if (this.onStateChange) this.onStateChange();
                    return `%NAT-6-STATIC: Static NAT mapping ${localIp} -> ${globalIp} configured`;
                }
                if (arg2 === 'inside' && arg3 === 'source' && (tokens[4] || '').toLowerCase() === 'list') {
                    const aclId = parseInt(tokens[5], 10);
                    const ifKeyword = (tokens[6] || '').toLowerCase();
                    const rawOutIf = tokens[7];
                    const overloadFlag = (tokens[8] || 'overload').toLowerCase() === 'overload';
                    if (isNaN(aclId) || ifKeyword !== 'interface' || !rawOutIf) {
                        return '% Usage: ip nat inside source list <acl-id> interface <out-interface> overload';
                    }
                    const matchedOutIf = this.findMatchingPort(rawOutIf) || rawOutIf;
                    this.device.natRule = {
                        aclId,
                        outInterface: matchedOutIf,
                        overload: overloadFlag
                    };
                    this.device.natEnabled = true;
                    if (this.onStateChange) this.onStateChange();
                    return `%NAT-6-PAT_OVERLOAD: PAT Overload bound to ACL ${aclId} -> outside interface ${matchedOutIf}`;
                }
                this.device.natEnabled = true;
                if (this.onStateChange) this.onStateChange();
                return `%NAT-6-ENABLED: Dynamic NAT/PAT Overload enabled on ${this.device.name}`;
            }
            if (cmd === 'no' && arg1 === 'ip' && arg2 === 'nat') {
                this.device.natEnabled = false;
                this.device.natRule = null;
                this.device.staticNat = [];
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
                if (!NetworkEngine.isL3Device(this.device)) {
                    return '% IP routing is only supported on Routers or Layer 3 Switches.';
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

        // ================= DHCP POOL CONFIG MODE (dhcp-config)# =================
        if (this.device.cliMode === 'config-dhcp') {
            if (cmd === 'exit' || cmd === 'ex') {
                this.device.cliMode = 'config';
                this.device.cliCurrentDhcpPool = null;
                return '';
            }
            if (cmd === 'end') {
                this.device.cliMode = 'privileged';
                this.device.cliCurrentDhcpPool = null;
                return '';
            }
            const pool = (this.device.dhcpPools || []).find(p => p.name === this.device.cliCurrentDhcpPool);
            if (!pool) {
                this.device.cliMode = 'config';
                return '% No active DHCP pool.';
            }
            if (cmd === 'network' || cmd === 'net') {
                const netIp = tokens[1];
                const mask = tokens[2] || '255.255.255.0';
                if (!NetworkEngine.isValidIPv4(netIp) || !NetworkEngine.isValidMask(mask)) {
                    return '% Usage: network <network-number> <subnet-mask>';
                }
                pool.network = NetworkEngine.getNetworkAddress(netIp, mask);
                pool.mask = mask;
                if (this.onStateChange) this.onStateChange();
                return `%DHCPD-6-POOL_NET: Pool "${pool.name}" network set to ${pool.network} ${pool.mask}`;
            }
            if (cmd === 'default-router' || cmd === 'def') {
                const gw = tokens[1];
                if (!NetworkEngine.isValidIPv4(gw)) {
                    return '% Usage: default-router <gateway-ip>';
                }
                pool.defaultRouter = gw;
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'dns-server' || cmd === 'dns') {
                const dns = tokens[1];
                if (!NetworkEngine.isValidIPv4(dns)) {
                    return '% Usage: dns-server <dns-ip>';
                }
                pool.dnsServer = dns;
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'domain-name') {
                pool.domainName = tokens[1] || 'local';
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            if (cmd === 'do') {
                return this.executeInPrivilegedContext(tokens.slice(1).join(' '));
            }
            return `% Usage in DHCP Pool mode: network <ip> <mask>, default-router <ip>, dns-server <ip>, exit`;
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
            if (cmd === 'router-id') {
                const rid = tokens[1];
                if (!NetworkEngine.isValidIPv4(rid)) {
                    return '% Usage: router-id <A.B.C.D>';
                }
                this.device.ospf = this.device.ospf || { processId: 1, networks: [] };
                this.device.ospf.routerId = rid;
                if (this.onStateChange) this.onStateChange();
                return `%OSPF-5-ROUTERID: OSPF process ${this.device.ospf.processId || 1} router-id set to ${rid}`;
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
                const existingIdx = this.device.ospf.networks.findIndex(n => n.network === normalizedNet && n.wildcard === wildcard);
                if (existingIdx >= 0) {
                    this.device.ospf.networks[existingIdx].area = isNaN(areaId) ? 0 : areaId;
                } else {
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
            if (cmd === 'description' || cmd === 'desc') {
                portObj.description = tokens.slice(1).join(' ');
                return '';
            }
            // ip ospf cost <1-65535>
            if (cmd === 'ip' && arg1 === 'ospf' && arg2 === 'cost') {
                const cost = parseInt(tokens[3], 10);
                if (isNaN(cost) || cost < 1 || cost > 65535) {
                    return '% Usage: ip ospf cost <1-65535>';
                }
                portObj.ospfCost = cost;
                if (this.onStateChange) this.onStateChange();
                return `%OSPF-6-COST: Interface ${currentPort} OSPF cost set to ${cost}`;
            }
            // ip access-group <id> <in|out>
            if (cmd === 'ip' && arg1 === 'access-group') {
                const aclId = parseInt(tokens[2], 10) || 100;
                const dir = (tokens[3] || 'in').toLowerCase();
                if (!['in', 'out'].includes(dir)) {
                    return '% Usage: ip access-group <acl-id> <in|out>';
                }
                portObj.aclGroup = { id: aclId, direction: dir };
                if (dir === 'in') portObj.aclIn = aclId;
                if (dir === 'out') portObj.aclOut = aclId;
                if (this.onStateChange) this.onStateChange();
                return `%SEC-6-ACL_BOUND: Access-list ${aclId} applied ${dir.toUpperCase()}BOUND on ${currentPort}`;
            }
            if (cmd === 'no' && arg1 === 'ip' && arg2 === 'access-group') {
                const dir = (tokens[4] || '').toLowerCase();
                if (dir === 'in') delete portObj.aclIn;
                else if (dir === 'out') delete portObj.aclOut;
                else {
                    delete portObj.aclIn;
                    delete portObj.aclOut;
                }
                delete portObj.aclGroup;
                if (this.onStateChange) this.onStateChange();
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
            if (cmd === 'no' && arg1 === 'ip' && arg2 === 'nat') {
                delete portObj.nat;
                if (this.onStateChange) this.onStateChange();
                return '';
            }
            // IPv6 Interface Configuration: ipv6 address <addr/prefix | autoconfig>
            if (cmd === 'ipv6' && (arg1 === 'address' || arg1 === 'add')) {
                if (arg2 === 'autoconfig' || arg2 === 'dhcp') {
                    const randHost = Math.floor(10 + Math.random() * 89);
                    portObj.ipv6 = `2001:db8:10::${randHost}/64`;
                    portObj.ipv6LinkLocal = `FE80::${randHost}`;
                    portObj.up = true;
                    if (this.onStateChange) this.onStateChange();
                    return `%IPV6-6-SLAAC: Interface ${currentPort} autoconfigured Global Unicast ${portObj.ipv6} via SLAAC Router Advertisement`;
                }
                const v6 = tokens[2];
                if (!v6 || !NetworkEngine.isValidIPv6(v6)) {
                    return '% Invalid IPv6 address. Example: ipv6 address 2001:db8:10::1/64';
                }
                if (arg3 === 'link-local') {
                    portObj.ipv6LinkLocal = v6;
                } else {
                    portObj.ipv6 = v6.includes('/') ? v6 : `${v6}/64`;
                }
                if (this.onStateChange) this.onStateChange();
                return '';
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
                    this.device.vlans = this.device.vlans || { 1: 'default' };
                    if (!this.device.vlans[vlanId]) {
                        this.device.vlans[vlanId] = `VLAN${String(vlanId).padStart(4, '0')}`;
                    }
                    if (this.onStateChange) this.onStateChange();
                    return `% Access VLAN on ${currentPort} set to VLAN ${vlanId}`;
                }
                if (arg1 === 'trunk' && arg2 === 'native' && arg3 === 'vlan') {
                    const nativeId = parseInt(tokens[4], 10);
                    if (isNaN(nativeId) || nativeId < 1 || nativeId > 4094) {
                        return '% Usage: switchport trunk native vlan <1-4094>';
                    }
                    portObj.nativeVlan = nativeId;
                    if (this.onStateChange) this.onStateChange();
                    return `%TRUNK-6-NATIVE: Native VLAN on ${currentPort} set to VLAN ${nativeId}`;
                }
                if (arg1 === 'trunk' && arg2 === 'allowed' && arg3 === 'vlan') {
                    portObj.allowedVlans = tokens[4] || 'all';
                    if (this.onStateChange) this.onStateChange();
                    return '';
                }
                return '% Usage: switchport mode <access|trunk>, switchport access vlan <id>, or switchport trunk native vlan <id>';
            }
            if (cmd === 'ip' && (arg1 === 'address' || arg1 === 'add')) {
                if (this.device.type === 'switch' && !portObj.isSvi) {
                    return '% Layer 2 physical switch port cannot be assigned an IP address directly. Use "interface vlan 1" (SVI) instead.';
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

    /**
     * Parse Extended ACL source/destination address + wildcard + optional eq port
     * Supports:
     *   any
     *   host <ip>
     *   <ip> <wildcard>
     *   <ip> (shorthand host IP when no wildcard is provided)
     */
    _parseExtendedAclArgs(args, proto) {
        if (!args || args.length === 0) {
            return { valid: false, error: 'Missing source and destination in Extended ACL.' };
        }
        let idx = 0;

        const parseEndpoint = (isSource) => {
            const tok = (args[idx] || '').toLowerCase();
            if (!tok) return null;
            if (tok === 'any') {
                idx += 1;
                return { ip: 'any', wildcard: '255.255.255.255' };
            }
            if (tok === 'host') {
                const hostIp = args[idx + 1];
                if (!NetworkEngine.isValidIPv4(hostIp)) return null;
                idx += 2;
                return { ip: hostIp, wildcard: '0.0.0.0' };
            }
            if (NetworkEngine.isValidIPv4(args[idx])) {
                const ip = args[idx];
                const nextTok = args[idx + 1];
                const afterNextTok = (args[idx + 2] || '').toLowerCase();
                if (isSource) {
                    // For source: nextTok is wildcard if there is still a destination token after it
                    if (nextTok && NetworkEngine.isValidIPv4(nextTok) && afterNextTok && afterNextTok !== 'eq') {
                        idx += 2;
                        return { ip, wildcard: nextTok };
                    }
                    idx += 1;
                    return { ip, wildcard: '0.0.0.0' };
                } else {
                    // For destination: nextTok is wildcard if it is a valid IPv4
                    if (nextTok && NetworkEngine.isValidIPv4(nextTok)) {
                        idx += 2;
                        return { ip, wildcard: nextTok };
                    }
                    idx += 1;
                    return { ip, wildcard: '0.0.0.0' };
                }
            }
            return null;
        };

        const srcObj = parseEndpoint(true);
        if (!srcObj) {
            return { valid: false, error: 'Invalid source address or wildcard in Extended ACL.' };
        }
        const dstObj = parseEndpoint(false);
        if (!dstObj) {
            return { valid: false, error: 'Invalid destination address or wildcard in Extended ACL.' };
        }

        let dstPort = null;
        if ((args[idx] || '').toLowerCase() === 'eq') {
            const portTok = (args[idx + 1] || '').toLowerCase();
            const portMap = { www: 80, http: 80, https: 443, ssh: 22, telnet: 23, dns: 53, domain: 53 };
            dstPort = portMap[portTok] || parseInt(portTok, 10) || null;
        }

        return {
            valid: true,
            src: srcObj.ip,
            srcWildcard: srcObj.wildcard,
            dst: dstObj.ip,
            dstWildcard: dstObj.wildcard,
            dstPort
        };
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

        // show ipv6 interface brief
        if (full.startsWith('ipv6 int')) {
            let out = '';
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                const isUp = NetworkEngine.isInterfaceUp(this.device, pName);
                const stateStr = isUp ? '[up/up]' : '[administratively down/down]';
                const ll = pObj.ipv6LinkLocal || (pObj.ipv6 ? 'FE80::1' : 'unassigned');
                const gu = pObj.ipv6 || 'unassigned';
                out += `${pName.padEnd(20, ' ')}${stateStr}\n    ${ll}\n    ${gu}\n`;
            }
            return out.trimEnd();
        }

        // show ip interface brief
        if (full.startsWith('ip int') || full === 'ip interface brief') {
            let out = 'Interface              IP-Address      OK? Method Status                Protocol\n';
            out +=    '--------------------------------------------------------------------------------\n';
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                const namePadded = pName.padEnd(22, ' ');
                let ipLabel = pObj.ip || 'unassigned';
                if (this.device.type === 'switch' && !pObj.isSvi) {
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
            let out = '';
            const grouped = {};
            acls.forEach(r => {
                if (!grouped[r.id]) grouped[r.id] = [];
                grouped[r.id].push(r);
            });
            for (const [id, list] of Object.entries(grouped)) {
                const isStd = Number(id) < 100;
                out += `${isStd ? 'Standard' : 'Extended'} IP access list ${id}\n`;
                list.forEach((r, idx) => {
                    const seq = (idx + 1) * 10;
                    const srcStr = r.src === 'any'
                        ? 'any'
                        : (r.srcWildcard && r.srcWildcard !== '0.0.0.0' ? `${r.src}, wildcard bits ${r.srcWildcard}` : `host ${r.src}`);
                    if (isStd) {
                        out += `    ${seq} ${r.action} ${srcStr} (${r.hits || 0} matches)\n`;
                    } else {
                        const dstVal = r.dst || 'any';
                        const dstStr = dstVal === 'any'
                            ? 'any'
                            : (r.dstWildcard && r.dstWildcard !== '0.0.0.0' ? `${dstVal}, wildcard bits ${r.dstWildcard}` : `host ${dstVal}`);
                        const eqSuffix = r.dstPort ? ` eq ${r.dstPort === 80 ? 'www (80)' : r.dstPort}` : '';
                        out += `    ${seq} ${r.action} ${r.protocol} ${srcStr} ${dstStr}${eqSuffix} (${r.hits || 0} matches)\n`;
                    }
                });
                out += `    (Implicit Deny: deny ip any any)\n`;
            }
            return out.trimEnd();
        }

        // show ip dhcp binding
        if (full.startsWith('ip dhcp bind') || full === 'ip dhcp') {
            const bindings = this.device.dhcpBindings || [];
            if (bindings.length === 0) {
                return 'Bindings from all pools not associated with VRF:\nIP address          Client-ID/              Lease expiration        Type\n                    Hardware address/\n                    User name\n(No active DHCP leases yet)';
            }
            let out = 'Bindings from all pools not associated with VRF:\n';
            out += 'IP address          Client-ID/              Lease expiration        Type\n';
            out += '                    Hardware address/\n';
            out += '--------------------------------------------------------------------------------\n';
            bindings.forEach(b => {
                out += `${(b.ip || '').padEnd(20, ' ')}${(b.mac || '').padEnd(24, ' ')}${(b.leaseTime || '24h').padEnd(24, ' ')}${b.type || 'Automatic'} (${b.clientName || ''})\n`;
            });
            return out.trimEnd();
        }

        // show ip dhcp pool
        if (full.startsWith('ip dhcp pool')) {
            const pools = this.device.dhcpPools || [];
            if (pools.length === 0) {
                return 'No DHCP pools configured on this device.';
            }
            let out = '';
            pools.forEach(p => {
                const leasedCount = (this.device.dhcpBindings || []).filter(b => b.pool === p.name).length;
                out += `Pool ${p.name} :\n`;
                out += ` Utilization mark (high/low)    : 100 / 0\n`;
                out += ` Subnet size (first/next)       : 0 / 0\n`;
                out += ` Current index                  : ${p.network || 'unassigned'}\n`;
                out += ` Default router                 : ${p.defaultRouter || 'not set'}\n`;
                out += ` DNS server                     : ${p.dnsServer || 'not set'}\n`;
                out += ` Leased addresses               : ${leasedCount}\n\n`;
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
            for (const [pName, pObj] of trunks) {
                const nativeVlan = pObj.nativeVlan || 1;
                out += `${pName.padEnd(12, ' ')}on           802.1q         trunking      ${nativeVlan}\n`;
            }
            return out.trimEnd();
        }

        // show vlan brief
        if (full.startsWith('vlan')) {
            if (this.device.type !== 'switch') {
                return '% Ambiguous command: "show vlan" is only available on Catalyst Switches.';
            }
            const vlanGroups = { 1: [] };
            if (this.device.vlans) {
                Object.keys(this.device.vlans).forEach(v => {
                    if (!vlanGroups[v]) vlanGroups[v] = [];
                });
            }
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                if (pObj.mode === 'trunk' || pObj.isSvi) continue;
                const v = pObj.vlan || 1;
                if (!vlanGroups[v]) vlanGroups[v] = [];
                vlanGroups[v].push(pName);
            }

            let out = 'VLAN Name                             Status    Ports\n';
            out +=    '---- -------------------------------- --------- -------------------------------\n';
            Object.keys(vlanGroups).sort((a, b) => Number(a) - Number(b)).forEach(v => {
                const vPadded = String(v).padEnd(5, ' ');
                const customName = this.device.vlans?.[v];
                const vName = (customName || (v === '1' ? 'default' : `VLAN${String(v).padStart(4, '0')}`)).padEnd(33, ' ');
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
            let out = '          Mac Address Table (CAM Table)\n-------------------------------------------\n';
            out += 'Vlan    Mac Address       Type        Ports\n';
            out += '----    -----------       --------    -----\n';

            const seenMacs = new Set();
            // 1. Dynamically learned MACs from frame forwarding
            (this.device.macTable || []).forEach(entry => {
                if (entry.mac && !seenMacs.has(`${entry.vlan}:${entry.mac}`)) {
                    seenMacs.add(`${entry.vlan}:${entry.mac}`);
                    out += `${String(entry.vlan || 1).padEnd(8, ' ')}${entry.mac.padEnd(18, ' ')}${(entry.type || 'DYNAMIC').padEnd(12, ' ')}${entry.port}\n`;
                }
            });

            // 2. Directly connected UP ports
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
                    if (!seenMacs.has(`${vlan}:${pObj.mac}`) && !seenMacs.has(`${this.device.ports[myPort]?.vlan || 1}:${pObj.mac}`)) {
                        seenMacs.add(`${vlan}:${pObj.mac}`);
                        out += `${vlan.padEnd(8, ' ')}${pObj.mac.padEnd(18, ' ')}DYNAMIC     ${myPort} (${peerDev.name})\n`;
                    }
                }
            });
            return out.trimEnd();
        }

        // show ip arp
        if (full.startsWith('ip arp') || full === 'arp') {
            let out = 'Protocol  Address          Age (min)  Hardware Addr   Type   Interface\n';
            const shownIps = new Set();

            // 1. Own UP interfaces (Age '-')
            Object.entries(this.device.ports).forEach(([pName, pObj]) => {
                if (pObj.ip && NetworkEngine.isInterfaceUp(this.device, pName)) {
                    if (!pObj.mac) pObj.mac = NetworkEngine.generateMac(this.device.type);
                    shownIps.add(pObj.ip);
                    out += `Internet  ${pObj.ip.padEnd(17, ' ')}${'-'.padEnd(11, ' ')}${pObj.mac.padEnd(16, ' ')}ARPA   ${pName}\n`;
                }
            });

            // 2. Dynamic ARP Cache entries learned during packet simulation
            if (this.device.arpCache) {
                Object.entries(this.device.arpCache).forEach(([ip, entry]) => {
                    if (!shownIps.has(ip) && entry && entry.mac) {
                        shownIps.add(ip);
                        out += `Internet  ${ip.padEnd(17, ' ')}${'0'.padEnd(11, ' ')}${entry.mac.padEnd(16, ' ')}ARPA   ${entry.interface || 'Eth0'}\n`;
                    }
                });
            }

            // 3. Same-subnet reachable peers
            allDevices.forEach(dev => {
                if (dev.id === this.device.id) return;
                Object.entries(dev.ports).forEach(([pName, pObj]) => {
                    if (pObj.ip && !shownIps.has(pObj.ip) && NetworkEngine.isInterfaceUp(dev, pName)) {
                        if (!pObj.mac) pObj.mac = NetworkEngine.generateMac(dev.type);
                        shownIps.add(pObj.ip);
                        out += `Internet  ${pObj.ip.padEnd(17, ' ')}${'0'.padEnd(11, ' ')}${pObj.mac.padEnd(16, ' ')}ARPA   ${dev.name}(${pName})\n`;
                    }
                });
            });
            return out.trimEnd();
        }

        // show ip ospf neighbor
        if (full.startsWith('ip ospf')) {
            if (!NetworkEngine.isL3Device(this.device)) {
                return '% OSPF is only supported on Router or Layer 3 Switch devices.';
            }
            const neighbors = NetworkEngine.getOspfNeighbors(this.device, allDevices, allCables);
            if (neighbors.length === 0) {
                return 'No active OSPF neighbors found. Verify "router ospf" network statements, Area IDs, and interface status.';
            }
            let out = 'Neighbor ID     Pri   State           Dead Time   Address         Interface\n';
            neighbors.forEach(n => {
                out += `${n.neighborId.padEnd(16, ' ')}${String(n.pri).padEnd(6, ' ')}${n.state.padEnd(16, ' ')}00:00:38    ${n.address.padEnd(16, ' ')}${n.interface} (Area ${n.area}, ${n.hostname})\n`;
            });
            return out.trimEnd();
        }

        // show ip route
        if (full.startsWith('ip ro')) {
            if (!NetworkEngine.isL3Device(this.device)) {
                return `IP routing is not enabled on this device.\nDefault gateway is ${this.device.gateway || 'not set'}`;
            }
            let out = 'Codes: C - connected, L - local, S - static, O - OSPF\n\nGateway of last resort is not set\n\n';
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                if (pObj.ip && NetworkEngine.isInterfaceUp(this.device, pName)) {
                    const cidr = NetworkEngine.maskToCidr(pObj.mask || '255.255.255.0');
                    const net = NetworkEngine.getNetworkAddress(pObj.ip, pObj.mask || '255.255.255.0');
                    const vlanSuffix = pObj.vlan ? ` (VLAN ${pObj.vlan})` : '';
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
            let out = `Building configuration...\n\nCurrent configuration : 1480 bytes\n!\n`;
            if (this.device.passwordEncryption) out += `service password-encryption\n`;
            out += `hostname ${this.device.name}\n!\n`;
            if (this.device.enableSecret) {
                out += `enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0\n!\n`;
            }
            if (this.device.ipRouting) {
                out += `ip routing\n!\n`;
            }
            if (this.device.ipv6Routing) {
                out += `ipv6 unicast-routing\n!\n`;
            }
            if (this.device.dhcpExcluded && this.device.dhcpExcluded.length > 0) {
                for (const ex of this.device.dhcpExcluded) {
                    out += `ip dhcp excluded-address ${ex.low}${ex.high && ex.high !== ex.low ? ' ' + ex.high : ''}\n`;
                }
                out += `!\n`;
            }
            if (this.device.dhcpPools && this.device.dhcpPools.length > 0) {
                for (const pool of this.device.dhcpPools) {
                    out += `ip dhcp pool ${pool.name}\n`;
                    if (pool.network) out += ` network ${pool.network} ${pool.mask || '255.255.255.0'}\n`;
                    if (pool.defaultRouter) out += ` default-router ${pool.defaultRouter}\n`;
                    if (pool.dnsServer) out += ` dns-server ${pool.dnsServer}\n`;
                    out += `!\n`;
                }
            }
            if (this.device.gateway) {
                out += `ip default-gateway ${this.device.gateway}\n!\n`;
            }
            for (const [pName, pObj] of Object.entries(this.device.ports)) {
                out += `interface ${pName}\n`;
                if (this.device.type === 'switch' && !pObj.isSvi) {
                    if (pObj.mode === 'trunk') {
                        out += ` switchport mode trunk\n`;
                        if (pObj.nativeVlan && pObj.nativeVlan !== 1) {
                            out += ` switchport trunk native vlan ${pObj.nativeVlan}\n`;
                        }
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
                    if (pObj.ipv6) {
                        out += ` ipv6 address ${pObj.ipv6}\n`;
                    }
                    if (pObj.nat) {
                        out += ` ip nat ${pObj.nat}\n`;
                    }
                    if (pObj.ospfCost) {
                        out += ` ip ospf cost ${pObj.ospfCost}\n`;
                    }
                    if (pObj.aclGroup) {
                        out += ` ip access-group ${pObj.aclGroup.id} ${pObj.aclGroup.direction}\n`;
                    }
                }
                out += ` ${pObj.up ? 'no shutdown' : 'shutdown'}\n!\n`;
            }
            if (NetworkEngine.isL3Device(this.device) && this.device.ospf?.networks?.length > 0) {
                out += `router ospf ${this.device.ospf.processId || 1}\n`;
                if (this.device.ospf.routerId) {
                    out += ` router-id ${this.device.ospf.routerId}\n`;
                }
                for (const n of this.device.ospf.networks) {
                    out += ` network ${n.network} ${n.wildcard} area ${n.area}\n`;
                }
                out += `!\n`;
            }
            if (NetworkEngine.isL3Device(this.device) && this.device.routes?.length > 0) {
                for (const r of this.device.routes) {
                    out += `ip route ${r.network} ${r.mask} ${r.nextHop}\n`;
                }
                out += `!\n`;
            }
            if (this.device.type === 'router' && this.device.natRule) {
                out += `ip nat inside source list ${this.device.natRule.aclId} interface ${this.device.natRule.outInterface}${this.device.natRule.overload ? ' overload' : ''}\n!\n`;
            }
            if (this.device.type === 'router' && this.device.staticNat?.length > 0) {
                for (const s of this.device.staticNat) {
                    out += `ip nat inside source static ${s.insideLocal} ${s.insideGlobal}\n`;
                }
                out += `!\n`;
            }
            if (this.device.type === 'router' && this.device.acls?.length > 0) {
                for (const a of this.device.acls) {
                    if (Number(a.id) < 100) {
                        const wc = a.srcWildcard && a.srcWildcard !== '0.0.0.0' && a.src !== 'any' ? ` ${a.srcWildcard}` : '';
                        out += `access-list ${a.id} ${a.action} ${a.src}${wc}\n`;
                    } else {
                        const swc = a.srcWildcard && a.srcWildcard !== '0.0.0.0' && a.src !== 'any' ? ` ${a.srcWildcard}` : '';
                        const dwc = a.dstWildcard && a.dstWildcard !== '0.0.0.0' && a.dst !== 'any' ? ` ${a.dstWildcard}` : '';
                        const eq = a.dstPort ? ` eq ${a.dstPort}` : '';
                        out += `access-list ${a.id} ${a.action} ${a.protocol} ${a.src}${swc} ${a.dst || 'any'}${dwc}${eq}\n`;
                    }
                }
                out += `!\n`;
            }
            if (this.device.bannerMotd) {
                out += `banner motd ^C${this.device.bannerMotd}^C\n!\n`;
            }
            if (this.device.linePassword || this.device.sshEnabled) {
                out += `line vty 0 4\n`;
                if (this.device.linePassword) out += ` password ${this.device.passwordEncryption ? '7 0822455D0A16' : this.device.linePassword}\n`;
                if (this.device.sshEnabled) out += ` transport input ssh\n`;
                out += ` login\n!\n`;
            }
            out += `end`;
            return out;
        }

        return `% Incomplete or unsupported show command.\nTry: show ip int brief, show ipv6 int brief, show ip route, show access-lists, show ip nat translations, show ip ospf neighbor, show vlan brief, show run`;
    }

    handlePingCommand(targetIp) {
        if (!targetIp) {
            return '% Usage: ping <ip_or_ipv6_address>';
        }

        const allDevices = window.appState ? window.appState.devices : [];
        const allCables = window.appState ? window.appState.cables : [];

        // Support IPv6 Ping
        if (NetworkEngine.isValidIPv6(targetIp)) {
            const cleanTarget = targetIp.split('/')[0].toLowerCase();
            let targetDev = null;
            for (const dev of allDevices) {
                for (const p of Object.values(dev.ports)) {
                    if (p.ipv6 && p.ipv6.split('/')[0].toLowerCase() === cleanTarget && p.up) {
                        targetDev = dev;
                        break;
                    }
                }
                if (targetDev) break;
            }
            if (!targetDev) {
                return `Type escape sequence to abort.\nSending 5, 100-byte ICMPv6 Echos to ${cleanTarget}, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5) (IPv6 destination not found or port down)`;
            }
            return `Type escape sequence to abort.\nSending 5, 100-byte ICMPv6 Echos to ${cleanTarget}, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/2/3 ms\n(IPv6 Neighbor Discovery ND/NA & ICMPv6 Echo Reply from ${targetDev.name} สำเร็จ!)`;
        }

        if (!NetworkEngine.isValidIPv4(targetIp)) {
            return '% Usage: ping <valid_ipv4_or_ipv6_address>';
        }

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
            return `[TCP 3-Way Handshake: SYN ➔ SYN-ACK ➔ ACK Established]\nGET /index.html HTTP/1.1\nHost: ${targetIp}:80\n\nHTTP/1.1 200 OK\nServer: Cisco-NetSim-Web/5.0 (${targetDev.name})\nContent-Type: text/html\n\n<html><body><h1>Welcome to ${targetDev.name} (${targetIp})</h1></body></html>`;
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
  ping <ip|ipv6>          Send ICMP / ICMPv6 echo request
  http <ip>               Send TCP Port 80 HTTP GET request
  traceroute <ip>         Trace route to destination IP
  arp -a                  Display ARP cache`;
        } else if (mode === 'privileged') {
            return `Available commands in Privileged Exec mode:
  configure terminal      Enter global configuration mode
  show ip int brief       Brief summary of IPv4 interface status
  show ipv6 int brief     Brief summary of IPv6 interface status
  show ip route           Display IP routing table (Connected/Static/OSPF)
  show access-lists       Display Standard & Extended ACL firewall rules
  show ip nat translations Display active Static & Dynamic NAT/PAT table
  show ip ospf neighbor   Display OSPF neighbor adjacencies
  show ip arp             Display IP-to-MAC ARP table
  show vlan brief         Display VLAN database & port assignments (Switch)
  show interfaces trunk   Display 802.1Q trunk & Native VLAN (Switch)
  show mac address-table  Display L2 CAM/MAC forwarding table (Switch)
  show run                Display current running configuration
  ping / http / traceroute Test network connectivity`;
        } else if (mode === 'config') {
            return `Available commands in Global Config mode:
  hostname <name>                 Set system network name
  enable secret <password>        Set encrypted privileged exec password
  service password-encryption     Encrypt plaintext passwords in config
  banner motd #<text>#            Set Message-of-the-Day login banner
  line console 0 / line vty 0 4   Configure Console or SSH/Telnet VTY lines
  vlan <1-4094>                   Create VLAN and enter config-vlan mode
  interface vlan <1-4094>         Configure Switch SVI (Management or L3 Switch)
  ip routing                      Enable Layer 3 Switch Inter-VLAN Routing
  ipv6 unicast-routing            Enable IPv6 routing
  interface <port | port.vlan>    Select interface or 802.1Q sub-interface
  router ospf <process-id>        Enable OSPF dynamic routing process
  access-list <1-199> ...         Add Standard (1-99) or Extended (100+) ACL
  ip nat inside source static ... Configure 1-to-1 Static NAT
  ip nat inside source list 1 ... Enable PAT Overload on Router
  ip route <net> <mask> <nexthop> Add static or default route (0.0.0.0)
  ip default-gateway <ip>         Set default gateway (PC/Server/Switch)
  exit / end                      Exit configuration mode`;
        } else if (mode === 'config-if') {
            return `Available commands in Interface Config mode:
  ip address <ip> <mask>          Set IPv4 address and subnet mask
  ip address dhcp                 Acquire IPv4 address via DHCP (DORA)
  ipv6 address <v6/len|autoconfig> Set IPv6 Global Unicast or SLAAC autoconfig
  ip nat <inside|outside>         Set NAT interface role (Router)
  ip access-group <id> <in|out>   Bind ACL firewall to interface
  encapsulation dot1Q <vlan-id>   Set 802.1Q VLAN tag on Router sub-interface
  switchport mode <access|trunk>  Set switchport L2 mode (Access or 802.1Q Trunk)
  switchport access vlan <1-4094> Set access VLAN ID (Switch port)
  switchport trunk native vlan <id> Set 802.1Q Native VLAN on Trunk port
  no shutdown / shutdown          Enable or disable this interface`;
        }
        return '';
    }
}

window.CiscoCLI = CiscoCLI;
