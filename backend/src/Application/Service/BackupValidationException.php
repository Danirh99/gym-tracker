<?php

declare(strict_types=1);

namespace App\Application\Service;

final class BackupValidationException extends \RuntimeException
{
    /**
     * @param list<string> $errors
     */
    public function __construct(private readonly array $errors)
    {
        parent::__construct('El backup no es valido.');
    }

    /**
     * @return list<string>
     */
    public function errors(): array
    {
        return $this->errors;
    }
}
