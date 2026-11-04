import { create } from 'zustand';

interface AcademyState {
  activeLessonId: string;
  activePracticalLabId: string;
  preTestScore: number | null;
  postTestScore: number | null;
  completedLabs: Record<string, { score: number; completedAt: string }>;
  learningStages: {
    learn: boolean;
    configure: boolean;
    simulate: boolean;
    inspect: boolean;
    troubleshoot: boolean;
    evaluate: boolean;
  };

  setActiveLesson: (id: string) => void;
  setActiveLab: (id: string) => void;
  recordLabScore: (labId: string, score: number) => void;
  setPreTestScore: (score: number) => void;
  setPostTestScore: (score: number) => void;
  markStage: (stage: keyof AcademyState['learningStages']) => void;
}

export const useAcademyStore = create<AcademyState>((set) => ({
  activeLessonId: 'ch01-network-layer',
  activePracticalLabId: 'lab1',
  preTestScore: null,
  postTestScore: null,
  completedLabs: {},
  learningStages: {
    learn: true,
    configure: false,
    simulate: false,
    inspect: false,
    troubleshoot: false,
    evaluate: false
  },

  setActiveLesson: (id) => set({ activeLessonId: id }),
  setActiveLab: (id) => set({ activePracticalLabId: id }),
  recordLabScore: (labId, score) => set((state) => ({
    completedLabs: {
      ...state.completedLabs,
      [labId]: { score, completedAt: new Date().toISOString() }
    }
  })),
  setPreTestScore: (score) => set({ preTestScore: score }),
  setPostTestScore: (score) => set({ postTestScore: score }),
  markStage: (stage) => set((state) => ({
    learningStages: { ...state.learningStages, [stage]: true }
  }))
}));
