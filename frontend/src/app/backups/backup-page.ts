import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackupImportSummary } from './backup.model';
import { BackupService } from './backup.service';

@Component({
  selector: 'app-backup-page',
  imports: [RouterLink],
  templateUrl: './backup-page.html',
})
export class BackupPage {
  selectedFileName: string | null = null;
  selectedPayload: unknown = null;
  canImport = false;
  isExporting = false;
  isImporting = false;
  feedbackMessage: string | null = null;
  feedbackTone: 'success' | 'error' = 'success';
  summary: BackupImportSummary | null = null;

  constructor(private readonly backupService: BackupService) {}

  exportBackup(): void {
    this.isExporting = true;
    this.feedbackMessage = null;

    this.backupService.exportBackup().subscribe({
      next: (response) => {
        const blob = response.body;
        if (blob === null) {
          this.showFeedback('No se pudo generar el archivo de backup.', 'error');
          this.isExporting = false;
          return;
        }

        this.downloadBlob(blob, this.exportFilename(response.headers.get('Content-Disposition')));
        this.showFeedback('Backup exportado correctamente.', 'success');
        this.isExporting = false;
      },
      error: () => {
        this.showFeedback('No se pudo exportar el backup.', 'error');
        this.isExporting = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.summary = null;
    this.selectedPayload = null;
    this.canImport = false;
    this.selectedFileName = file?.name ?? null;

    if (file === null) {
      return;
    }

    file.text()
      .then((content) => {
        const payload = JSON.parse(content);
      if (payload === null || Array.isArray(payload) || typeof payload !== 'object') {
        throw new Error('Invalid backup payload');
      }

        window.setTimeout(() => {
          this.selectedPayload = payload;
          this.canImport = true;
          this.showFeedback('Archivo listo para importar.', 'success');
        }, 0);
      })
      .catch(() => {
        window.setTimeout(() => {
          this.showFeedback('El archivo seleccionado no contiene JSON valido.', 'error');
          this.selectedPayload = null;
          this.canImport = false;
        }, 0);
      });
  }

  importBackup(): void {
    if (!this.canImport || this.selectedPayload === null) {
      this.showFeedback('Selecciona un archivo de backup antes de importar.', 'error');
      return;
    }

    this.isImporting = true;
    this.summary = null;

    this.backupService.importBackup(this.selectedPayload).subscribe({
      next: (response) => {
        this.summary = response.summary;
        this.showFeedback(response.message, 'success');
        this.isImporting = false;
      },
      error: (error) => {
        const errors = Array.isArray(error?.error?.errors) ? ` ${error.error.errors.join(' ')}` : '';
        this.showFeedback(`No se pudo importar el backup.${errors}`, 'error');
        this.isImporting = false;
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private exportFilename(contentDisposition: string | null): string {
    const match = contentDisposition?.match(/filename="?([^";]+)"?/);
    return match?.[1] ?? `gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  }

  private showFeedback(message: string, tone: 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackTone = tone;
  }
}
