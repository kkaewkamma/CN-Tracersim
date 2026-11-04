import { create } from 'zustand';

export type ActiveTool = 'select' | 'cable' | 'packet' | 'http' | 'delete';
export type SimMode = 'realtime' | 'step';

interface SessionState {
  currentTool: ActiveTool;
  simMode: SimMode;
  cableSource: { deviceId: string; portName: string } | null;
  activeModal: 'none' | 'cli' | 'config' | 'inspect_pdu' | 'academy' | 'presets' | 'subnet_calc';
  modalDeviceId: string | null;

  setTool: (tool: ActiveTool) => void;
  setSimMode: (mode: SimMode) => void;
  setCableSource: (source: { deviceId: string; portName: string } | null) => void;
  openModal: (modal: SessionState['activeModal'], deviceId?: string) => void;
  closeModal: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentTool: 'select',
  simMode: 'realtime',
  cableSource: null,
  activeModal: 'none',
  modalDeviceId: null,

  setTool: (tool) => set({ currentTool: tool, cableSource: null }),
  setSimMode: (mode) => set({ simMode: mode }),
  setCableSource: (source) => set({ cableSource: source }),
  openModal: (modal, deviceId) => set({ activeModal: modal, modalDeviceId: deviceId || null }),
  closeModal: () => set({ activeModal: 'none', modalDeviceId: null })
}));
