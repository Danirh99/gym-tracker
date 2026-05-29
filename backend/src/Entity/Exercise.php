<?php

namespace App\Entity;

use App\Repository\ExerciseRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ExerciseRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Exercise
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\Column(enumType: ExerciseType::class)]
    private ExerciseType $type;

    #[ORM\Column(type: Types::JSON)]
    private array $muscleGroups = [];

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    /**
     * @var Collection<int, WorkoutEntry>
     */
    #[ORM\OneToMany(mappedBy: 'exercise', targetEntity: WorkoutEntry::class)]
    private Collection $workoutEntries;

    public function __construct(string $name, ExerciseType $type)
    {
        $now = new \DateTimeImmutable();
        $this->name = $name;
        $this->type = $type;
        $this->createdAt = $now;
        $this->updatedAt = $now;
        $this->workoutEntries = new ArrayCollection();
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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getType(): ExerciseType
    {
        return $this->type;
    }

    public function setType(ExerciseType $type): self
    {
        $this->type = $type;

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getMuscleGroups(): array
    {
        return $this->muscleGroups;
    }

    /**
     * @param list<string> $muscleGroups
     */
    public function setMuscleGroups(array $muscleGroups): self
    {
        $this->muscleGroups = array_values($muscleGroups);

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

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;

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
     * @return Collection<int, WorkoutEntry>
     */
    public function getWorkoutEntries(): Collection
    {
        return $this->workoutEntries;
    }

    public function addWorkoutEntry(WorkoutEntry $workoutEntry): self
    {
        if (!$this->workoutEntries->contains($workoutEntry)) {
            $this->workoutEntries->add($workoutEntry);
            $workoutEntry->setExercise($this);
        }

        return $this;
    }

    public function removeWorkoutEntry(WorkoutEntry $workoutEntry): self
    {
        $this->workoutEntries->removeElement($workoutEntry);

        return $this;
    }
}
