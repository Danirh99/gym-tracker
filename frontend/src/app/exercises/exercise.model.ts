export type ExerciseType = 'strength' | 'cardio' | 'core' | 'other';

// Contratos de dominio del catalogo de ejercicios y su progreso.
export interface Exercise {
  id: number;
  name: string;
  type: ExerciseType;
  typeLabel: string;
  muscleGroups: string[];
  notes: string | null;
  icon: string;
  lastPerformance: string | null;
}

export interface ExerciseListResponse {
  items: Exercise[];
}

export interface CreateExercisePayload {
  name: string;
  type: ExerciseType;
  muscleGroups: string[];
  notes: string | null;
}

export interface ExerciseResponse {
  item: Exercise;
}

export interface ExerciseProgressSummary {
  sessions: number;
  bestTopSet: string | null;
  lastTopSet: string | null;
  totalVolumeKg: number;
  totalDurationSeconds: number;
}

export type ExerciseRecommendationAction = 'increase' | 'maintain' | 'decrease';
export type ExerciseRecommendationConfidence = 'low' | 'medium' | 'high';

export interface ExerciseProgressRecommendation {
  action: ExerciseRecommendationAction;
  reason: string;
  suggestedWeightKg: number | null;
  deltaKg: number | null;
  confidence: ExerciseRecommendationConfidence;
}

export interface ExerciseProgressSet {
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

export interface ExerciseProgressEntry {
  sessionId: number | null;
  sessionDate: string;
  entryId: number | null;
  topSet: string | null;
  topSetWeightKg: number | null;
  topSetReps: number | null;
  volumeKg: number;
  durationSeconds: number;
  setsCount: number;
  sets: ExerciseProgressSet[];
}

export interface ExerciseProgressResponse {
  item: Exercise;
  summary: ExerciseProgressSummary;
  items: ExerciseProgressEntry[];
  recommendation: ExerciseProgressRecommendation;
}
