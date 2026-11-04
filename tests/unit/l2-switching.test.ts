import { describe, it, expect } from 'vitest';
import { L2SwitchingEngine } from '../../src/core/engine/l2-switching';

describe('Core Engine: L2 Switching, Port Security & STP', () => {
  it('enforces Port Security sticky learning and shutdown violation into err-disabled', () => {
    const sw: any = {
      name: 'SW1',
      ports: {
        'Fa0/1': {
          up: true,
          errDisabled: false,
          portSecurity: {
            enabled: true,
            maximum: 1,
            sticky: true,
            violation: 'shutdown',
            secureMacs: [],
            violationCount: 0
          }
        }
      }
    };

    // First frame learns Sticky MAC
    const p1 = L2SwitchingEngine.checkSwitchPortSecurity(sw, 'Fa0/1', '0050.7966.0001');
    expect(p1.permitted).toBe(true);
    expect(sw.ports['Fa0/1'].portSecurity.secureMacs).toContain('0050.7966.0001');

    // Rogue MAC -> Triggers Shutdown Violation
    const p2 = L2SwitchingEngine.checkSwitchPortSecurity(sw, 'Fa0/1', '0050.7966.9999');
    expect(p2.permitted).toBe(false);
    expect(p2.violation).toBe(true);
    expect(sw.ports['Fa0/1'].errDisabled).toBe(true);
    expect(sw.ports['Fa0/1'].up).toBe(false);
  });

  it('elects Root Bridge and blocks redundant links unless bundled into EtherChannel', () => {
    const sw1: any = { id: 'sw1', name: 'SW1-Core', type: 'switch', stpPriority: 24576, ports: { 'Fa0/1': {}, 'Fa0/2': {} } };
    const sw2: any = { id: 'sw2', name: 'SW2-Access', type: 'switch', stpPriority: 32768, ports: { 'Fa0/1': {}, 'Fa0/2': {} } };

    const cables = [
      { id: 'c1', from: 'sw1', fromPort: 'Fa0/1', to: 'sw2', toPort: 'Fa0/1' },
      { id: 'c2', from: 'sw1', fromPort: 'Fa0/2', to: 'sw2', toPort: 'Fa0/2' }
    ];

    // Unbundled -> STP blocks 1 link on non-root switch (SW2)
    const blockedBefore = L2SwitchingEngine.computeStpBlockedPorts([sw1, sw2], cables);
    expect(blockedBefore.size).toBe(1);
    expect(blockedBefore.has('sw2:Fa0/2')).toBe(true);

    // EtherChannel bundled -> 0 blocked ports!
    sw1.ports['Fa0/1'].channelGroup = { id: 1, mode: 'active' };
    sw1.ports['Fa0/2'].channelGroup = { id: 1, mode: 'active' };
    sw2.ports['Fa0/1'].channelGroup = { id: 1, mode: 'passive' };
    sw2.ports['Fa0/2'].channelGroup = { id: 1, mode: 'passive' };

    const blockedAfter = L2SwitchingEngine.computeStpBlockedPorts([sw1, sw2], cables);
    expect(blockedAfter.size).toBe(0);
  });
});

