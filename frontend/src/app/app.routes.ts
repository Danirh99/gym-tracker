import { Routes } from '@angular/router';

export const routes: Routes = [
  // Pantalla principal.
  { path: '', loadComponent: () => import('./home/home-page').then((m) => m.HomePage) },
  // Graficas y analitica.
  { path: 'charts', loadComponent: () => import('./charts/charts-page').then((m) => m.ChartsPage) },
  // Calendario mensual.
  { path: 'calendar', loadComponent: () => import('./calendar/calendar-page').then((m) => m.CalendarPage) },
  // Centro de estado offline y sincronizacion.
  { path: 'offline', loadComponent: () => import('./offline/offline-center-page').then((m) => m.OfflineCenterPage) },
  // Alertas y recomendaciones de entrenamiento.
  { path: 'alerts', loadComponent: () => import('./alerts/alerts-page').then((m) => m.AlertsPage) },
  // Alta de sesiones.
  { path: 'sessions/new', loadComponent: () => import('./sessions/new-session-page').then((m) => m.NewSessionPage) },
  // Edicion de ejercicio de fuerza dentro de una sesion.
  {
    path: 'sessions/:id/exercises/:entryId/edit/strength',
    loadComponent: () => import('./sessions/add-session-exercise-page').then((m) => m.AddSessionExercisePage),
  },
  // Edicion de ejercicio por tipo dinamico dentro de una sesion.
  {
    path: 'sessions/:id/exercises/:entryId/edit/:type',
    loadComponent: () => import('./sessions/add-session-exercise-by-type-page').then((m) => m.AddSessionExerciseByTypePage),
  },
  // Alta de ejercicio de fuerza dentro de una sesion.
  {
    path: 'sessions/:id/exercises/new/strength',
    loadComponent: () => import('./sessions/add-session-exercise-page').then((m) => m.AddSessionExercisePage),
  },
  // Alta de ejercicio por tipo dinamico dentro de una sesion.
  {
    path: 'sessions/:id/exercises/new/:type',
    loadComponent: () => import('./sessions/add-session-exercise-by-type-page').then((m) => m.AddSessionExerciseByTypePage),
  },
  // Detalle de sesion.
  { path: 'sessions/:id', loadComponent: () => import('./sessions/session-detail-page').then((m) => m.SessionDetailPage) },
  // Alta de ejercicio catalogo.
  { path: 'exercises/new', loadComponent: () => import('./exercises/create-exercise-page').then((m) => m.CreateExercisePage) },
  // Edicion de ejercicio.
  { path: 'exercises/:id/edit', loadComponent: () => import('./exercises/edit-exercise-page').then((m) => m.EditExercisePage) },
  // Detalle de ejercicio.
  { path: 'exercises/:id', loadComponent: () => import('./exercises/exercise-detail-page').then((m) => m.ExerciseDetailPage) },
  // Listado de ejercicios.
  { path: 'exercises', loadComponent: () => import('./exercises/exercises-page').then((m) => m.ExercisesPage) },
  // Redireccion por defecto.
  { path: '**', redirectTo: '' },
];
