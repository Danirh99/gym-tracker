<?php

namespace App\Entity;

use App\Repository\WorkoutEntryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: WorkoutEntryRepository::class)]
#[ORM\HasLifecycleCallbacks]
class WorkoutEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'workoutEntries')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private WorkoutSession $workoutSession;

    #[ORM\ManyToOne(inversedBy: 'workoutEntries')]
    #[ORM\JoinColumn(nullable: false)]
    private Exercise $exercise;

    #[ORM\Column]
    private int $orderIndex;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    /**
     * @var Collection<int, WorkoutSet>
     */
    #[ORM\OneToMany(mappedBy: 'workoutEntry', targetEntity: WorkoutSet::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $workoutSets;

    public function __construct(WorkoutSession $workoutSession, Exercise $exercise, int $orderIndex)
    {
        $now = new \DateTimeImmutable();
        $this->workoutSession = $workoutSession;
        $this->exercise = $exercise;
        $this->orderIndex = $orderIndex;
        $this->createdAt = $now;
        $this->updatedAt = $now;
        $this->workoutSets = new ArrayCollection();
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

    public function getWorkoutSession(): WorkoutSession
    {
        return $this->workoutSession;
    }

    public function setWorkoutSession(WorkoutSession $workoutSession): self
    {
        $this->workoutSession = $workoutSession;

        return $this;
    }

    public function getExercise(): Exercise
    {
        return $this->exercise;
    }

    public function setExercise(Exercise $exercise): self
    {
        $this->exercise = $exercise;

        return $this;
    }

    public function getOrderIndex(): int
    {
        return $this->orderIndex;
    }

    public function setOrderIndex(int $orderIndex): self
    {
        $this->orderIndex = $orderIndex;

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

    /**
     * @return Collection<int, WorkoutSet>
     */
    public function getWorkoutSets(): Collection
    {
        return $this->workoutSets;
    }

    public function addWorkoutSet(WorkoutSet $workoutSet): self
    {
        if (!$this->workoutSets->contains($workoutSet)) {
            $this->workoutSets->add($workoutSet);
            $workoutSet->setWorkoutEntry($this);
        }

        return $this;
    }

    public function removeWorkoutSet(WorkoutSet $workoutSet): self
    {
        $this->workoutSets->removeElement($workoutSet);

        return $this;
    }
}
