<?php

namespace App\Repository;

use App\Entity\Exercise;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Exercise>
 */
class ExerciseRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Exercise::class);
    }

    /**
     * @return list<Exercise>
     */
    public function findActiveOrderedByName(): array
    {
        return $this->createQueryBuilder('exercise')
            ->andWhere('exercise.isActive = :isActive')
            ->setParameter('isActive', true)
            ->orderBy('LOWER(exercise.name)', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
