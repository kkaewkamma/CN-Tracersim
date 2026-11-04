export interface PracticalLab {
  id: string;
  number: string;
  title: string;
  netacadRef: string;
  difficulty: string;
  presetId: string;
  linkedLessonId?: string;
  objectives: string[];
  topologyDesc: string;
  devices: string[];
  scenario: string;
  procedure: string[];
  commands: string[];
  expectedResults: string;
  verification: string[];
  graderCriteria: string[];
  hintsAndSolution: string;
  autoDemoCommands?: Array<{ device: string; cmds: string[] }>;
}

export interface LabCriterionGrade {
  label: string;
  passed: boolean;
  reason: string;
  isCustom?: boolean;
}

export interface LabEvaluationReport {
  title: string;
  checks: LabCriterionGrade[];
  passedCount: number;
  percent: number;
  percentage: number;
}

