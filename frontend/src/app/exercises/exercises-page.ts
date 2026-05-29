import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { normalizeSearchText } from '../core/utils/string.utils';
import { BottomNavComponent } from '../shared/bottom-nav.component';
import { ThemeToggleButtonComponent } from '../shared/theme-toggle-button.component';
import { Exercise, ExerciseType } from './exercise.model';
import { ExercisesFacade } from './state/exercises.facade';

type ExerciseFilter = 'all' | ExerciseType;

interface FilterChip {
  value: ExerciseFilter;
  label: string;
}

@Component({
  selector: 'app-exercises-page',
  imports: [FormsModule, RouterLink, ThemeToggleButtonComponent, BottomNavComponent],
  templateUrl: './exercises-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExercisesPage implements OnInit {
  readonly filters: FilterChip[] = [
    { value: 'all', label: 'Todos' },
    { value: 'strength', label: 'Fuerza' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'core', label: 'Abdomen' },
    { value: 'other', label: 'Otros' },
  ];

  exercises: Exercise[] = [];
  selectedFilter: ExerciseFilter = 'all';
  searchTerm = '';
  isLoading = true;
  errorMessage: string | null = null;
  toastMessage: string | null = null;

  constructor(
    private readonly exercisesFacade: ExercisesFacade,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Recupera toast de alta y luego carga el listado.
    this.showCreationToastFromNavigation();
    this.loadExercises();
  }

  loadExercises(): void {
    // Pide el catalogo completo a la fachada.
    this.isLoading = true;
    this.errorMessage = null;

    this.exercisesFacade.list().subscribe({
      next: ({ items }) => {
        this.exercises = items;
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'No se han podido cargar los ejercicios.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  filteredExercises(): Exercise[] {
    // Aplica filtro por tipo y busqueda tolerante a tildes.
    const normalizedSearch = normalizeSearchText(this.searchTerm);

    return this.exercises.filter((exercise) => {
      const matchesType = this.selectedFilter === 'all' || exercise.type === this.selectedFilter;
      const searchableText = normalizeSearchText(
        [exercise.name, exercise.typeLabel, ...exercise.muscleGroups].join(' '),
      );

      return matchesType && searchableText.includes(normalizedSearch);
    });
  }

  selectFilter(filter: ExerciseFilter): void {
    // Cambia el chip activo del filtro.
    this.selectedFilter = filter;
  }

  muscleGroupsText(exercise: Exercise): string {
    // Muestra los grupos musculares o un texto vacio.
    return exercise.muscleGroups.length > 0 ? exercise.muscleGroups.join(', ') : 'Sin grupo muscular';
  }

  trackByExerciseId(_: number, exercise: Exercise): number {
    // Mantiene estable la identidad de cada fila.
    return exercise.id;
  }

  animationDelay(index: number): number {
    // Escalona la aparicion visual de las tarjetas.
    return Math.min(index * 42, 260);
  }

  private showCreationToastFromNavigation(): void {
    // Recupera un mensaje persistido desde la pantalla de alta.
    const message = window.sessionStorage.getItem('exerciseToast');

    if (message === null || message.trim() === '') {
      return;
    }

    this.toastMessage = message.trim();
    window.sessionStorage.removeItem('exerciseToast');

    window.setTimeout(() => {
      this.toastMessage = null;
      this.changeDetectorRef.markForCheck();
    }, 2800);
  }
}
