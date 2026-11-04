import { describe, it, expect, beforeEach } from 'vitest';
import { useTopologyStore } from '../../src/application/stores/useTopologyStore';
import { CiscoCliStateMachine } from '../../src/core/cli/cisco-cli-parser';
import { PacketTracer } from '../../src/core/engine/packet-tracer';
import { IpMath } from '../../src/core/engine/ip-math';
import { LabGraderService } from '../../src/application/services/grader-service';
import { CCNA_ASSESSMENT_QUESTIONS } from '../../src/core/curriculum/assessment-data';
import { PRACTICAL_LABS_CATALOG } from '../../src/core/curriculum/syllabus-data';

describe('Real-World Usage & End-to-End System Integration Tests', () => {
  beforeEach(() => {
    useTopologyStore.setState({
      devices: [],
      cables: [],
      selectedDeviceId: null
    });
  });

  it('Journey 1: Full Topology Assembly, Multi-tier Cabling, and Port Auto-linking', () => {
    const store = useTopologyStore.getState();

    // 1. Add Devices to Canvas
    store.addDevice('router', 300, 200);
    store.addDevice('switch', 300, 300);
    store.addDevice('pc', 150, 400);
    store.addDevice('server', 450, 200);

    const { devices } = useTopologyStore.getState();
    expect(devices.length).toBe(4);

    const router = devices.find(d => d.type === 'router')!;
    const sw = devices.find(d => d.type === 'switch')!;
    const pc = devices.find(d => d.type === 'pc')!;
    const srv = devices.find(d => d.type === 'server')!;

    expect(router).toBeDefined();
    expect(sw).toBeDefined();
    expect(pc).toBeDefined();
    expect(srv).toBeDefined();

    // 2. Connect Cables across devices
    store.addCable(pc.id, 'eth0', sw.id, 'FastEthernet0/1');
    store.addCable(sw.id, 'FastEthernet0/2', router.id, 'GigabitEthernet0/0');
    store.addCable(router.id, 'GigabitEthernet0/1', srv.id, 'eth0');

    const { cables } = useTopologyStore.getState();
    expect(cables.length).toBe(3);

    // Verify cable IDs and endpoints
    expect(cables[0].from).toBe(pc.id);
    expect(cables[0].to).toBe(sw.id);
    expect(cables[1].from).toBe(sw.id);
    expect(cables[1].to).toBe(router.id);
    expect(cables[2].from).toBe(router.id);
    expect(cables[2].to).toBe(srv.id);
  });

  it('Journey 2: Cisco IOS CLI Interactive State Machine & Store Synchronization', () => {
    const store = useTopologyStore.getState();
    store.addDevice('router', 200, 200);
    const router = useTopologyStore.getState().devices[0];

    const cli = new CiscoCliStateMachine(router);

    // Execute standard Cisco configuration workflow
    const r1 = cli.execute('enable');
    expect(r1.prompt).toBe(`${router.name}#`);

    const r2 = cli.execute('configure terminal');
    expect(r2.prompt).toBe(`${router.name}(config)#`);

    const r3 = cli.execute('hostname R1-Core');
    expect(r3.prompt).toBe('R1-Core(config)#');
    expect(r3.stateChanged).toBe(true);

    // Sync back to store
    store.updateDevice(router.id, () => cli.getDevice());

    const r4 = cli.execute('interface gigabitethernet 0/0');
    expect(r4.prompt).toBe('R1-Core(config-if)#');

    const r5 = cli.execute('ip address 192.168.10.1 255.255.255.0');
    expect(r5.stateChanged).toBe(true);

    const r6 = cli.execute('no shutdown');
    expect(r6.output).toContain('changed state to up');

    store.updateDevice(router.id, () => cli.getDevice());

    // Verify synchronized device state
    const updatedDev = useTopologyStore.getState().devices.find(d => d.id === router.id)!;
    expect(updatedDev.name).toBe('R1-Core');
    expect(updatedDev.ports['Gig0/0'].ip).toBe('192.168.10.1');
    expect(updatedDev.ports['Gig0/0'].mask).toBe('255.255.255.0');
    expect(updatedDev.ports['Gig0/0'].up).toBe(true);

    // Test Command Autocomplete
    const completions = cli.autocomplete('sh');
    expect(completions).toContain('show');
  });

  it('Journey 3: Complete End-to-End Packet Routing (PC -> Switch -> Router -> Server)', () => {
    const store = useTopologyStore.getState();

    // Build functional topology
    store.addDevice('pc', 100, 100);
    store.addDevice('switch', 200, 100);
    store.addDevice('router', 300, 100);
    store.addDevice('server', 400, 100);

    const [pc, sw, r1, srv] = useTopologyStore.getState().devices;

    // Configure PC
    store.updateDevice(pc.id, (d) => ({
      ...d,
      gateway: '192.168.1.1',
      ports: {
        eth0: { name: 'eth0', mac: '00:11:22:33:44:01', ip: '192.168.1.10', mask: '255.255.255.0', up: true }
      }
    }));

    // Configure Switch ports
    store.updateDevice(sw.id, (d) => ({
      ...d,
      ports: {
        'FastEthernet0/1': { name: 'FastEthernet0/1', mac: '00:11:22:33:44:11', ip: '', mask: '', up: true, mode: 'access', vlan: 1 },
        'FastEthernet0/2': { name: 'FastEthernet0/2', mac: '00:11:22:33:44:12', ip: '', mask: '', up: true, mode: 'access', vlan: 1 }
      }
    }));

    // Configure Router R1 interfaces
    store.updateDevice(r1.id, (d) => ({
      ...d,
      ports: {
        'GigabitEthernet0/0': { name: 'GigabitEthernet0/0', mac: '00:11:22:33:44:21', ip: '192.168.1.1', mask: '255.255.255.0', up: true },
        'GigabitEthernet0/1': { name: 'GigabitEthernet0/1', mac: '00:11:22:33:44:22', ip: '10.0.0.1', mask: '255.255.255.0', up: true }
      }
    }));

    // Configure Server
    store.updateDevice(srv.id, (d) => ({
      ...d,
      gateway: '10.0.0.1',
      ports: {
        eth0: { name: 'eth0', mac: '00:11:22:33:44:31', ip: '10.0.0.100', mask: '255.255.255.0', up: true }
      }
    }));

    // Connect cables
    store.addCable(pc.id, 'eth0', sw.id, 'FastEthernet0/1');
    store.addCable(sw.id, 'FastEthernet0/2', r1.id, 'GigabitEthernet0/0');
    store.addCable(r1.id, 'GigabitEthernet0/1', srv.id, 'eth0');

    const state = useTopologyStore.getState();
    const curPc = state.devices.find(d => d.id === pc.id)!;
    const curSrv = state.devices.find(d => d.id === srv.id)!;

    // 1. Run ICMP Ping Simulation
    const pingRes = PacketTracer.trace(curPc, curSrv, state.devices, state.cables, 'icmp');
    expect(pingRes.success).toBe(true);
    expect(pingRes.hops.length).toBeGreaterThanOrEqual(4);

    // 2. Run HTTP Port 80 Web Simulation
    const httpRes = PacketTracer.trace(curPc, curSrv, state.devices, state.cables, 'tcp', 80);
    expect(httpRes.success).toBe(true);
  });

  it('Journey 4: ACL Firewall Rule Filtering and Packet Drop Telemetry', () => {
    const store = useTopologyStore.getState();

    store.addDevice('pc', 100, 100);
    store.addDevice('router', 200, 100);
    store.addDevice('server', 300, 100);

    const [pc, r1, srv] = useTopologyStore.getState().devices;

    store.updateDevice(pc.id, (d) => ({
      ...d,
      gateway: '192.168.1.1',
      ports: { eth0: { name: 'eth0', mac: '00:01', ip: '192.168.1.50', mask: '255.255.255.0', up: true } }
    }));

    store.updateDevice(srv.id, (d) => ({
      ...d,
      gateway: '10.0.0.1',
      ports: { eth0: { name: 'eth0', mac: '00:02', ip: '10.0.0.100', mask: '255.255.255.0', up: true } }
    }));

    // Configure R1 with ACL 100 denying host 192.168.1.50
    store.updateDevice(r1.id, (d) => ({
      ...d,
      ports: {
        'GigabitEthernet0/0': { name: 'GigabitEthernet0/0', mac: '00:11', ip: '192.168.1.1', mask: '255.255.255.0', up: true, aclIn: 100 },
        'GigabitEthernet0/1': { name: 'GigabitEthernet0/1', mac: '00:12', ip: '10.0.0.1', mask: '255.255.255.0', up: true }
      },
      acls: [
        {
          id: 100,
          type: 'extended',
          rules: [
            {
              id: '100-1',
              action: 'deny',
              protocol: 'icmp',
              src: '192.168.1.50',
              srcWildcard: '0.0.0.0',
              dst: 'any',
              dstWildcard: '255.255.255.255',
              hits: 0
            },
            {
              id: '100-2',
              action: 'permit',
              protocol: 'ip',
              src: 'any',
              srcWildcard: '255.255.255.255',
              dst: 'any',
              dstWildcard: '255.255.255.255',
              hits: 0
            }
          ]
        }
      ]
    }));

    store.addCable(pc.id, 'eth0', r1.id, 'GigabitEthernet0/0');
    store.addCable(r1.id, 'GigabitEthernet0/1', srv.id, 'eth0');

    const state = useTopologyStore.getState();
    const curPc = state.devices.find(d => d.id === pc.id)!;
    const curSrv = state.devices.find(d => d.id === srv.id)!;

    // ICMP Ping should be DENIED by ACL
    const pingRes = PacketTracer.trace(curPc, curSrv, state.devices, state.cables, 'icmp');
    expect(pingRes.success).toBe(false);
    expect(pingRes.aclBlocked).toBe(true);

    // HTTP Web should be PERMITTED by the second rule
    const httpRes = PacketTracer.trace(curPc, curSrv, state.devices, state.cables, 'tcp', 80);
    expect(httpRes.success).toBe(true);
  });

  it('Journey 5: Subnet Calculator Accuracy & IPv4 Math Validation', () => {
    // Test Class C /24
    const c24 = IpMath.calculateSubnetDetails('192.168.10.45', 24);
    expect(c24.networkAddress).toBe('192.168.10.0');
    expect(c24.broadcastAddress).toBe('192.168.10.255');
    expect(c24.firstHost).toBe('192.168.10.1');
    expect(c24.lastHost).toBe('192.168.10.254');
    expect(c24.usableHosts).toBe(254);
    expect(c24.wildcard).toBe('0.0.0.255');

    // Test Point-to-Point WAN /30
    const wan30 = IpMath.calculateSubnetDetails('10.0.0.5', 30);
    expect(wan30.networkAddress).toBe('10.0.0.4');
    expect(wan30.broadcastAddress).toBe('10.0.0.7');
    expect(wan30.firstHost).toBe('10.0.0.5');
    expect(wan30.lastHost).toBe('10.0.0.6');
    expect(wan30.usableHosts).toBe(2);
    expect(wan30.wildcard).toBe('0.0.0.3');
  });

  it('Journey 6: CCNA Diagnostic Assessment Questions Integrity & Syllabus Mapping', () => {
    expect(CCNA_ASSESSMENT_QUESTIONS.length).toBe(10);
    CCNA_ASSESSMENT_QUESTIONS.forEach(q => {
      expect(q.id).toBeDefined();
      expect(q.options.length).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
      expect(q.conceptSummary).toBeTruthy();
      expect(q.diagnosticWhyWrong).toBeTruthy();
      expect(q.cliRef).toBeTruthy();
    });

    expect(PRACTICAL_LABS_CATALOG.length).toBeGreaterThanOrEqual(2);
    const lab1 = PRACTICAL_LABS_CATALOG.find(l => l.id === 'lab1')!;
    expect(lab1.objectives.length).toBeGreaterThan(0);
    expect(lab1.procedure.length).toBeGreaterThan(0);
  });

  it('Journey 7: Grader Negative Verification on Empty/Broken Configuration', () => {
    // Evaluate Lab 1 on an empty topology
    const reportEmpty = LabGraderService.evaluate([], [], 'lab1');
    expect(reportEmpty.percent).toBe(0);
    expect(reportEmpty.passedCount).toBe(0);
  });
});
