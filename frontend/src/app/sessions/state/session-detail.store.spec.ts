import { SessionDetailStore } from './session-detail.store';
import { WorkoutEntry, WorkoutSession } from '../session.model';

describe('SessionDetailStore', () => {
  function createSession(): WorkoutSession {
    return {
      id: 1,
      name: 'Sesion',
      displayName: 'Sesion',
      sessionDate: '2026-05-27',
      mood: null,
      moodLabel: null,
      notes: null,
      startedAt: null,
      finishedAt: null,
      exerciseCount: 0,
      setCount: 0,
      totalVolumeKg: 0,
      cardioDurationSeconds: 0,
      entries: [],
    };
  }

  function createEntry(): WorkoutEntry {
    return {
      id: 10,
      exerciseId: 1,
      exerciseName: 'Press',
      type: 'strength',
      typeLabel: 'Fuerza',
      notes: null,
      sets: [],
    };
  }

  it('manages modal and deleting states', () => {
    const store = new SessionDetailStore();
    const entry = createEntry();

    store.openExerciseTypeModal();
    expect(store.showExerciseTypeModal()).toBe(true);
    store.closeExerciseTypeModal();
    expect(store.showExerciseTypeModal()).toBe(false);

    store.openDeleteDialog(entry);
    expect(store.showDeleteDialog()).toBe(true);
    expect(store.entryPendingDeletion()).toEqual(entry);

    store.startDeleting();
    expect(store.isDeletingEntry()).toBe(true);

    store.finishDeleting(createSession());
    expect(store.isDeletingEntry()).toBe(false);
    expect(store.showDeleteDialog()).toBe(false);
    expect(store.entryPendingDeletion()).toBeNull();
  });
});
