import { describe, it, expect, beforeEach } from 'vitest';
import { useTopologyStore } from '../../src/application/stores/useTopologyStore';

describe('Application Layer: Zustand Topology Store', () => {
  beforeEach(() => {
    useTopologyStore.getState().resetTopology();
  });

  it('adds and selects devices correctly', () => {
    const store = useTopologyStore.getState();
    const router = store.addDevice('router', 100, 200, 'R1');

    expect(router.name).toBe('R1');
    expect(useTopologyStore.getState().devices.length).toBe(1);
    expect(useTopologyStore.getState().selectedDeviceId).toBe(router.id);
  });

  it('manages cables and automatically cleans up when device is removed', () => {
    const store = useTopologyStore.getState();
    const r1 = store.addDevice('router', 100, 200, 'R1');
    const r2 = store.addDevice('router', 300, 200, 'R2');

    store.addCable(r1.id, 'Gig0/0', r2.id, 'Gig0/0');
    expect(useTopologyStore.getState().cables.length).toBe(1);

    // Remove R1 -> Cable must be automatically removed
    store.removeDevice(r1.id);
    expect(useTopologyStore.getState().devices.length).toBe(1);
    expect(useTopologyStore.getState().cables.length).toBe(0);
  });
});

