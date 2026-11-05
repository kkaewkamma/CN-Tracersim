import { describe, it, expect } from 'vitest';
import { CiscoCliStateMachine } from '../../src/core/cli/cisco-cli-parser';

describe('Core CLI: CiscoCliStateMachine', () => {
  it('manages prompt transitions across EXEC, Global, and Interface modes', () => {
    const router: any = {
      name: 'R1-HQ',
      type: 'router',
      ports: {
        'Gig0/0': { ip: '', mask: '', up: false }
      }
    };

    const cli = new CiscoCliStateMachine(router);
    expect(cli.getPrompt()).toBe('R1-HQ>');

    cli.execute('enable');
    expect(cli.getPrompt()).toBe('R1-HQ#');

    cli.execute('configure terminal');
    expect(cli.getPrompt()).toBe('R1-HQ(config)#');

    cli.execute('interface Gig0/0');
    expect(cli.getPrompt()).toBe('R1-HQ(config-if)#');

    cli.execute('ip address 192.168.10.1 255.255.255.0');
    expect(router.ports['Gig0/0'].ip).toBe('192.168.10.1');

    cli.execute('no shutdown');
    expect(router.ports['Gig0/0'].up).toBe(true);

    cli.execute('exit');
    expect(cli.getPrompt()).toBe('R1-HQ(config)#');

    cli.execute('end');
    expect(cli.getPrompt()).toBe('R1-HQ#');
  });

  it('parses show commands accurately', () => {
    const router: any = {
      name: 'R1',
      type: 'router',
      ports: {
        'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true }
      },
      routes: [
        { network: '192.168.20.0', mask: '255.255.255.0', nextHop: '10.0.0.2' }
      ]
    };

    const cli = new CiscoCliStateMachine(router, { mode: 'privileged' });
    const ipBrief = cli.execute('show ip interface brief');
    expect(ipBrief.output).toContain('Gig0/0');
    expect(ipBrief.output).toContain('192.168.10.1');
    expect(ipBrief.output).toContain('up');

    const ipRoute = cli.execute('show ip route');
    expect(ipRoute.output).toContain('C    192.168.10.0/24 is directly connected, Gig0/0');
    expect(ipRoute.output).toContain('S    192.168.20.0/24 [1/0] via 10.0.0.2');
  });

  it('restores CLI mode and interface context from device properties', () => {
    const sw: any = {
      name: 'SW1',
      type: 'switch',
      cliMode: 'interface',
      cliCurrentIf: 'FastEthernet0/1',
      ports: {
        'FastEthernet0/1': { up: true, vlan: 1, mode: 'access' }
      }
    };

    const cli = new CiscoCliStateMachine(sw);
    expect(cli.getPrompt()).toBe('SW1(config-if)#');
    expect(cli.getContext().mode).toBe('interface');
    expect(cli.getContext().currentInterface).toBe('FastEthernet0/1');

    cli.execute('switchport access vlan 20');
    expect(sw.ports['FastEthernet0/1'].vlan).toBe(20);
  });
});

