import { describe, it, expect } from 'vitest';
import { LabGraderService } from '../../src/application/services/grader-service';
import { NetworkDevice, NetworkCable } from '../../src/core/types';

describe('LabGraderService Integration Suite', () => {
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

  it('correctly grades Lab 01 when devices are properly configured', () => {
    const devices: NetworkDevice[] = [
      {
        id: 'sw1',
        type: 'switch',
        name: 'SW-Floor1',
        x: 100,
        y: 100,
        gateway: '',
        ports: {
          'Fa0/1': { name: 'Fa0/1', medium: 'FastEthernet', mac: '00:11:22:33:44:01', ip: '', mask: '', up: true },
          'Fa0/2': { name: 'Fa0/2', medium: 'FastEthernet', mac: '00:11:22:33:44:02', ip: '', mask: '', up: true }
        },
        enableSecret: 'cisco123'
      } as any,
      {
        id: 'pc1',
        type: 'pc',
        name: 'PC1',
        x: 50,
        y: 100,
        gateway: '',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11:22:33:44:03', ip: '192.168.1.10', mask: '255.255.255.0', up: true }
        }
      } as any,
      {
        id: 'srv1',
        type: 'server',
        name: 'File-SRV',
        x: 150,
        y: 100,
        gateway: '',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11:22:33:44:04', ip: '192.168.1.20', mask: '255.255.255.0', up: true }
        }
      } as any
    ];

    const cables: NetworkCable[] = [
      { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/1' },
      { id: 'c2', from: 'srv1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/2' }
    ];

    const report = LabGraderService.evaluate(devices, cables, 'lab1');
    expect(report.passedCount).toBe(3);
    expect(report.percent).toBe(100);
    expect(report.percentage).toBe(100);
  });

  it('correctly grades Lab 11 (Troubleshooting) fixing 3 faults', () => {
    // Before fix: 0% or partial
    const devicesBroken: NetworkDevice[] = [
      {
        id: 'r1',
        type: 'router',
        name: 'R1-Gateway',
        x: 100,
        y: 100,
        gateway: '',
        ports: {
          'Gig0/1': { name: 'Gig0/1', medium: 'GigabitEthernet', mac: '00:11:22:33:44:11', ip: '192.168.20.1', mask: '255.255.255.0', up: false }
        }
      } as any,
      {
        id: 'pc1',
        type: 'pc',
        name: 'PC1',
        x: 50,
        y: 100,
        gateway: '192.168.99.1', // Wrong gateway
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11:22:33:44:12', ip: '192.168.10.10', mask: '255.255.255.0', up: true }
        }
      } as any,
      {
        id: 'srv1',
        type: 'server',
        name: 'Payroll-SRV',
        x: 150,
        y: 100,
        gateway: '192.168.20.1',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11:22:33:44:13', ip: '10.0.0.99', mask: '255.255.255.0', up: true } // Wrong subnet
        }
      } as any
    ];

    const reportBroken = LabGraderService.evaluate(devicesBroken, [], 'lab11');
    expect(reportBroken.percent).toBe(0);

    // After fix: 100%
    const devicesFixed: NetworkDevice[] = [
      {
        id: 'r1',
        type: 'router',
        name: 'R1-Gateway',
        x: 100,
        y: 100,
        gateway: '',
        ports: {
          'Gig0/1': { name: 'Gig0/1', medium: 'GigabitEthernet', mac: '00:11:22:33:44:11', ip: '192.168.20.1', mask: '255.255.255.0', up: true } // Fault 1 fixed: no shut
        }
      } as any,
      {
        id: 'pc1',
        type: 'pc',
        name: 'PC1',
        x: 50,
        y: 100,
        gateway: '192.168.10.1', // Fault 2 fixed: correct default gateway
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11:22:33:44:12', ip: '192.168.10.10', mask: '255.255.255.0', up: true }
        }
      } as any,
      {
        id: 'srv1',
        type: 'server',
        name: 'Payroll-SRV',
        x: 150,
        y: 100,
        gateway: '192.168.20.1',
        ports: {
          'Eth0': { name: 'Eth0', medium: 'FastEthernet', mac: '00:11:22:33:44:13', ip: '192.168.20.100', mask: '255.255.255.0', up: true } // Fault 3 fixed: correct IP
        }
      } as any
    ];

    const reportFixed = LabGraderService.evaluate(devicesFixed, [], 'lab11');
    expect(reportFixed.passedCount).toBe(4);
    expect(reportFixed.percent).toBe(100);
  });
});

