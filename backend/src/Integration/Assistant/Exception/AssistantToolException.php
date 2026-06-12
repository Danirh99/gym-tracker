<?php

declare(strict_types=1);

namespace App\Integration\Assistant\Exception;

final class AssistantToolException extends \RuntimeException
{
    /**
     * @param array<string, string>|null $errors
     */
    public function __construct(
        private readonly int $statusCode,
        string $message,
        private readonly ?array $errors = null,
    ) {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * @return array<string, string>|null
     */
    public function errors(): ?array
    {
        return $this->errors;
    }
}
