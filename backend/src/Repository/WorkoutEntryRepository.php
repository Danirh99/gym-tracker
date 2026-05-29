<?php

namespace App\Repository;

use App\Entity\Exercise;
use App\Entity\WorkoutEntry;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<WorkoutEntry>
 */
class WorkoutEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WorkoutEntry::class);
    }

    /**
     * @return list<WorkoutEntry>
     */
    public function findByExerciseWithSessionAndSets(Exercise $exercise): array
    {
        $result = $this->createQueryBuilder('entry')
            ->join('entry.workoutSession', 'session')
            ->addSelect('session')
            ->leftJoin('entry.workoutSets', 'workoutSet')
            ->addSelect('workoutSet')
            ->andWhere('entry.exercise = :exercise')
            ->setParameter('exercise', $exercise)
            ->orderBy('session.sessionDate', 'DESC')
            ->addOrderBy('entry.id', 'DESC')
            ->getQuery()
            ->getResult();

        return is_array($result) ? array_values(array_filter($result, static fn (mixed $entry): bool => $entry instanceof WorkoutEntry)) : [];
    }

    public function findLatestByExercise(Exercise $exercise): ?WorkoutEntry
    {
        $entry = $this->createQueryBuilder('entry')
            ->join('entry.workoutSession', 'session')
            ->andWhere('entry.exercise = :exercise')
            ->setParameter('exercise', $exercise)
            ->orderBy('session.sessionDate', 'DESC')
            ->addOrderBy('entry.id', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $entry instanceof WorkoutEntry ? $entry : null;
    }
}
