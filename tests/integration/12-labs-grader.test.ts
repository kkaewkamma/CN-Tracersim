import { describe, it, expect } from 'vitest';
import { LabGraderService } from '../../src/application/services/grader-service';
import { PacketTracer } from '../../src/core/engine/packet-tracer';
import { NetworkDevice, NetworkCable } from '../../src/core/types';

describe('LabGraderService & PacketTracer Integration Suite', () => {
  it('evaluates all 12 NetAcad practical labs schema and checks', () => {
    const labIds = [
      'lab1', 'lab2', 'lab3', 'lab4', 'lab5', 'lab6',
      'lab7', 'lab8', 'lab9', 'lab10', 'lab11', 'lab12'
    ];

    for (const labId of labIds) {
      const report = LabGraderService.evaluate([], [], labId);
      expect(report.checks.length).toBeGreaterThanOrEqual(3);
      expect(report.title).toBeDefined();
      expect(typeof report.percent).toBe('number');
      expect(report.percentage).toBe(report.percent);
    }
  });

  it('verifies multi-hop packet path: PC ➔ Switch ➔ Router ➔ Server', () => {
    const devices: NetworkDevice[] = [
      {
        id: 'pc1',
        type: 'pc',
        name: 'PC1',
        x: 50,
        y: 100,
        gateway: '192.168.10.1',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11:22:33:44:01', ip: '192.168.10.10', mask: '255.255.255.0', up: true }
        }
      } as any,
      {
        id: 'sw1',
        type: 'switch',
        name: 'SW1',
        x: 150,
        y: 100,
        gateway: '',
        ports: {
          'Fa0/1': { name: 'Fa0/1', medium: 'FastEthernet', mac: '00:11:22:33:44:02', ip: '', mask: '', up: true, vlan: 1, mode: 'access' },
          'Fa0/2': { name: 'Fa0/2', medium: 'FastEthernet', mac: '00:11:22:33:44:03', ip: '', mask: '', up: true, vlan: 1, mode: 'access' }
        }
      } as any,
      {
        id: 'r1',
        type: 'router',
        name: 'R1',
        x: 250,
        y: 100,
        gateway: '',
        ports: {
          'Gig0/0': { name: 'Gig0/0', medium: 'GigabitEthernet', mac: '00:11:22:33:44:04', ip: '192.168.10.1', mask: '255.255.255.0', up: true },
          'Gig0/1': { name: 'Gig0/1', medium: 'GigabitEthernet', mac: '00:11:22:33:44:05', ip: '192.168.20.1', mask: '255.255.255.0', up: true }
        },
        routes: []
      } as any,
      {
        id: 'srv1',
        type: 'server',
        name: 'Server1',
        x: 350,
        y: 100,
        gateway: '192.168.20.1',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11:22:33:44:06', ip: '192.168.20.50', mask: '255.255.255.0', up: true }
        }
      } as any
    ];

    const cables: NetworkCable[] = [
      { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/1' },
      { id: 'c2', from: 'sw1', fromPort: 'Fa0/2', to: 'r1', toPort: 'Gig0/0' },
      { id: 'c3', from: 'r1', fromPort: 'Gig0/1', to: 'srv1', toPort: 'Eth0' }
    ];

    // Positive Test: Full Forwarding
    const resSuccess = PacketTracer.trace(devices[0], devices[3], devices, cables, 'icmp');
    expect(resSuccess.success).toBe(true);
    expect(resSuccess.hops.length).toBeGreaterThanOrEqual(4);

    // Negative Test: Router Gig0/1 Shutdown -> Fails with Drop Reason
    devices[2].ports['Gig0/1'].up = false;
    const resDrop = PacketTracer.trace(devices[0], devices[3], devices, cables, 'icmp');
    expect(resDrop.success).toBe(false);
    expect(resDrop.dropStage).toBe('routing');

    // Negative Test: PC lacks Default Gateway -> Fails
    devices[2].ports['Gig0/1'].up = true;
    devices[0].gateway = '';
    const resNoGw = PacketTracer.trace(devices[0], devices[3], devices, cables, 'icmp');
    expect(resNoGw.success).toBe(false);
    expect(resNoGw.reason).toContain('Default Gateway');
  });

  it('tests Lab 5: VLAN Isolation correctly blocks cross-VLAN traffic without router', () => {
    const devices: NetworkDevice[] = [
      {
        id: 'sw1',
        type: 'switch',
        name: 'SW1',
        x: 100,
        y: 100,
        gateway: '',
        ports: {
          'Fa0/1': { name: 'Fa0/1', medium: 'FastEthernet', mac: '00:01', ip: '', mask: '', up: true, mode: 'trunk' },
          'Fa0/2': { name: 'Fa0/2', medium: 'FastEthernet', mac: '00:02', ip: '', mask: '', up: true, mode: 'access', vlan: 10 },
          'Fa0/3': { name: 'Fa0/3', medium: 'FastEthernet', mac: '00:03', ip: '', mask: '', up: true, mode: 'access', vlan: 20 }
        }
      } as any,
      {
        id: 'sw2',
        type: 'switch',
        name: 'SW2',
        x: 200,
        y: 100,
        gateway: '',
        ports: {
          'Fa0/1': { name: 'Fa0/1', medium: 'FastEthernet', mac: '00:04', ip: '', mask: '', up: true, mode: 'trunk' },
          'Fa0/2': { name: 'Fa0/2', medium: 'FastEthernet', mac: '00:05', ip: '', mask: '', up: true, mode: 'access', vlan: 10 }
        }
      } as any,
      {
        id: 'hr1',
        type: 'pc',
        name: 'HR-PC1',
        x: 50,
        y: 50,
        gateway: '',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:06', ip: '192.168.10.11', mask: '255.255.255.0', up: true } }
      } as any,
      {
        id: 'hr2',
        type: 'pc',
        name: 'HR-PC2',
        x: 250,
        y: 50,
        gateway: '',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:07', ip: '192.168.10.12', mask: '255.255.255.0', up: true } }
      } as any,
      {
        id: 'sales1',
        type: 'pc',
        name: 'Sales-PC1',
        x: 50,
        y: 150,
        gateway: '',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:08', ip: '192.168.10.21', mask: '255.255.255.0', up: true } }
      } as any
    ];

    const cables: NetworkCable[] = [
      { id: 'cTrunk', from: 'sw1', fromPort: 'Fa0/1', to: 'sw2', toPort: 'Fa0/1' },
      { id: 'c1', from: 'hr1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/2' },
      { id: 'c2', from: 'hr2', fromPort: 'Eth0', to: 'sw2', toPort: 'Fa0/2' },
      { id: 'c3', from: 'sales1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/3' }
    ];

    // Same VLAN 10 cross-switch ping succeeds
    const sameVlan = PacketTracer.trace(devices[2], devices[3], devices, cables, 'icmp');
    expect(sameVlan.success).toBe(true);

    // Cross VLAN 10 ➔ 20 ping fails due to VLAN Isolation
    const crossVlan = PacketTracer.trace(devices[2], devices[4], devices, cables, 'icmp');
    expect(crossVlan.success).toBe(false);
    expect(crossVlan.dropStage).toBe('l2_vlan');

    // Auto-Grader confirms 100%
    const grade = LabGraderService.evaluate(devices, cables, 'lab5');
    expect(grade.percent).toBe(100);

    // Negative Test: If trunk port is not set to trunk, grade drops
    devices[0].ports['Fa0/1'].mode = 'access';
    const gradeFailed = LabGraderService.evaluate(devices, cables, 'lab5');
    expect(gradeFailed.percent).toBeLessThan(100);
  });

  it('tests Lab 9: ACL Firewall blocks Ping but permits HTTP', () => {
    const devices: NetworkDevice[] = [
      {
        id: 'pc1',
        type: 'pc',
        name: 'Staff-PC',
        x: 50,
        y: 100,
        gateway: '192.168.10.1',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11', ip: '192.168.10.10', mask: '255.255.255.0', up: true } }
      } as any,
      {
        id: 'r1',
        type: 'router',
        name: 'R1-FW',
        x: 150,
        y: 100,
        gateway: '',
        ports: {
          'Gig0/0': { name: 'Gig0/0', medium: 'GigabitEthernet', mac: '00:12', ip: '192.168.10.1', mask: '255.255.255.0', up: true, aclIn: 100 },
          'Gig0/1': { name: 'Gig0/1', medium: 'GigabitEthernet', mac: '00:13', ip: '192.168.20.1', mask: '255.255.255.0', up: true }
        },
        acls: [
          {
            id: 100,
            type: 'extended',
            rules: [
              { id: 10, action: 'permit', protocol: 'tcp', src: '192.168.10.0', srcWildcard: '0.0.0.255', dst: '192.168.20.0', dstWildcard: '0.0.0.255', dstPort: 80, hits: 0 },
              { id: 20, action: 'deny', protocol: 'icmp', src: 'any', srcWildcard: '', dst: 'any', dstWildcard: '', hits: 0 }
            ]
          }
        ],
        routes: []
      } as any,
      {
        id: 'srv1',
        type: 'server',
        name: 'Web-SRV',
        x: 250,
        y: 100,
        gateway: '192.168.20.1',
        ports: { 'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:14', ip: '192.168.20.10', mask: '255.255.255.0', up: true } }
      } as any
    ];

    const cables: NetworkCable[] = [
      { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'r1', toPort: 'Gig0/0' },
      { id: 'c2', from: 'r1', fromPort: 'Gig0/1', to: 'srv1', toPort: 'Eth0' }
    ];

    // ICMP Ping is blocked by ACL
    const pingRes = PacketTracer.trace(devices[0], devices[2], devices, cables, 'icmp');
    expect(pingRes.success).toBe(false);
    expect(pingRes.aclBlocked).toBe(true);

    // HTTP Port 80 is permitted by ACL
    const httpRes = PacketTracer.trace(devices[0], devices[2], devices, cables, 'tcp', 80);
    expect(httpRes.success).toBe(true);

    // Auto-Grader confirms 100%
    const grade = LabGraderService.evaluate(devices, cables, 'lab9');
    expect(grade.percent).toBe(100);

    // Negative Test: If ACL permits Ping, rule 2 fails
    (devices[1] as any).acls[0].rules = [
      { id: 10, action: 'permit', protocol: 'ip', src: 'any', srcWildcard: '', dst: 'any', dstWildcard: '', hits: 0 }
    ];
    const gradeBadAcl = LabGraderService.evaluate(devices, cables, 'lab9');
    expect(gradeBadAcl.percent).toBeLessThan(100);
  });
});
