export type WorkoutMood = 'mala' | 'normal' | 'buena' | 'muy_buena';

export type ExerciseType = 'strength' | 'cardio' | 'core' | 'other';

// Modelos de sesion, entrada y payloads usados por la API.
export interface WorkoutSet {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  speedKmh: number | null;
  incline: number | null;
  resistanceLevel: number | null;
  calories: number | null;
  notes: string | null;
}

export interface WorkoutEntry {
  id: number;
  exerciseId: number;
  exerciseName: string;
  type: ExerciseType;
  typeLabel: string;
  notes: string | null;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: number;
  name: string | null;
  displayName: string;
  sessionDate: string;
  mood: WorkoutMood | null;
  moodLabel: string | null;
  notes: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  exerciseCount: number;
  setCount: number;
  totalVolumeKg: number;
  cardioDurationSeconds: number;
  entries: WorkoutEntry[];
}

export interface WorkoutSessionResponse {
  item: WorkoutSession;
}

export interface WorkoutSessionListResponse {
  items: WorkoutSession[];
}

export interface CreateWorkoutSessionPayload {
  sessionDate: string;
  name: string | null;
  mood: WorkoutMood | null;
  notes: string | null;
}

export interface CreateWorkoutSetPayload {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  speedKmh?: number | null;
  incline?: number | null;
  resistanceLevel?: number | null;
  calories?: number | null;
  notes?: string | null;
}

export interface AddSessionExercisePayload {
  exerciseId: number;
  notes: string | null;
  sets: CreateWorkoutSetPayload[];
}
