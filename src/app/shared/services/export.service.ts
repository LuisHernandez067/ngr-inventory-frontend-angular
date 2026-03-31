import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileUtils } from '../utils/file.utils';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  readonly isExporting = signal(false);

  exportCsv(url: string, params: Record<string, string>, filename: string): Observable<void> {
    return this.doExport(url, params, filename);
  }

  exportXlsx(url: string, params: Record<string, string>, filename: string): Observable<void> {
    return this.doExport(url, params, filename);
  }

  private doExport(url: string, params: Record<string, string>, filename: string): Observable<void> {
    this.isExporting.set(true);

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value);
      }
    });

    return this.http
      .get(`${this.baseUrl}${url}`, {
        params: httpParams,
        responseType: 'blob',
        withCredentials: true,
      })
      .pipe(
        tap((blob: Blob) => FileUtils.downloadBlob(blob, filename)),
        map(() => undefined),
        finalize(() => this.isExporting.set(false)),
      );
  }
}
