import { CliMode, CliContext, CliExecutionResult, NetworkDevice } from '../types';
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
      mode: initialContext?.mode || 'user',
      currentInterface: initialContext?.currentInterface,
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

  public execute(rawCmd: string): CliExecutionResult {
    const cmd = rawCmd.trim();
    if (!cmd) {
      return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: false };
    }

    let stateChanged = false;
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

    if (/^disable$/i.test(cmd)) {
      this.context.mode = 'user';
      return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
    }

    if (/^conf(igure)?(\s+t(erminal)?)?$/i.test(cmd)) {
      if (this.context.mode === 'user') {
        return { output: '% Privileged EXEC mode required to configure.', prompt: this.getPrompt(), context: this.getContext(), stateChanged: false };
      }
      this.context.mode = 'global';
      output = 'Enter configuration commands, one per line. End with CNTL/Z.';
      return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
    }

    if (/^exit$/i.test(cmd)) {
      if (this.context.mode === 'interface' || this.context.mode === 'line' || this.context.mode === 'router_ospf' || this.context.mode === 'dhcp_pool') {
        this.context.mode = 'global';
      } else if (this.context.mode === 'global') {
        this.context.mode = 'privileged';
      } else if (this.context.mode === 'privileged') {
        this.context.mode = 'user';
      }
      return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
    }

    if (/^end$/i.test(cmd)) {
      if (this.context.mode !== 'user') {
        this.context.mode = 'privileged';
      }
      return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
    }

    // 2. Global Mode Commands
    if (this.context.mode === 'global') {
      // Hostname
      const hostMatch = cmd.match(/^hostname\s+(\S+)/i);
      if (hostMatch) {
        this.device.name = hostMatch[1];
        stateChanged = true;
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // Interface navigation (including Sub-interfaces)
      const intMatch = cmd.match(/^int(erface)?\s+(\S+)/i);
      if (intMatch) {
        const portName = intMatch[2];
        this.context.mode = 'interface';
        this.context.currentInterface = portName;
        if (!this.device.ports[portName]) {
          // Dynamically create Sub-interface if needed (e.g. Gig0/0.10)
          this.device.ports[portName] = {
            name: portName,
            ip: '',
            mask: '',
            up: true,
            isSubIf: portName.includes('.'),
            parentPort: portName.split('.')[0],
            mac: IpMath.generateMac(this.device.type)
          };
        }
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // Router OSPF
      const ospfMatch = cmd.match(/^router\s+ospf\s+(\d+)/i);
      if (ospfMatch) {
        const pid = parseInt(ospfMatch[1], 10);
        this.context.mode = 'router_ospf';
        this.context.currentOspfProcess = pid;
        if (!this.device.ospf) this.device.ospf = { processId: pid, networks: [] };
        this.device.ospf.processId = pid;
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // Static Route: ip route <net> <mask> <next-hop>
      const routeMatch = cmd.match(/^ip\s+route\s+(\S+)\s+(\S+)\s+(\S+)/i);
      if (routeMatch) {
        if (!this.device.routes) this.device.routes = [];
        this.device.routes.push({
          network: routeMatch[1],
          mask: routeMatch[2],
          nextHop: routeMatch[3]
        });
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // NAT Overload: ip nat inside source list <id> interface <out> overload
      const natOvMatch = cmd.match(/^ip\s+nat\s+inside\s+source\s+list\s+(\S+)\s+interface\s+(\S+)\s+overload/i);
      if (natOvMatch) {
        this.device.natEnabled = true;
        this.device.natRule = {
          aclId: isNaN(Number(natOvMatch[1])) ? natOvMatch[1] : Number(natOvMatch[1]),
          outInterface: natOvMatch[2],
          overload: true
        };
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }
    }

    // 3. Interface Mode Commands
    if (this.context.mode === 'interface' && this.context.currentInterface) {
      const pName = this.context.currentInterface;
      const port = this.device.ports[pName];

      // IP Address
      const ipMatch = cmd.match(/^ip\s+add(ress)?\s+(\S+)\s+(\S+)/i);
      if (ipMatch) {
        port.ip = ipMatch[2];
        port.mask = ipMatch[3];
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // Shutdown / No Shutdown
      if (/^no\s+sh(utdown)?$/i.test(cmd)) {
        port.up = true;
        port.errDisabled = false;
        output = `%LINK-3-UPDOWN: Interface ${pName}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${pName}, changed state to up`;
        return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      if (/^sh(utdown)?$/i.test(cmd)) {
        port.up = false;
        output = `%LINK-5-CHANGED: Interface ${pName}, changed state to administratively down`;
        return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // 802.1Q Encapsulation on Sub-interface
      const encapMatch = cmd.match(/^encap(sulation)?\s+dot1q\s+(\d+)/i);
      if (encapMatch) {
        port.vlan = parseInt(encapMatch[2], 10);
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // Switchport Mode
      const swModeMatch = cmd.match(/^sw(itchport)?\s+mode\s+(access|trunk)/i);
      if (swModeMatch) {
        port.mode = swModeMatch[2].toLowerCase() as any;
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }

      // Switchport Port-Security
      if (/^sw(itchport)?\s+port-security$/i.test(cmd)) {
        if (!port.portSecurity) {
          port.portSecurity = { enabled: true, maximum: 1, violation: 'shutdown', sticky: false, secureMacs: [], violationCount: 0 };
        } else {
          port.portSecurity.enabled = true;
        }
        return { output: '', prompt: this.getPrompt(), context: this.getContext(), stateChanged: true };
      }
    }

    // 4. Show Commands (Available in Privileged EXEC or with 'do' prefix)
    const isDo = cmd.toLowerCase().startsWith('do ');
    const effectiveCmd = isDo ? cmd.slice(3).trim() : cmd;

    if (effectiveCmd.toLowerCase().startsWith('sh ') || effectiveCmd.toLowerCase().startsWith('show ')) {
      output = this.handleShowCommand(effectiveCmd);
      return { output, prompt: this.getPrompt(), context: this.getContext(), stateChanged: false };
    }

    return {
      output: `% Unrecognized command or invalid syntax: "${cmd}"`,
      prompt: this.getPrompt(),
      context: this.getContext(),
      stateChanged: false
    };
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
