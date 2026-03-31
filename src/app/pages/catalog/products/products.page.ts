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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../../../shared/api/http/product.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import type { Product } from '../../../entities/product/product.types';
import type { PaginationMeta } from '../../../shared/types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatChipsModule, MatProgressSpinnerModule,
    MatMenuModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Productos</h1>
      <button mat-flat-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Nuevo producto
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Nombre o SKU..." />
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
        <button mat-button (click)="loadProducts()">Reintentar</button>
      </div>
    }

    <!-- Tabla -->
    @if (!loading() && !error()) {
      @if (products().length === 0) {
        <div class="state-empty">
          <mat-icon>inventory_2</mat-icon>
          <p>No hay productos para mostrar.</p>
          <button mat-flat-button color="primary" routerLink="new">Crear primer producto</button>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="products()">
            <ng-container matColumnDef="sku">
              <th mat-header-cell *matHeaderCellDef>SKU</th>
              <td mat-cell *matCellDef="let p">{{ p.sku }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let p">{{ p.name }}</td>
            </ng-container>
            <ng-container matColumnDef="categoryName">
              <th mat-header-cell *matHeaderCellDef>Categoría</th>
              <td mat-cell *matCellDef="let p">{{ p.categoryName }}</td>
            </ng-container>
            <ng-container matColumnDef="unit">
              <th mat-header-cell *matHeaderCellDef>Unidad</th>
              <td mat-cell *matCellDef="let p">{{ p.unit }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let p">
                <span [class]="'status-chip status-chip--' + (p.active ? 'active' : 'inactive')">
                  {{ p.statusLabel }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Acciones">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="[p.id]">
                    <mat-icon>visibility</mat-icon> Ver detalle
                  </button>
                  <button mat-menu-item [routerLink]="[p.id, 'edit']">
                    <mat-icon>edit</mat-icon> Editar
                  </button>
                  <button mat-menu-item (click)="toggleStatus(p)">
                    <mat-icon>{{ p.active ? 'block' : 'check_circle' }}</mat-icon>
                    {{ p.active ? 'Desactivar' : 'Activar' }}
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
export class ProductsPage implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly displayedColumns = ['sku', 'name', 'categoryName', 'unit', 'status', 'actions'];
  readonly products = signal<Product[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl<'all' | 'active' | 'inactive'>('all');

  ngOnInit(): void {
    this.loadProducts();
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadProducts(); });
    this.statusControl.valueChanges
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadProducts(); });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusControl.value;
    this.productService.getAll({
      page: this.meta().page,
      pageSize: this.meta().pageSize,
      search: this.searchControl.value ?? undefined,
      status: status === 'all' ? undefined : status ?? undefined,
    }).subscribe({
      next: ({ data, meta }) => { this.products.set(data); this.meta.set(meta); this.loading.set(false); },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => ({ ...m, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.loadProducts();
  }

  toggleStatus(product: Product): void {
    const action = product.active ? 'desactivar' : 'activar';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `${product.active ? 'Desactivar' : 'Activar'} producto`,
        message: `¿Querés ${action} "${product.name}"?`,
        confirmLabel: product.active ? 'Desactivar' : 'Activar',
        danger: product.active,
      },
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productService.toggleStatus(product.id, !product.active).subscribe({
        next: () => this.loadProducts(),
        error: (err: AppError) => this.error.set(err),
      });
    });
  }
}
