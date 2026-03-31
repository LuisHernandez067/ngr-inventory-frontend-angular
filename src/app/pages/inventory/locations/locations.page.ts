import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { LocationService } from '../../../shared/api/http/location.service';
import { WarehouseService } from '../../../shared/api/http/warehouse.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import type { Location } from '../../../entities/location/location.types';
import type { Warehouse } from '../../../entities/warehouse/warehouse.types';
import type { PaginationMeta } from '../../../shared/types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-locations-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatProgressSpinnerModule, MatMenuModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Ubicaciones</h1>
      <button mat-flat-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Nueva ubicación
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Nombre o código..." />
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-warehouse">
        <mat-label>Almacén</mat-label>
        <mat-select [formControl]="warehouseControl">
          <mat-option value="">Todos</mat-option>
          @for (w of warehouses(); track w.id) {
            <mat-option [value]="w.id">{{ w.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-status">
        <mat-label>Estado</mat-label>
        <mat-select [formControl]="statusControl">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="active">Activos</mat-option>
          <mat-option value="inactive">Inactivos</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Estado: loading -->
    @if (loading()) {
      <div class="state-center">
        <mat-spinner diameter="48" />
      </div>
    }

    <!-- Estado: error -->
    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error()!.title }}</p>
        <button mat-button (click)="loadLocations()">Reintentar</button>
      </div>
    }

    <!-- Tabla -->
    @if (!loading() && !error()) {
      @if (locations().length === 0) {
        <div class="state-empty">
          <mat-icon>place</mat-icon>
          <p>No hay ubicaciones para mostrar.</p>
          <button mat-flat-button color="primary" routerLink="new">Crear primera ubicación</button>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="locations()">
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let l">{{ l.code }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let l">{{ l.name }}</td>
            </ng-container>
            <ng-container matColumnDef="warehouseName">
              <th mat-header-cell *matHeaderCellDef>Almacén</th>
              <td mat-cell *matCellDef="let l">{{ l.warehouseName }}</td>
            </ng-container>
            <ng-container matColumnDef="aisle">
              <th mat-header-cell *matHeaderCellDef>Pasillo</th>
              <td mat-cell *matCellDef="let l">{{ l.aisle || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="shelf">
              <th mat-header-cell *matHeaderCellDef>Estante</th>
              <td mat-cell *matCellDef="let l">{{ l.shelf || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="bin">
              <th mat-header-cell *matHeaderCellDef>Bin</th>
              <td mat-cell *matCellDef="let l">{{ l.bin || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let l">
                <span [class]="'status-chip status-chip--' + (l.isActive ? 'active' : 'inactive')">
                  {{ l.statusLabel }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let l">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Acciones">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="[l.id, 'edit']">
                    <mat-icon>edit</mat-icon> Editar
                  </button>
                  <button mat-menu-item (click)="toggleStatus(l)">
                    <mat-icon>{{ l.isActive ? 'block' : 'check_circle' }}</mat-icon>
                    {{ l.isActive ? 'Desactivar' : 'Activar' }}
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="meta().total"
            [pageSize]="meta().pageSize"
            [pageIndex]="meta().page - 1"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          />
        </div>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .filters-bar { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-search { flex: 1; min-width: 200px; }
    .filter-warehouse { width: 200px; }
    .filter-status { width: 160px; }
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-chip--active   { background: #e8f5e9; color: #2e7d32; }
    .status-chip--inactive { background: #fce4ec; color: #c62828; }
  `],
})
export class LocationsPage implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly displayedColumns = ['code', 'name', 'warehouseName', 'aisle', 'shelf', 'bin', 'status', 'actions'];
  readonly locations = signal<Location[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly searchControl = new FormControl('');
  readonly warehouseControl = new FormControl('');
  readonly statusControl = new FormControl<'all' | 'active' | 'inactive'>('all');

  ngOnInit(): void {
    this.loadWarehouseList();
    this.loadLocations();
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadLocations(); });
    this.warehouseControl.valueChanges
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadLocations(); });
    this.statusControl.valueChanges
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadLocations(); });
  }

  private loadWarehouseList(): void {
    this.warehouseService.getAll({ page: 1, pageSize: 100, isActive: true }).subscribe({
      next: ({ data }) => this.warehouses.set(data),
    });
  }

  loadLocations(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusControl.value;
    this.locationService.getAll({
      page: this.meta().page,
      pageSize: this.meta().pageSize,
      search: this.searchControl.value ?? undefined,
      warehouseId: this.warehouseControl.value || undefined,
      isActive: status === 'all' ? undefined : status === 'active',
    }).subscribe({
      next: ({ data, meta }) => { this.locations.set(data); this.meta.set(meta); this.loading.set(false); },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => ({ ...m, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.loadLocations();
  }

  toggleStatus(location: Location): void {
    const action = location.isActive ? 'desactivar' : 'activar';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${location.isActive ? 'Desactivar' : 'Activar'} ubicación`,
        message: `¿Querés ${action} "${location.name}"?`,
        confirmLabel: location.isActive ? 'Desactivar' : 'Activar',
        danger: location.isActive,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.locationService.toggleStatus(location.id).subscribe({
        next: () => this.loadLocations(),
        error: (err: AppError) => this.error.set(err),
      });
    });
  }
}
