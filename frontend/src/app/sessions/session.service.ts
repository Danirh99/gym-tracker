import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AddSessionExercisePayload, CreateWorkoutSessionPayload, WorkoutSessionListResponse, WorkoutSessionResponse } from './session.model';

@Injectable({ providedIn: 'root' })
export class WorkoutSessionService {
  constructor(private readonly http: HttpClient) {}

  createSession(payload: CreateWorkoutSessionPayload): Observable<WorkoutSessionResponse> {
    // Crea una sesion de entrenamiento.
    return this.http.post<WorkoutSessionResponse>('/api/workout-sessions', payload);
  }

  getRecentSessions(limit = 3): Observable<WorkoutSessionListResponse> {
    // Obtiene las sesiones mas recientes.
    return this.http.get<WorkoutSessionListResponse>('/api/workout-sessions', { params: { limit } });
  }

  getSessionsByMonth(year: number, month: number): Observable<WorkoutSessionListResponse> {
    // Filtra sesiones por mes calendario.
    return this.http.get<WorkoutSessionListResponse>('/api/workout-sessions', {
      params: { year, month },
    });
  }

  getAllSessions(): Observable<WorkoutSessionListResponse> {
    // Recupera todas las sesiones.
    return this.http.get<WorkoutSessionListResponse>('/api/workout-sessions', {
      params: { all: true },
    });
  }

  getSession(id: number): Observable<WorkoutSessionResponse> {
    // Trae el detalle completo de una sesion.
    return this.http.get<WorkoutSessionResponse>(`/api/workout-sessions/${id}`);
  }

  addExerciseToSession(sessionId: number, payload: AddSessionExercisePayload): Observable<WorkoutSessionResponse> {
    // Agrega una nueva entrada a una sesion.
    return this.http.post<WorkoutSessionResponse>(`/api/workout-sessions/${sessionId}/entries`, payload);
  }

  deleteSessionExercise(sessionId: number, entryId: number): Observable<WorkoutSessionResponse> {
    // Borra una entrada concreta de la sesion.
    return this.http.delete<WorkoutSessionResponse>(`/api/workout-sessions/${sessionId}/entries/${entryId}`);
  }

  updateSessionExercise(sessionId: number, entryId: number, payload: AddSessionExercisePayload): Observable<WorkoutSessionResponse> {
    // Actualiza notas y series de una entrada existente.
    return this.http.put<WorkoutSessionResponse>(`/api/workout-sessions/${sessionId}/entries/${entryId}`, payload);
  }
}
