<?php

namespace App\Repository;

use App\Entity\WorkoutSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<WorkoutSession>
 */
class WorkoutSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WorkoutSession::class);
    }

    /**
     * @return list<WorkoutSession>
     */
    public function findRecent(int $limit = 3): array
    {
        return $this->createQueryBuilder('session')
            ->orderBy('session.sessionDate', 'DESC')
            ->addOrderBy('session.id', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return list<WorkoutSession>
     */
    public function findByMonth(
        \DateTimeImmutable $from,
        \DateTimeImmutable $to,
    ): array {
        return $this->createQueryBuilder('session')
            ->andWhere('session.sessionDate >= :from')
            ->andWhere('session.sessionDate <= :to')
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->orderBy('session.sessionDate', 'DESC')
            ->addOrderBy('session.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return list<WorkoutSession>
     */
    public function findAllOrdered(): array
    {
        return $this->createQueryBuilder('session')
            ->orderBy('session.sessionDate', 'DESC')
            ->addOrderBy('session.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
