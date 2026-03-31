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
import { CategoryService } from '../../../shared/api/http/category.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import type { Category } from '../../../entities/category/category.types';
import type { PaginationMeta, AppError } from '../../../shared/types';

@Component({
  selector: 'app-categories-page',
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
      <h1 class="page-title">Categorías</h1>
      <button mat-flat-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Nueva categoría
      </button>
    </div>

    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Nombre..." />
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
        <button mat-button (click)="loadCategories()">Reintentar</button>
      </div>
    }

    @if (!loading() && !error()) {
      @if (categories().length === 0) {
        <div class="state-empty">
          <mat-icon>category</mat-icon>
          <p>No hay categorías para mostrar.</p>
          <button mat-flat-button color="primary" routerLink="new">Crear primera categoría</button>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="categories()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let c">{{ c.name }}</td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Descripción</th>
              <td mat-cell *matCellDef="let c">{{ c.description || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="productCount">
              <th mat-header-cell *matHeaderCellDef>Productos</th>
              <td mat-cell *matCellDef="let c">{{ c.productCount }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let c">
                <span [class]="'status-chip status-chip--' + (c.active ? 'active' : 'inactive')">
                  {{ c.statusLabel }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Acciones">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="[c.id, 'edit']">
                    <mat-icon>edit</mat-icon> Editar
                  </button>
                  <button mat-menu-item (click)="toggleStatus(c)">
                    <mat-icon>{{ c.active ? 'block' : 'check_circle' }}</mat-icon>
                    {{ c.active ? 'Desactivar' : 'Activar' }}
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
export class CategoriesPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['name', 'description', 'productCount', 'status', 'actions'];
  readonly categories = signal<Category[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<'all' | 'active' | 'inactive'>('all');

  ngOnInit(): void {
    this.loadCategories();
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadCategories(); });
    this.statusControl.valueChanges
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadCategories(); });
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusControl.value;
    this.categoryService.getAll({
      page: this.meta().page,
      pageSize: this.meta().pageSize,
      search: this.searchControl.value ?? undefined,
      status: status === 'all' ? undefined : status ?? undefined,
    }).subscribe({
      next: ({ data, meta }) => { this.categories.set(data); this.meta.set(meta); this.loading.set(false); },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => ({ ...m, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.loadCategories();
  }

  toggleStatus(category: Category): void {
    const action = category.active ? 'desactivar' : 'activar';
    const extraMsg = category.active && category.productCount > 0
      ? ` Esta categoría tiene ${category.productCount} productos activos.`
      : '';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${category.active ? 'Desactivar' : 'Activar'} categoría`,
        message: `¿Querés ${action} "${category.name}"?${extraMsg}`,
        confirmLabel: category.active ? 'Desactivar' : 'Activar',
        danger: category.active,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.categoryService.toggleStatus(category.id, !category.active).subscribe({
        next: () => this.loadCategories(),
        error: (err: AppError) => this.error.set(err),
      });
    });
  }
}
