import { create } from 'zustand';

export interface NetworkEventLog {
  id: string;
  timestamp: string;
  type: 'SIM_ICMP' | 'SIM_HTTP' | 'CLI' | 'CONFIG' | 'PRESET' | 'TOPOLOGY' | 'SECURITY';
  status: 'ok' | 'fail' | 'info' | 'warn';
  title: string;
  details: string;
}

interface EventLogState {
  logs: NetworkEventLog[];
  addLog: (log: Omit<NetworkEventLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useEventLogStore = create<EventLogState>((set) => ({
  logs: [
    {
      id: 'init_1',
      timestamp: new Date().toLocaleTimeString('th-TH'),
      type: 'TOPOLOGY',
      status: 'info',
      title: 'CN-Tracersim Core Engine v5.2 Ready',
      details: 'เริ่มต้นระบบจำลองเครือข่ายและโหลดผังระบบเรียบร้อย พร้อมใช้งาน 12 แล็บและ Cisco CLI'
    }
  ],

  addLog: (log) => set((state) => ({
    logs: [
      {
        ...log,
        id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString('th-TH')
      },
      ...state.logs.slice(0, 99) // Keep last 100 logs
    ]
  })),

  clearLogs: () => set({ logs: [] })
}));
