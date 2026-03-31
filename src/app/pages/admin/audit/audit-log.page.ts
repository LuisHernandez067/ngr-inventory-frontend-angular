import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AuditEventService } from '../../../shared/api/http/audit-event.service';
import { ExportService } from '../../../shared/services/export.service';
import { FileUtils } from '../../../shared/utils/file.utils';
import type { AuditEvent } from '../../../entities/audit-event/audit-event.types';
import type { PaginationMeta } from '../../../shared/types';

@Component({
  selector: 'app-audit-log-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Auditoría</h1>
      <button
        mat-flat-button
        color="accent"
        (click)="onExportCsv()"
        [disabled]="isExporting()"
      >
        <mat-icon>download</mat-icon>
        {{ isExporting() ? 'Exportando...' : 'Exportar CSV' }}
      </button>
    </div>

    <div class="filters-bar">
      <mat-form-field appearance="outline">
        <mat-label>Tipo de entidad</mat-label>
        <input matInput [formControl]="entityTypeControl" placeholder="Product, User..." />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Acción</mat-label>
        <input matInput [formControl]="actionControl" placeholder="product.created..." />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Desde</mat-label>
        <input matInput type="date" [formControl]="dateFromControl" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Hasta</mat-label>
        <input matInput type="date" [formControl]="dateToControl" />
      </mat-form-field>
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
        <button mat-button (click)="loadData()">Reintentar</button>
      </div>
    }

    @if (!loading() && !error()) {
      @if (events().length === 0) {
        <div class="state-empty">
          <mat-icon>history</mat-icon>
          <p>No hay eventos de auditoría para mostrar.</p>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="events()">
            <ng-container matColumnDef="occurredAtLabel">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let evt">{{ evt.occurredAtLabel }}</td>
            </ng-container>

            <ng-container matColumnDef="actionLabel">
              <th mat-header-cell *matHeaderCellDef>Acción</th>
              <td mat-cell *matCellDef="let evt">{{ evt.actionLabel }}</td>
            </ng-container>

            <ng-container matColumnDef="entityType">
              <th mat-header-cell *matHeaderCellDef>Entidad</th>
              <td mat-cell *matCellDef="let evt">{{ evt.entityType }}</td>
            </ng-container>

            <ng-container matColumnDef="entityId">
              <th mat-header-cell *matHeaderCellDef>ID Entidad</th>
              <td mat-cell *matCellDef="let evt">{{ evt.entityId }}</td>
            </ng-container>

            <ng-container matColumnDef="actorEmail">
              <th mat-header-cell *matHeaderCellDef>Actor</th>
              <td mat-cell *matCellDef="let evt">{{ evt.actorEmail }}</td>
            </ng-container>

            <ng-container matColumnDef="ipAddress">
              <th mat-header-cell *matHeaderCellDef>IP</th>
              <td mat-cell *matCellDef="let evt">{{ evt.ipAddress || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let evt">
                <button mat-icon-button (click)="toggleExpand(evt.id)" title="Ver detalle">
                  <mat-icon>{{ expandedEventId() === evt.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/admin/audit', evt.id]" title="Ver página de detalle">
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="toggleExpand(row.id)" class="clickable-row"></tr>
          </table>

          <!-- Expanded payload panels -->
          @for (evt of events(); track evt.id) {
            @if (expandedEventId() === evt.id) {
              <div class="payload-panel">
                <strong>Payload de {{ evt.actionLabel }}:</strong>
                <pre class="payload-json">{{ formatPayload(evt) }}</pre>
              </div>
            }
          }

          @if (meta()) {
            <mat-paginator
              [length]="meta()!.total"
              [pageSize]="meta()!.pageSize"
              [pageIndex]="meta()!.page - 1"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            />
          }
        </div>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .filters-bar { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(0,0,0,.04); }
    .payload-panel {
      padding: 16px 24px;
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }
    .payload-json {
      margin-top: 8px;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `],
})
export class AuditLogPage implements OnInit {
  private readonly auditEventService = inject(AuditEventService);
  private readonly exportService = inject(ExportService);

  readonly displayedColumns = [
    'occurredAtLabel', 'actionLabel', 'entityType', 'entityId', 'actorEmail', 'ipAddress', 'actions',
  ];

  readonly events = signal<AuditEvent[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly expandedEventId = signal<string | null>(null);

  readonly entityTypeFilter = signal('');
  readonly actionFilter = signal('');
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');

  readonly isExporting = computed(() => this.exportService.isExporting());

  readonly entityTypeControl = new FormControl('');
  readonly actionControl = new FormControl('');
  readonly dateFromControl = new FormControl('');
  readonly dateToControl = new FormControl('');

  ngOnInit(): void {
    this.loadData();
    this.entityTypeControl.valueChanges.subscribe(v => {
      this.entityTypeFilter.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
    this.actionControl.valueChanges.subscribe(v => {
      this.actionFilter.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
    this.dateFromControl.valueChanges.subscribe(v => {
      this.dateFromFilter.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
    this.dateToControl.valueChanges.subscribe(v => {
      this.dateToFilter.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    const page = this.meta()?.page ?? 1;
    const pageSize = this.meta()?.pageSize ?? 10;

    this.auditEventService.getAll({
      page,
      pageSize,
      ...(this.entityTypeFilter() && { entityType: this.entityTypeFilter() }),
      ...(this.actionFilter()     && { action:     this.actionFilter() }),
      ...(this.dateFromFilter()   && { dateFrom:   this.dateFromFilter() }),
      ...(this.dateToFilter()     && { dateTo:     this.dateToFilter() }),
    }).subscribe({
      next: ({ data, meta }) => {
        this.events.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el registro de auditoría');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => m ? { ...m, page: event.pageIndex + 1, pageSize: event.pageSize } : m);
    this.loadData();
  }

  toggleExpand(id: string): void {
    this.expandedEventId.update(current => current === id ? null : id);
  }

  formatPayload(evt: AuditEvent): string {
    return JSON.stringify(evt.payload, null, 2);
  }

  onExportCsv(): void {
    const params: Record<string, string> = {};
    if (this.entityTypeFilter()) params['entityType'] = this.entityTypeFilter();
    if (this.actionFilter())     params['action']     = this.actionFilter();
    if (this.dateFromFilter())   params['dateFrom']   = this.dateFromFilter();
    if (this.dateToFilter())     params['dateTo']     = this.dateToFilter();

    const filename = FileUtils.buildFilename('audit-log', 'csv');
    this.exportService.exportCsv('/admin/audit-events/export', params, filename).subscribe();
  }

  private resetPage(): void {
    this.meta.update(m => m ? { ...m, page: 1 } : null);
  }
}
