import { create } from 'zustand';
import { PacketSimulationResult } from '@core/engine/packet-tracer';

export type ActiveTool = 'select' | 'cable' | 'packet' | 'http' | 'delete';
export type SimMode = 'realtime' | 'step';

export type ModalType = 
  | 'none' 
  | 'cli' 
  | 'config' 
  | 'inspect_pdu' 
  | 'academy' 
  | 'presets' 
  | 'subnet_calc' 
  | 'grader_report' 
  | 'import_export'
  | 'logs';

interface SessionState {
  currentTool: ActiveTool;
  simMode: SimMode;
  cableSource: { deviceId: string; portName: string } | null;
  packetSource: { deviceId: string; protocol: 'icmp' | 'tcp' } | null;
  lastSimulationResult: PacketSimulationResult | null;
  activeModal: ModalType;
  modalDeviceId: string | null;

  setTool: (tool: ActiveTool) => void;
  setSimMode: (mode: SimMode) => void;
  setCableSource: (source: { deviceId: string; portName: string } | null) => void;
  setPacketSource: (source: { deviceId: string; protocol: 'icmp' | 'tcp' } | null) => void;
  setLastSimulationResult: (result: PacketSimulationResult | null) => void;
  openModal: (modal: ModalType, deviceId?: string) => void;
  closeModal: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentTool: 'select',
  simMode: 'realtime',
  cableSource: null,
  packetSource: null,
  lastSimulationResult: null,
  activeModal: 'none',
  modalDeviceId: null,

  setTool: (tool) => set({ currentTool: tool, cableSource: null, packetSource: null }),
  setSimMode: (mode) => set({ simMode: mode }),
  setCableSource: (source) => set({ cableSource: source }),
  setPacketSource: (source) => set({ packetSource: source }),
  setLastSimulationResult: (result) => set({ lastSimulationResult: result }),
  openModal: (modal, deviceId) => set({ activeModal: modal, modalDeviceId: deviceId || null }),
  closeModal: () => set({ activeModal: 'none', modalDeviceId: null })
}));
