export type Step = {
  id: string;
  routine_id: string;
  name: string;
  emoji: string;
  duration_sec: number;
  position: number;
};

export type Routine = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  days: number[];
  start_time: string; // "HH:MM:SS"
  reminder: boolean;
  created_at?: string;
  steps?: Step[];
};

export type StepDraft = {
  id?: string;
  key: string;
  name: string;
  emoji: string;
  duration_sec: number;
};

export type RoutineDraft = {
  name: string;
  emoji: string;
  color: string;
  days: number[];
  hour: number;
  minute: number;
  reminder: boolean;
  steps: StepDraft[];
};
