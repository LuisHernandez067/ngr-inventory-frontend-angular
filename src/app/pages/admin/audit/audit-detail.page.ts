import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AuditEventService } from '../../../shared/api/http/audit-event.service';
import type { AuditEvent } from '../../../entities/audit-event/audit-event.types';

@Component({
  selector: 'app-audit-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  template: `
    <div class="page-header">
      <button mat-button routerLink="/admin/audit">
        <mat-icon>arrow_back</mat-icon>
        Volver
      </button>
      <h1 class="page-title">Detalle de Evento</h1>
    </div>

    @if (loading()) {
      <div class="state-center">
        <mat-spinner diameter="48" />
      </div>
    }

    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-button routerLink="/admin/audit">Volver al listado</button>
      </div>
    }

    @if (event() && !loading() && !error()) {
      <mat-card class="detail-card">
        <mat-card-content>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Acción</span>
              <span class="detail-value">{{ event()!.actionLabel }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Tipo de entidad</span>
              <span class="detail-value">{{ event()!.entityType }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">ID de entidad</span>
              <span class="detail-value">{{ event()!.entityId }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Actor</span>
              <span class="detail-value">{{ event()!.actorEmail }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Dirección IP</span>
              <span class="detail-value">{{ event()!.ipAddress || '—' }}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Fecha y hora</span>
              <span class="detail-value">{{ event()!.occurredAtLabel }}</span>
            </div>
          </div>

          <div class="payload-section">
            <h3 class="payload-title">Payload</h3>
            <pre class="payload-json">{{ payloadJson() }}</pre>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .detail-card { max-width: 800px; }
    .detail-grid { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
    .detail-row  { display: flex; gap: 16px; }
    .detail-label { font-weight: 500; min-width: 160px; color: rgba(0,0,0,.6); }
    .detail-value { flex: 1; }
    .payload-section { border-top: 1px solid #e0e0e0; padding-top: 16px; }
    .payload-title { margin: 0 0 8px; font-size: 16px; font-weight: 500; }
    .payload-json {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
    }
    .state-center, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
  `],
})
export class AuditDetailPage implements OnInit {
  private readonly auditEventService = inject(AuditEventService);
  private readonly route = inject(ActivatedRoute);

  readonly event = signal<AuditEvent | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly payloadJson = () => {
    const evt = this.event();
    if (!evt) return '';
    return JSON.stringify(evt.payload, null, 2);
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de evento no encontrado');
      return;
    }
    this.loadEvent(id);
  }

  loadEvent(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.auditEventService.getById(id).subscribe({
      next: event => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el evento de auditoría');
        this.loading.set(false);
      },
    });
  }
}
