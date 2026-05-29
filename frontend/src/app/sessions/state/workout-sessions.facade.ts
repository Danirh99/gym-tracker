import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkoutSessionListResponse, WorkoutSessionResponse } from '../session.model';
import { WorkoutSessionService } from '../session.service';

@Injectable({ providedIn: 'root' })
export class WorkoutSessionsFacade {
  constructor(private readonly sessionService: WorkoutSessionService) {}

  recent(limit = 3): Observable<WorkoutSessionListResponse> {
    // Delegacion fina para las sesiones recientes.
    return this.sessionService.getRecentSessions(limit);
  }

  all(): Observable<WorkoutSessionListResponse> {
    // Delegacion fina para listar todo el historial.
    return this.sessionService.getAllSessions();
  }

  byMonth(year: number, month: number): Observable<WorkoutSessionListResponse> {
    // Delegacion fina para el calendario mensual.
    return this.sessionService.getSessionsByMonth(year, month);
  }

  detail(id: number): Observable<WorkoutSessionResponse> {
    // Delegacion fina para detalle de sesion.
    return this.sessionService.getSession(id);
  }

  create(payload: Parameters<WorkoutSessionService['createSession']>[0]): Observable<WorkoutSessionResponse> {
    // Delegacion fina para crear una sesion.
    return this.sessionService.createSession(payload);
  }

  addEntry(sessionId: number, payload: Parameters<WorkoutSessionService['addExerciseToSession']>[1]): Observable<WorkoutSessionResponse> {
    // Delegacion fina para agregar una entrada.
    return this.sessionService.addExerciseToSession(sessionId, payload);
  }

  removeEntry(sessionId: number, entryId: number): Observable<WorkoutSessionResponse> {
    // Delegacion fina para borrar una entrada.
    return this.sessionService.deleteSessionExercise(sessionId, entryId);
  }
}
