export interface BackupImportSummary {
  exercisesCreated: number;
  exercisesMatched: number;
  sessionsCreated: number;
  sessionsSkipped: number;
}

export interface BackupImportResponse {
  message: string;
  summary: BackupImportSummary;
}
