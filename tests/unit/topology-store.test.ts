import { describe, it, expect, beforeEach } from 'vitest';
import { useTopologyStore } from '../../src/application/stores/useTopologyStore';
import { LabGraderService } from '../../src/application/services/grader-service';

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

  it('loads preset topologies (Lab 1 & Lab 11) and updates activePresetId', () => {
    const store = useTopologyStore.getState();
    
    // Load Lab 1 preset
    store.loadPreset('lab1');
    expect(useTopologyStore.getState().activePresetId).toBe('lab1');
    expect(useTopologyStore.getState().devices.length).toBeGreaterThan(0);
    expect(useTopologyStore.getState().cables.length).toBeGreaterThan(0);

    // Evaluate Lab 1 with live grader
    const reportLab1 = LabGraderService.evaluate(
      useTopologyStore.getState().devices,
      useTopologyStore.getState().cables,
      'lab1'
    );
    expect(reportLab1.checks.length).toBe(3);
    expect(reportLab1.percent).toBeGreaterThanOrEqual(60);

    // Load Lab 11 preset (Enterprise Troubleshooting Challenge)
    store.loadPreset('lab11');
    expect(useTopologyStore.getState().activePresetId).toBe('lab11');
    expect(useTopologyStore.getState().devices.length).toBeGreaterThan(0);
    const reportLab11 = LabGraderService.evaluate(
      useTopologyStore.getState().devices,
      useTopologyStore.getState().cables,
      'lab11'
    );
    expect(reportLab11.checks.length).toBe(4);
  });

  it('imports and restores topology state via setTopology (JSON restore)', () => {
    const store = useTopologyStore.getState();
    store.addDevice('pc', 150, 150, 'Client-PC');
    const exportedDevices = [...useTopologyStore.getState().devices];
    const exportedCables = [...useTopologyStore.getState().cables];

    // Reset store
    store.resetTopology();
    expect(useTopologyStore.getState().devices.length).toBe(0);

    // Restore via setTopology
    store.setTopology(exportedDevices, exportedCables, 'custom_lab');
    expect(useTopologyStore.getState().activePresetId).toBe('custom_lab');
    expect(useTopologyStore.getState().devices.length).toBe(exportedDevices.length);
    expect(useTopologyStore.getState().devices[0].name).toBe('Client-PC');
  });
});
