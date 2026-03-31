import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { SupplierService } from '../../../shared/api/http/supplier.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import type { Supplier } from '../../../entities/supplier/supplier.types';
import type { PaginationMeta, AppError } from '../../../shared/types';

@Component({
  selector: 'app-suppliers-page',
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
      <h1 class="page-title">Proveedores</h1>
      <button mat-flat-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Nuevo proveedor
      </button>
    </div>

    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Nombre o contacto..." />
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

    @if (loading()) {
      <div class="state-center"><mat-spinner diameter="48" /></div>
    }

    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error()!.title }}</p>
        <button mat-button (click)="loadSuppliers()">Reintentar</button>
      </div>
    }

    @if (!loading() && !error()) {
      @if (suppliers().length === 0) {
        <div class="state-empty">
          <mat-icon>local_shipping</mat-icon>
          <p>No hay proveedores para mostrar.</p>
          <button mat-flat-button color="primary" routerLink="new">Crear primer proveedor</button>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="suppliers()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let s">{{ s.name }}</td>
            </ng-container>
            <ng-container matColumnDef="contactName">
              <th mat-header-cell *matHeaderCellDef>Contacto</th>
              <td mat-cell *matCellDef="let s">{{ s.contactName || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let s">{{ s.email || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Teléfono</th>
              <td mat-cell *matCellDef="let s">{{ s.phone || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let s">
                <span [class]="'status-chip status-chip--' + (s.active ? 'active' : 'inactive')">
                  {{ s.statusLabel }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let s">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Acciones">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="[s.id, 'edit']">
                    <mat-icon>edit</mat-icon> Editar
                  </button>
                  <button mat-menu-item (click)="toggleStatus(s)">
                    <mat-icon>{{ s.active ? 'block' : 'check_circle' }}</mat-icon>
                    {{ s.active ? 'Desactivar' : 'Activar' }}
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
export class SuppliersPage implements OnInit {
  private readonly supplierService = inject(SupplierService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'contactName', 'email', 'phone', 'status', 'actions'];
  readonly suppliers = signal<Supplier[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<'all' | 'active' | 'inactive'>('all');

  ngOnInit(): void {
    this.loadSuppliers();
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadSuppliers(); });
    this.statusControl.valueChanges
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadSuppliers(); });
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusControl.value;
    this.supplierService.getAll({
      page: this.meta().page,
      pageSize: this.meta().pageSize,
      search: this.searchControl.value ?? undefined,
      status: status === 'all' ? undefined : status ?? undefined,
    }).subscribe({
      next: ({ data, meta }) => { this.suppliers.set(data); this.meta.set(meta); this.loading.set(false); },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => ({ ...m, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.loadSuppliers();
  }

  toggleStatus(supplier: Supplier): void {
    const action = supplier.active ? 'desactivar' : 'activar';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${supplier.active ? 'Desactivar' : 'Activar'} proveedor`,
        message: `¿Querés ${action} "${supplier.name}"?`,
        confirmLabel: supplier.active ? 'Desactivar' : 'Activar',
        danger: supplier.active,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.supplierService.toggleStatus(supplier.id, !supplier.active).subscribe({
        next: () => this.loadSuppliers(),
        error: (err: AppError) => this.error.set(err),
      });
    });
  }
}
