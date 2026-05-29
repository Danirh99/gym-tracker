import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateExercisePayload,
  ExerciseListResponse,
  ExerciseProgressResponse,
  ExerciseResponse,
} from '../exercise.model';
import { ExerciseService } from '../exercise.service';

@Injectable({ providedIn: 'root' })
export class ExercisesFacade {
  constructor(private readonly exerciseService: ExerciseService) {}

  list(): Observable<ExerciseListResponse> {
    // Delegacion fina para listar ejercicios.
    return this.exerciseService.getExercises();
  }

  detail(id: number): Observable<ExerciseResponse> {
    // Delegacion fina para leer un ejercicio.
    return this.exerciseService.getExercise(id);
  }

  progress(id: number): Observable<ExerciseProgressResponse> {
    // Delegacion fina para leer progreso.
    return this.exerciseService.getExerciseProgress(id);
  }

  create(payload: CreateExercisePayload): Observable<ExerciseResponse> {
    // Delegacion fina para crear un ejercicio.
    return this.exerciseService.createExercise(payload);
  }

  update(id: number, payload: CreateExercisePayload): Observable<ExerciseResponse> {
    // Delegacion fina para actualizar un ejercicio.
    return this.exerciseService.updateExercise(id, payload);
  }

  delete(id: number): Observable<void> {
    // Delegacion fina para borrar un ejercicio.
    return this.exerciseService.deleteExercise(id);
  }
}
