<?php

declare(strict_types=1);

namespace App\Integration\Assistant\Security;

use Symfony\Component\HttpFoundation\Request;

final class AssistantToolGuard
{
    public function __construct(private readonly ?string $token = null)
    {
    }

    public function isAuthorized(Request $request): bool
    {
        $expectedToken = $this->configuredToken();

        if ($expectedToken === null) {
            return false;
        }

        $authorizationHeader = $request->headers->get('Authorization', '');
        $assistantTokenHeader = $request->headers->get('X-Gym-Tracker-Assistant-Token', '');

        return hash_equals('Bearer '.$expectedToken, $authorizationHeader)
            || hash_equals($expectedToken, $assistantTokenHeader);
    }

    public function hasConfiguredToken(): bool
    {
        return $this->configuredToken() !== null;
    }

    private function configuredToken(): ?string
    {
        $token = $this->token
            ?? $_ENV['GYM_TRACKER_ASSISTANT_TOKEN']
            ?? $_SERVER['GYM_TRACKER_ASSISTANT_TOKEN']
            ?? null;

        if (!is_string($token) || trim($token) === '') {
            return null;
        }

        return trim($token);
    }
}
