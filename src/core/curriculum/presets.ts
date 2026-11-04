import { NetworkDevice, NetworkCable } from '../types';
import { IpMath } from '../engine/ip-math';

export interface TopologyPreset {
  id: string;
  name: string;
  description: string;
  devices: NetworkDevice[];
  cables: NetworkCable[];
}

export function generatePresetTopology(presetId: string): TopologyPreset {
  let devices: NetworkDevice[] = [];
  let cables: NetworkCable[] = [];

  switch (presetId) {
    case 'lab1':
    case 'lan': {
      // Lab 01: Basic Switch Configuration
      const sw1: any = {
        id: 'sw1',
        type: 'switch',
        name: 'Switch0',
        x: 450,
        y: 250,
        gateway: '',
        ports: {
          'Fa0/1': { name: 'Fa0/1', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: true, vlan: 1, mode: 'access' },
          'Fa0/2': { name: 'Fa0/2', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: true, vlan: 1, mode: 'access' },
          'Fa0/3': { name: 'Fa0/3', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: false, vlan: 1, mode: 'access' },
          'Fa0/4': { name: 'Fa0/4', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: false, vlan: 1, mode: 'access' }
        },
        macTable: []
      };
      const pc1: any = {
        id: 'pc1',
        type: 'pc',
        name: 'PC1',
        x: 250,
        y: 250,
        gateway: '',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('pc'), ip: '192.168.1.10', mask: '255.255.255.0', up: true }
        }
      };
      const srv: any = {
        id: 'srv1',
        type: 'server',
        name: 'File-SRV',
        x: 650,
        y: 250,
        gateway: '',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('server'), ip: '192.168.1.20', mask: '255.255.255.0', up: true }
        }
      };
      devices = [sw1, pc1, srv];
      cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/1' },
        { id: 'c2', from: 'srv1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/2' }
      ];
      break;
    }

    case 'lab2':
    case 'subnets': {
      // Lab 02: Basic Router & Default Gateway
      const r1: any = {
        id: 'r1',
        type: 'router',
        name: 'R1-Core',
        x: 450,
        y: 200,
        gateway: '',
        ports: {
          'Gig0/0': { name: 'Gig0/0', medium: 'GigabitEthernet', mac: IpMath.generateMac('router'), ip: '', mask: '255.255.255.0', up: false },
          'Gig0/1': { name: 'Gig0/1', medium: 'GigabitEthernet', mac: IpMath.generateMac('router'), ip: '', mask: '255.255.255.0', up: false }
        },
        routes: []
      };
      const pc1: any = {
        id: 'pc1',
        type: 'pc',
        name: 'PC1',
        x: 250,
        y: 300,
        gateway: '192.168.10.1',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('pc'), ip: '192.168.10.10', mask: '255.255.255.0', up: true }
        }
      };
      const srv: any = {
        id: 'srv1',
        type: 'server',
        name: 'Web-SRV',
        x: 650,
        y: 300,
        gateway: '192.168.20.1',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('server'), ip: '192.168.20.50', mask: '255.255.255.0', up: true }
        }
      };
      devices = [r1, pc1, srv];
      cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'r1', toPort: 'Gig0/0' },
        { id: 'c2', from: 'srv1', fromPort: 'Eth0', to: 'r1', toPort: 'Gig0/1' }
      ];
      break;
    }

    case 'lab4':
    case 'static-route': {
      // Lab 04: Static Routing
      const r1: any = {
        id: 'r1',
        type: 'router',
        name: 'R1-HQ',
        x: 350,
        y: 200,
        gateway: '',
        ports: {
          'Gig0/0': { name: 'Gig0/0', medium: 'GigabitEthernet', mac: IpMath.generateMac('router'), ip: '192.168.10.1', mask: '255.255.255.0', up: true },
          'Gig0/1': { name: 'Gig0/1', medium: 'GigabitEthernet', mac: IpMath.generateMac('router'), ip: '10.0.0.1', mask: '255.255.255.252', up: true }
        },
        routes: []
      };
      const r2: any = {
        id: 'r2',
        type: 'router',
        name: 'R2-Branch',
        x: 550,
        y: 200,
        gateway: '',
        ports: {
          'Gig0/0': { name: 'Gig0/0', medium: 'GigabitEthernet', mac: IpMath.generateMac('router'), ip: '192.168.30.1', mask: '255.255.255.0', up: true },
          'Gig0/1': { name: 'Gig0/1', medium: 'GigabitEthernet', mac: IpMath.generateMac('router'), ip: '10.0.0.2', mask: '255.255.255.252', up: true }
        },
        routes: []
      };
      const pc1: any = {
        id: 'pc1',
        type: 'pc',
        name: 'HQ-PC',
        x: 200,
        y: 300,
        gateway: '192.168.10.1',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('pc'), ip: '192.168.10.10', mask: '255.255.255.0', up: true } }
      };
      const srv: any = {
        id: 'srv1',
        type: 'server',
        name: 'Branch-SRV',
        x: 700,
        y: 300,
        gateway: '192.168.30.1',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('server'), ip: '192.168.30.50', mask: '255.255.255.0', up: true } }
      };
      devices = [r1, r2, pc1, srv];
      cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'r1', toPort: 'Gig0/0' },
        { id: 'c2', from: 'r1', fromPort: 'Gig0/1', to: 'r2', toPort: 'Gig0/1' },
        { id: 'c3', from: 'r2', fromPort: 'Gig0/0', to: 'srv1', toPort: 'Eth0' }
      ];
      break;
    }

    case 'lab5': {
      // Lab 05: VLANs & 802.1Q Trunk
      const sw1: any = {
        id: 'sw1',
        type: 'switch',
        name: 'SW1',
        x: 350,
        y: 200,
        gateway: '',
        ports: {
          'Fa0/1': { name: 'Fa0/1', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: true, mode: 'access', vlan: 1 },
          'Fa0/2': { name: 'Fa0/2', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: true, mode: 'access', vlan: 10 },
          'Fa0/3': { name: 'Fa0/3', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: true, mode: 'access', vlan: 20 }
        }
      };
      const sw2: any = {
        id: 'sw2',
        type: 'switch',
        name: 'SW2',
        x: 550,
        y: 200,
        gateway: '',
        ports: {
          'Fa0/1': { name: 'Fa0/1', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: true, mode: 'access', vlan: 1 },
          'Fa0/2': { name: 'Fa0/2', medium: 'FastEthernet', mac: IpMath.generateMac('switch'), ip: '', mask: '', up: true, mode: 'access', vlan: 10 }
        }
      };
      const hr1: any = {
        id: 'hr1',
        type: 'pc',
        name: 'HR-PC1',
        x: 220,
        y: 120,
        gateway: '',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('pc'), ip: '192.168.10.11', mask: '255.255.255.0', up: true } }
      };
      const hr2: any = {
        id: 'hr2',
        type: 'pc',
        name: 'HR-PC2',
        x: 680,
        y: 120,
        gateway: '',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('pc'), ip: '192.168.10.12', mask: '255.255.255.0', up: true } }
      };
      const sales1: any = {
        id: 'sales1',
        type: 'pc',
        name: 'Sales-PC1',
        x: 220,
        y: 280,
        gateway: '',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('pc'), ip: '192.168.20.21', mask: '255.255.255.0', up: true } }
      };
      devices = [sw1, sw2, hr1, hr2, sales1];
      cables = [
        { id: 'cTrunk', from: 'sw1', fromPort: 'Fa0/1', to: 'sw2', toPort: 'Fa0/1' },
        { id: 'c1', from: 'hr1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/2' },
        { id: 'c2', from: 'sales1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/3' },
        { id: 'c3', from: 'hr2', fromPort: 'Eth0', to: 'sw2', toPort: 'Fa0/2' }
      ];
      break;
    }

    case 'lab11':
    case 'troubleshoot':
    default: {
      // Lab 11: Troubleshooting Challenge (Default Playground)
      const r1: any = {
        id: 'r1',
        type: 'router',
        name: 'R1-Gateway',
        x: 450,
        y: 200,
        gateway: '',
        ports: {
          'Gig0/0': { name: 'Gig0/0', medium: 'GigabitEthernet', mac: IpMath.generateMac('router'), ip: '192.168.10.1', mask: '255.255.255.0', up: true },
          'Gig0/1': { name: 'Gig0/1', medium: 'GigabitEthernet', mac: IpMath.generateMac('router'), ip: '192.168.20.1', mask: '255.255.255.0', up: false } // Fault 1: shutdown
        },
        routes: []
      };
      const pc1: any = {
        id: 'pc1',
        type: 'pc',
        name: 'PC1',
        x: 250,
        y: 300,
        gateway: '192.168.99.1', // Fault 2: wrong gateway
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('pc'), ip: '192.168.10.10', mask: '255.255.255.0', up: true }
        }
      };
      const srv: any = {
        id: 'srv1',
        type: 'server',
        name: 'Payroll-SRV',
        x: 650,
        y: 300,
        gateway: '192.168.20.1',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: IpMath.generateMac('server'), ip: '10.0.0.99', mask: '255.255.255.0', up: true } // Fault 3: wrong subnet
        }
      };
      devices = [r1, pc1, srv];
      cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'r1', toPort: 'Gig0/0' },
        { id: 'c2', from: 'r1', fromPort: 'Gig0/1', to: 'srv1', toPort: 'Eth0' }
      ];
      break;
    }
  }

  return {
    id: presetId,
    name: `Lab Preset ${presetId.toUpperCase()}`,
    description: 'Topology preset configuration',
    devices,
    cables
  };
}

