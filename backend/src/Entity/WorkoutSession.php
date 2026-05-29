<?php

namespace App\Entity;

use App\Repository\WorkoutSessionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: WorkoutSessionRepository::class)]
#[ORM\HasLifecycleCallbacks]
class WorkoutSession
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private \DateTimeImmutable $sessionDate;

    #[ORM\Column(length: 30, nullable: true)]
    private ?string $mood = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $startedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $finishedAt = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    /**
     * @var Collection<int, WorkoutEntry>
     */
    #[ORM\OneToMany(mappedBy: 'workoutSession', targetEntity: WorkoutEntry::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $workoutEntries;

    public function __construct(\DateTimeImmutable $sessionDate, ?string $name = null)
    {
        $now = new \DateTimeImmutable();
        $this->sessionDate = $sessionDate;
        $this->name = $name;
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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getSessionDate(): \DateTimeImmutable
    {
        return $this->sessionDate;
    }

    public function setSessionDate(\DateTimeImmutable $sessionDate): self
    {
        $this->sessionDate = $sessionDate;

        return $this;
    }

    public function getMood(): ?string
    {
        return $this->mood;
    }

    public function setMood(?string $mood): self
    {
        $this->mood = $mood;

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

    public function getStartedAt(): ?\DateTimeImmutable
    {
        return $this->startedAt;
    }

    public function setStartedAt(?\DateTimeImmutable $startedAt): self
    {
        $this->startedAt = $startedAt;

        return $this;
    }

    public function getFinishedAt(): ?\DateTimeImmutable
    {
        return $this->finishedAt;
    }

    public function setFinishedAt(?\DateTimeImmutable $finishedAt): self
    {
        $this->finishedAt = $finishedAt;

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
            $workoutEntry->setWorkoutSession($this);
        }

        return $this;
    }

    public function removeWorkoutEntry(WorkoutEntry $workoutEntry): self
    {
        $this->workoutEntries->removeElement($workoutEntry);

        return $this;
    }
}
