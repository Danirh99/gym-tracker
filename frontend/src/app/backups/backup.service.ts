import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackupImportResponse } from './backup.model';

@Injectable({ providedIn: 'root' })
export class BackupService {
  constructor(private readonly http: HttpClient) {}

  exportBackup(): Observable<HttpResponse<Blob>> {
    return this.http.get('/api/backups/export', {
      observe: 'response',
      responseType: 'blob',
    });
  }

  importBackup(payload: unknown): Observable<BackupImportResponse> {
    return this.http.post<BackupImportResponse>('/api/backups/import', payload);
  }
}
