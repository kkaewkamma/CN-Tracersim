import { CliContext, CliExecutionResult } from '../types';
import { IpMath } from '../engine/ip-math';

/**
 * Pure Cisco IOS Command Parser & State Machine
 * Decoupled from React, DOM, or global window variables.
 */
export class CiscoCliStateMachine {
  private context: CliContext;
  private device: any;

  constructor(device: any, initialContext?: Partial<CliContext>) {
    this.device = device;
    this.context = {
      mode: initialContext?.mode || (device.cliMode as any) || 'user',
      currentInterface: initialContext?.currentInterface || device.cliCurrentIf,
      currentLine: initialContext?.currentLine,
      currentOspfProcess: initialContext?.currentOspfProcess,
      currentDhcpPool: initialContext?.currentDhcpPool
    };
  }

  public getPrompt(): string {
    const name = this.device.name || 'Device';
    switch (this.context.mode) {
      case 'user': return `${name}>`;
      case 'privileged': return `${name}#`;
      case 'global': return `${name}(config)#`;
      case 'interface': return `${name}(config-if)#`;
      case 'line': return `${name}(config-line)#`;
      case 'router_ospf': return `${name}(config-router)#`;
      case 'dhcp_pool': return `${name}(dhcp-config)#`;
      default: return `${name}>`;
    }
  }

  public getContext(): CliContext {
    return { ...this.context };
  }

  public getDevice(): any {
    return this.device;
  }

  public autocomplete(partial: string): string[] {
    const common = [
      'enable', 'disable', 'configure terminal', 'show',
      'show ip interface brief', 'show ip route', 'show vlan brief', 'show running-config', 'show ip nat translations',
      'interface GigabitEthernet0/0', 'interface GigabitEthernet0/1', 'interface FastEthernet0/1',
      'ip address', 'no shutdown', 'shutdown',
      'hostname', 'exit', 'end', 'ping',
      'switchport mode trunk', 'switchport mode access', 'switchport access vlan',
      'router ospf 1', 'network', 'ip route'
    ];
    return common.filter(c => c.toLowerCase().startsWith(partial.toLowerCase().trim()));
  }

  public execute(rawCmd: string): CliExecutionResult {
    const cmd = rawCmd.trim();
    if (!cmd) {
      return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: false };
    }

    let output = '';

    // Handle Help (?)
    if (cmd === '?') {
      output = this.renderHelp();
      return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: false };
    }

    // 1. Navigation Commands across Modes
    if (/^en(able)?$/i.test(cmd)) {
      this.context.mode = 'privileged';
      return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
    }

    if (/^dis(able)?$/i.test(cmd)) {
      this.context.mode = 'user';
      return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
    }

    if (/^conf(igure)?(\s+t(erminal)?)?$/i.test(cmd)) {
      if (this.context.mode !== 'user') {
        this.context.mode = 'global';
        output = 'Enter configuration commands, one per line. End with CNTL/Z.';
        return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }
    }

    if (/^exit$/i.test(cmd)) {
      return this.handleExit();
    }

    if (/^end$/i.test(cmd)) {
      this.context.mode = 'privileged';
      this.context.currentInterface = undefined;
      return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
    }

    // 2. Global Configuration Mode
    if (this.context.mode === 'global') {
      // hostname
      const hostMatch = cmd.match(/^hostname\s+([A-Za-z0-9_-]+)$/i);
      if (hostMatch) {
        this.device.name = hostMatch[1];
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // enable secret
      const secMatch = cmd.match(/^enable\s+secret\s+(\S+)$/i);
      if (secMatch) {
        this.device.enableSecret = secMatch[1];
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // service password-encryption
      if (/^service\s+password-encryption$/i.test(cmd)) {
        this.device.passwordEncryption = true;
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // interface selection
      const ifMatch = cmd.match(/^int(erface)?\s+([A-Za-z]+)\s*([0-9/._-]+)$/i) || cmd.match(/^int(erface)?\s+([A-Za-z0-9/._-]+)$/i);
      if (ifMatch) {
        const rawPort = ifMatch[3] ? `${ifMatch[2]}${ifMatch[3]}` : ifMatch[2];
        const portName = this.normalizeInterfaceName(rawPort);
        this.context.mode = 'interface';
        this.context.currentInterface = portName;
        if (!this.device.ports[portName]) {
          this.device.ports[portName] = { name: portName, up: false, ip: '', mask: '' };
        }
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // ip route
      const routeMatch = cmd.match(/^ip\s+route\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)$/i);
      if (routeMatch) {
        if (!this.device.routes) this.device.routes = [];
        this.device.routes.push({
          network: routeMatch[1],
          mask: routeMatch[2],
          nextHop: routeMatch[3]
        });
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // router ospf
      const ospfMatch = cmd.match(/^router\s+ospf\s+(\d+)$/i);
      if (ospfMatch) {
        this.context.mode = 'router_ospf';
        this.context.currentOspfProcess = parseInt(ospfMatch[1], 10);
        if (!this.device.ospf) this.device.ospf = { processId: ospfMatch[1], networks: [] };
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }
    }

    // 3. Interface Configuration Mode
    if (this.context.mode === 'interface' && this.context.currentInterface) {
      const port = this.device.ports[this.context.currentInterface];

      // no shutdown / shutdown
      if (/^no\s+sh(utdown)?$/i.test(cmd)) {
        port.up = true;
        port.errDisabled = false;
        output = `% Interface ${this.context.currentInterface}, changed state to up\n% LINEPROTO-5-UPDOWN: Line protocol on Interface ${this.context.currentInterface}, changed state to up`;
        return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      if (/^sh(utdown)?$/i.test(cmd)) {
        port.up = false;
        output = `% Interface ${this.context.currentInterface}, changed state to administratively down`;
        return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // ip address <ip> <mask>
      const ipMatch = cmd.match(/^ip\s+add(ress)?\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)$/i);
      if (ipMatch) {
        port.ip = ipMatch[2];
        port.mask = ipMatch[3];
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // switchport mode access / trunk
      const swModeMatch = cmd.match(/^sw(itchport)?\s+mode\s+(access|trunk)$/i);
      if (swModeMatch) {
        port.mode = swModeMatch[2].toLowerCase();
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // switchport access vlan <id>
      const vlanMatch = cmd.match(/^sw(itchport)?\s+access\s+vlan\s+(\d+)$/i);
      if (vlanMatch) {
        port.vlan = parseInt(vlanMatch[2], 10);
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // switchport trunk allowed vlan <vlans>
      const trunkVlans = cmd.match(/^sw(itchport)?\s+trunk\s+allowed\s+vlan\s+(.+)$/i);
      if (trunkVlans) {
        port.allowedVlans = trunkVlans[2];
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // encapsulation dot1q <vlan> (Router-on-a-Stick subinterface)
      const dot1qMatch = cmd.match(/^enc(apsulation)?\s+dot1q\s+(\d+)$/i);
      if (dot1qMatch) {
        port.vlan = parseInt(dot1qMatch[2], 10);
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }
    }

    // 4. OSPF Router Configuration Mode
    if (this.context.mode === 'router_ospf') {
      const netMatch = cmd.match(/^net(work)?\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+area\s+(\d+)$/i);
      if (netMatch) {
        this.device.ospf.networks.push({
          network: netMatch[2],
          wildcard: netMatch[3],
          area: parseInt(netMatch[4], 10)
        });
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }
    }

    // 5. Show Commands (Available in Privileged Mode)
    if (/^sh(ow)?\s+/i.test(cmd)) {
      output = this.handleShowCommand(cmd);
      return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: false };
    }

    return { 
      output: `% Invalid input detected at '^' marker: '${cmd}'`, 
      prompt: this.getPrompt(), 
      context: this.getContext(), 
      stateChanged: false 
    };
  }

  private handleExit(): CliExecutionResult {
    switch (this.context.mode) {
      case 'interface':
      case 'router_ospf':
      case 'dhcp_pool':
      case 'line':
        this.context.mode = 'global';
        this.context.currentInterface = undefined;
        break;
      case 'global':
        this.context.mode = 'privileged';
        break;
      case 'privileged':
        this.context.mode = 'user';
        break;
      case 'user':
        return { output: '\n[Connection closed by foreign host]', prompt: this.getPrompt(), context: this.getContext(), stateChanged: false };
    }
    return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
  }

  private normalizeInterfaceName(raw: string): string {
    const s = raw.toLowerCase();
    if (s.startsWith('gig') || s.startsWith('g')) {
      const num = raw.replace(/^[A-Za-z]+/i, '');
      return `Gig${num || '0/0'}`;
    }
    if (s.startsWith('fa') || s.startsWith('f')) {
      const num = raw.replace(/^[A-Za-z]+/i, '');
      return `Fa${num || '0/1'}`;
    }
    return raw;
  }

  private handleShowCommand(cmd: string): string {
    if (/^sh(ow)?\s+ip\s+int(erface)?\s+br(ief)?/i.test(cmd)) {
      let out = 'Interface              IP-Address      OK? Method Status                Protocol\n';
      for (const [pName, p] of Object.entries(this.device.ports as Record<string, any>)) {
        const ipStr = (p.ip || 'unassigned').padEnd(16, ' ');
        const statusStr = p.errDisabled ? 'err-disabled' : (p.up ? 'up' : 'administratively down');
        const protoStr = (p.up && !p.errDisabled) ? 'up' : 'down';
        out += `${pName.padEnd(23, ' ')}${ipStr}YES manual ${statusStr.padEnd(22, ' ')}${protoStr}\n`;
      }
      return out.trimEnd();
    }

    if (/^sh(ow)?\s+ip\s+ro(ute)?/i.test(cmd)) {
      let out = 'Codes: L - local, C - connected, S - static, O - OSPF\n\nGateway of last resort is not set\n\n';
      for (const [pName, p] of Object.entries(this.device.ports as Record<string, any>)) {
        if (p.ip && p.up) {
          const net = IpMath.getNetworkAddress(p.ip, p.mask || '255.255.255.0');
          out += `C    ${net}/24 is directly connected, ${pName}\n`;
        }
      }
      for (const r of (this.device.routes || [])) {
        out += `S    ${r.network}/24 [1/0] via ${r.nextHop}\n`;
      }
      return out.trimEnd();
    }

    if (/^sh(ow)?\s+vlan(\s+br(ief)?)?/i.test(cmd)) {
      let out = 'VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    \n';
      for (const [pName, p] of Object.entries(this.device.ports as Record<string, any>)) {
        if (p.mode !== 'trunk' && p.vlan) {
          out += `${String(p.vlan).padEnd(4, ' ')} VLAN${String(p.vlan).padEnd(28, ' ')} active    ${pName}\n`;
        }
      }
      return out.trimEnd();
    }

    return `% Show command executed on ${this.device.name}`;
  }

  private renderHelp(): string {
    switch (this.context.mode) {
      case 'user':
        return '  enable          Turn on privileged commands\n  ping            Send echo messages\n  show            Show running system information';
      case 'privileged':
        return '  configure       Enter configuration mode\n  disable         Turn off privileged commands\n  ping            Send echo messages\n  show            Show running system information';
      case 'global':
        return '  hostname        Set system network name\n  interface       Select an interface to configure\n  ip route        Establish static routes\n  router          Enable a routing process\n  exit            Exit from configure mode';
      case 'interface':
        return '  ip address      Set the IP address of an interface\n  no              Negate a command or set its defaults\n  shutdown        Shut down the selected interface\n  switchport      Set switching characteristics of the interface';
      default:
        return '  exit            Exit current mode\n  end             Return to Privileged EXEC mode';
    }
  }
}
