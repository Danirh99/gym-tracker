<?php

namespace App\Entity;

use App\Repository\WorkoutSetRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: WorkoutSetRepository::class)]
#[ORM\HasLifecycleCallbacks]
class WorkoutSet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'workoutSets')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private WorkoutEntry $workoutEntry;

    #[ORM\Column]
    private int $setNumber;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $weightKg = null;

    #[ORM\Column(nullable: true)]
    private ?int $reps = null;

    #[ORM\Column(nullable: true)]
    private ?int $durationSeconds = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $distanceMeters = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $speedKmh = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    private ?float $incline = null;

    #[ORM\Column(nullable: true)]
    private ?int $resistanceLevel = null;

    #[ORM\Column(nullable: true)]
    private ?int $calories = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(WorkoutEntry $workoutEntry, int $setNumber)
    {
        $now = new \DateTimeImmutable();
        $this->workoutEntry = $workoutEntry;
        $this->setNumber = $setNumber;
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTimeImmutable();
        $this->createdAt ??= $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getWorkoutEntry(): WorkoutEntry
    {
        return $this->workoutEntry;
    }

    public function setWorkoutEntry(WorkoutEntry $workoutEntry): self
    {
        $this->workoutEntry = $workoutEntry;

        return $this;
    }

    public function getSetNumber(): int
    {
        return $this->setNumber;
    }

    public function setSetNumber(int $setNumber): self
    {
        $this->setNumber = $setNumber;

        return $this;
    }

    public function getWeightKg(): ?float
    {
        return $this->weightKg;
    }

    public function setWeightKg(?float $weightKg): self
    {
        $this->weightKg = $weightKg;

        return $this;
    }

    public function getReps(): ?int
    {
        return $this->reps;
    }

    public function setReps(?int $reps): self
    {
        $this->reps = $reps;

        return $this;
    }

    public function getDurationSeconds(): ?int
    {
        return $this->durationSeconds;
    }

    public function setDurationSeconds(?int $durationSeconds): self
    {
        $this->durationSeconds = $durationSeconds;

        return $this;
    }

    public function getDistanceMeters(): ?float
    {
        return $this->distanceMeters;
    }

    public function setDistanceMeters(?float $distanceMeters): self
    {
        $this->distanceMeters = $distanceMeters;

        return $this;
    }

    public function getSpeedKmh(): ?float
    {
        return $this->speedKmh;
    }

    public function setSpeedKmh(?float $speedKmh): self
    {
        $this->speedKmh = $speedKmh;

        return $this;
    }

    public function getIncline(): ?float
    {
        return $this->incline;
    }

    public function setIncline(?float $incline): self
    {
        $this->incline = $incline;

        return $this;
    }

    public function getResistanceLevel(): ?int
    {
        return $this->resistanceLevel;
    }

    public function setResistanceLevel(?int $resistanceLevel): self
    {
        $this->resistanceLevel = $resistanceLevel;

        return $this;
    }

    public function getCalories(): ?int
    {
        return $this->calories;
    }

    public function setCalories(?int $calories): self
    {
        $this->calories = $calories;

        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): self
    {
        $this->notes = $notes;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
