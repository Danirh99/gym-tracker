const LABELS: Record<string, string> = {
  abs: 'Abdominales',
  back: 'Espalda',
  biceps: 'Bíceps',
  calves: 'Gemelos',
  cardio: 'Cardio',
  chest: 'Pecho',
  core: 'Core',
  front_delts: 'Deltoides frontal',
  glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales',
  hip_flexors: 'Flexores de cadera',
  lats: 'Dorsales',
  legs: 'Piernas',
  lower_back: 'Lumbar',
  obliques: 'Oblicuos',
  quads: 'Cuádriceps',
  shoulders: 'Hombros',
  traps: 'Trapecios',
  triceps: 'Tríceps',
};

export function muscleGroupLabel(value: string): string {
  return LABELS[value] ?? value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
