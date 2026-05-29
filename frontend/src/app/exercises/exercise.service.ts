import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateExercisePayload, ExerciseListResponse, ExerciseProgressResponse, ExerciseResponse } from './exercise.model';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  constructor(private readonly http: HttpClient) {}

  getExercises(): Observable<ExerciseListResponse> {
    // Trae el catalogo completo de ejercicios.
    return this.http.get<ExerciseListResponse>('/api/exercises');
  }

  getExercise(id: number): Observable<ExerciseResponse> {
    // Carga el detalle de un ejercicio concreto.
    return this.http.get<ExerciseResponse>(`/api/exercises/${id}`);
  }

  getExerciseProgress(id: number): Observable<ExerciseProgressResponse> {
    // Recupera el historico de rendimiento del ejercicio.
    return this.http.get<ExerciseProgressResponse>(`/api/exercises/${id}/progress`);
  }

  createExercise(payload: CreateExercisePayload): Observable<ExerciseResponse> {
    // Crea un ejercicio nuevo en backend.
    return this.http.post<ExerciseResponse>('/api/exercises', payload);
  }

  updateExercise(id: number, payload: CreateExercisePayload): Observable<ExerciseResponse> {
    // Actualiza los datos de un ejercicio existente.
    return this.http.put<ExerciseResponse>(`/api/exercises/${id}`, payload);
  }

  deleteExercise(id: number): Observable<void> {
    // Elimina el ejercicio solicitado.
    return this.http.delete<void>(`/api/exercises/${id}`);
  }
}
