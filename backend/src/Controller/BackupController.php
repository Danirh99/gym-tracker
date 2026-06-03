<?php

declare(strict_types=1);

namespace App\Controller;

use App\Application\Service\BackupService;
use App\Application\Service\BackupValidationException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class BackupController extends AbstractController
{
    public function __construct(private readonly BackupService $backupService)
    {
    }

    #[Route('/api/backups/export', name: 'api_backups_export', methods: ['GET'])]
    public function export(): JsonResponse
    {
        $data = $this->backupService->export();
        $filename = sprintf('gym-tracker-backup-%s.json', (new \DateTimeImmutable())->format('Y-m-d'));
        $response = $this->json($data);
        $response->headers->set('Content-Disposition', sprintf('attachment; filename="%s"', $filename));

        return $response;
    }

    #[Route('/api/backups/import', name: 'api_backups_import', methods: ['POST'])]
    public function import(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(['message' => 'El cuerpo de la peticion no es valido.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $result = $this->backupService->import($payload);
        } catch (BackupValidationException $exception) {
            return $this->json([
                'message' => 'El backup no es valido.',
                'errors' => $exception->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json([
            'message' => 'Backup importado correctamente.',
            'summary' => $result,
        ]);
    }
}
