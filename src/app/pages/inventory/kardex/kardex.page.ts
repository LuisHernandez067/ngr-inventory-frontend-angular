import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { KardexTableComponent } from '../../../widgets/kardex-table/kardex-table.component';
import { MovementService } from '../../../shared/api/http/movement.service';
import type { Movement, MovementType, MovementStatus } from '../../../entities/movement/movement.types';
import type { PaginationMeta, AppError } from '../../../shared/types';

@Component({
  selector: 'app-kardex-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KardexTableComponent,
    MatPaginatorModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Kardex global</h1>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Producto, referencia..." />
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-select">
        <mat-label>Tipo</mat-label>
        <mat-select [formControl]="typeControl">
          <mat-option value="">Todos</mat-option>
          <mat-option value="ENTRY">Entrada</mat-option>
          <mat-option value="EXIT">Salida</mat-option>
          <mat-option value="TRANSFER">Transferencia</mat-option>
          <mat-option value="ADJUSTMENT_IN">Ajuste entrada</mat-option>
          <mat-option value="ADJUSTMENT_OUT">Ajuste salida</mat-option>
          <mat-option value="RETURN">Devolución</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-select">
        <mat-label>Estado</mat-label>
        <mat-select [formControl]="statusControl">
          <mat-option value="">Todos</mat-option>
          <mat-option value="PENDING">Pendiente</mat-option>
          <mat-option value="CONFIRMED">Confirmado</mat-option>
          <mat-option value="CANCELLED">Cancelado</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-date">
        <mat-label>Desde</mat-label>
        <input matInput [matDatepicker]="pickerFrom" [formControl]="dateFromControl" />
        <mat-datepicker-toggle matIconSuffix [for]="pickerFrom"></mat-datepicker-toggle>
        <mat-datepicker #pickerFrom></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-date">
        <mat-label>Hasta</mat-label>
        <input matInput [matDatepicker]="pickerTo" [formControl]="dateToControl" />
        <mat-datepicker-toggle matIconSuffix [for]="pickerTo"></mat-datepicker-toggle>
        <mat-datepicker #pickerTo></mat-datepicker>
      </mat-form-field>

      <button mat-icon-button (click)="clearFilters()" matTooltip="Limpiar filtros">
        <mat-icon>filter_list_off</mat-icon>
      </button>
    </div>

    @if (loading()) {
      <div class="state-center"><mat-spinner diameter="48" /></div>
    } @else if (error()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error()!.title }}</p>
        <button mat-button (click)="load()">Reintentar</button>
      </div>
    } @else {
      <div class="table-container mat-elevation-z1">
        <app-kardex-table [movements]="movements()" />
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
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .filters-bar { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .filter-search { flex: 1; min-width: 200px; }
    .filter-select, .filter-date { width: 160px; }
    .table-container { border-radius: 8px; overflow: hidden; }
    .state-center, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
  `],
})
export class KardexPage implements OnInit {
  private readonly movementService = inject(MovementService);

  readonly movements = signal<Movement[]>([]);
  readonly meta      = signal<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  readonly loading   = signal(false);
  readonly error     = signal<AppError | null>(null);

  readonly searchControl   = new FormControl('');
  readonly typeControl     = new FormControl<MovementType | ''>('');
  readonly statusControl   = new FormControl<MovementStatus | ''>('');
  readonly dateFromControl = new FormControl<Date | null>(null);
  readonly dateToControl   = new FormControl<Date | null>(null);

  ngOnInit(): void {
    this.load();
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
    this.typeControl.valueChanges.subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
    this.statusControl.valueChanges.subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
    this.dateFromControl.valueChanges.subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
    this.dateToControl.valueChanges.subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const dateFrom = this.dateFromControl.value;
    const dateTo   = this.dateToControl.value;
    this.movementService.getAll({
      page: this.meta().page,
      pageSize: this.meta().pageSize,
      search:   this.searchControl.value  ?? undefined,
      type:     this.typeControl.value    || undefined,
      status:   this.statusControl.value  || undefined,
      dateFrom: dateFrom ? dateFrom.toISOString().split('T')[0] : undefined,
      dateTo:   dateTo   ? dateTo.toISOString().split('T')[0]   : undefined,
    }).subscribe({
      next: ({ data, meta }) => { this.movements.set(data); this.meta.set(meta); this.loading.set(false); },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => ({ ...m, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.load();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.typeControl.setValue('');
    this.statusControl.setValue('');
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
  }
}
