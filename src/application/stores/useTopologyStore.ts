import { create } from 'zustand';
import { NetworkDevice, NetworkCable, DeviceType } from '@core/types';
import { IpMath } from '@core/engine/ip-math';

interface TopologyState {
  devices: NetworkDevice[];
  cables: NetworkCable[];
  selectedDeviceId: string | null;
  activePresetId: string;
  counters: { router: number; switch: number; pc: number; server: number; cloud: number };

  // Actions
  selectDevice: (id: string | null) => void;
  updateDevicePosition: (id: string, x: number, y: number) => void;
  addDevice: (type: DeviceType, x: number, y: number, name?: string) => NetworkDevice;
  removeDevice: (id: string) => void;
  addCable: (from: string, fromPort: string, to: string, toPort: string) => NetworkCable;
  removeCable: (id: string) => void;
  setTopology: (devices: NetworkDevice[], cables: NetworkCable[], presetId?: string) => void;
  resetTopology: () => void;
}

export const useTopologyStore = create<TopologyState>((set, get) => ({
  devices: [],
  cables: [],
  selectedDeviceId: null,
  activePresetId: 'lab1',
  counters: { router: 0, switch: 0, pc: 1, server: 1, cloud: 1 },

  selectDevice: (id) => set({ selectedDeviceId: id }),

  updateDevicePosition: (id, x, y) => set((state) => ({
    devices: state.devices.map(d => d.id === id ? { ...d, x: Math.round(x), y: Math.round(y) } : d)
  })),

  addDevice: (type, x, y, customName) => {
    const state = get();
    const id = `dev_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const nextCounters = { ...state.counters };
    let name = customName;
    let ports: any = {};

    if (type === 'router') {
      name = name || `R${++nextCounters.router}`;
      ports = {
        'Gig0/0': { name: 'Gig0/0', ip: '', mask: '255.255.255.0', up: false, mac: IpMath.generateMac('router') },
        'Gig0/1': { name: 'Gig0/1', ip: '', mask: '255.255.255.0', up: false, mac: IpMath.generateMac('router') },
        'Gig0/2': { name: 'Gig0/2', ip: '', mask: '255.255.255.0', up: false, mac: IpMath.generateMac('router') }
      };
    } else if (type === 'switch') {
      name = name || `SW${++nextCounters.switch}`;
      ports = {
        'Fa0/1': { name: 'Fa0/1', ip: '', mask: '', up: true, vlan: 1, mode: 'access', mac: IpMath.generateMac('switch') },
        'Fa0/2': { name: 'Fa0/2', ip: '', mask: '', up: true, vlan: 1, mode: 'access', mac: IpMath.generateMac('switch') },
        'Fa0/3': { name: 'Fa0/3', ip: '', mask: '', up: true, vlan: 1, mode: 'access', mac: IpMath.generateMac('switch') },
        'Fa0/4': { name: 'Fa0/4', ip: '', mask: '', up: true, vlan: 1, mode: 'access', mac: IpMath.generateMac('switch') }
      };
    } else if (type === 'pc') {
      name = name || `PC${nextCounters.pc++}`;
      ports = {
        'Eth0': { name: 'Eth0', ip: '', mask: '255.255.255.0', up: true, mac: IpMath.generateMac('pc') }
      };
    } else if (type === 'server') {
      name = name || `SRV${nextCounters.server++}`;
      ports = {
        'Eth0': { name: 'Eth0', ip: '', mask: '255.255.255.0', up: true, mac: IpMath.generateMac('server') }
      };
    } else {
      name = name || `Cloud${nextCounters.cloud++}`;
      ports = {
        'WAN0': { name: 'WAN0', ip: '8.8.8.8', mask: '255.255.255.0', up: true, mac: IpMath.generateMac('cloud') }
      };
    }

    const newDevice: any = {
      id,
      type,
      name,
      x: Math.round(x),
      y: Math.round(y),
      ports,
      gateway: '',
      arpTable: {},
      routes: [],
      acls: [],
      natEnabled: false,
      natTranslations: [],
      ospf: { processId: null, networks: [] }
    };

    set({
      devices: [...state.devices, newDevice],
      selectedDeviceId: id,
      counters: nextCounters
    });

    return newDevice;
  },

  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter(d => d.id !== id),
    cables: state.cables.filter(c => c.from !== id && c.to !== id),
    selectedDeviceId: state.selectedDeviceId === id ? null : state.selectedDeviceId
  })),

  addCable: (from, fromPort, to, toPort) => {
    const id = `cable_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newCable: NetworkCable = { id, from, fromPort, to, toPort };
    set((state) => ({
      cables: [...state.cables, newCable]
    }));
    return newCable;
  },

  removeCable: (id) => set((state) => ({
    cables: state.cables.filter(c => c.id !== id)
  })),

  setTopology: (devices, cables, presetId = 'custom') => set({
    devices,
    cables,
    activePresetId: presetId,
    selectedDeviceId: devices[0]?.id || null
  }),

  resetTopology: () => set({
    devices: [],
    cables: [],
    selectedDeviceId: null,
    activePresetId: 'blank'
  })
}));
