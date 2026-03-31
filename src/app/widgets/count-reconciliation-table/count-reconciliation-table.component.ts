import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import type { PhysicalCountItem } from '../../entities/count/count.types';

@Component({
  selector: 'app-count-reconciliation-table',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    @if (loading) {
      <div class="state-center">
        <mat-spinner diameter="40" />
      </div>
    } @else if (items.length === 0) {
      <div class="state-empty">
        <p>No hay ítems para mostrar.</p>
      </div>
    } @else {
      <div class="table-container mat-elevation-z1">
        <table mat-table [dataSource]="items">

          <ng-container matColumnDef="productCode">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let item">{{ item.productCode }}</td>
          </ng-container>

          <ng-container matColumnDef="productName">
            <th mat-header-cell *matHeaderCellDef>Producto</th>
            <td mat-cell *matCellDef="let item">{{ item.productName }}</td>
          </ng-container>

          <ng-container matColumnDef="locationCode">
            <th mat-header-cell *matHeaderCellDef>Ubicación</th>
            <td mat-cell *matCellDef="let item">{{ item.locationCode }}</td>
          </ng-container>

          <ng-container matColumnDef="theoreticalQty">
            <th mat-header-cell *matHeaderCellDef>Teórico</th>
            <td mat-cell *matCellDef="let item">{{ item.theoreticalQty }}</td>
          </ng-container>

          <ng-container matColumnDef="countedQty">
            <th mat-header-cell *matHeaderCellDef>Contado</th>
            <td mat-cell *matCellDef="let item">
              @if (editable) {
                <input
                  class="qty-input"
                  type="number"
                  [value]="item.countedQty ?? ''"
                  min="0"
                  (blur)="onBlur(item, $event)"
                  aria-label="Cantidad contada"
                />
              } @else {
                {{ item.countedQty ?? '—' }}
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="difference">
            <th mat-header-cell *matHeaderCellDef>Diferencia</th>
            <td mat-cell *matCellDef="let item">
              @if (item.difference !== null) {
                <span [class]="differenceClass(item.difference)">
                  {{ item.difference > 0 ? '+' : '' }}{{ item.difference }}
                </span>
              } @else {
                <span class="neutral">—</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let item">
              <span [class]="'item-status item-status--' + item.status">
                {{ item.statusLabel }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns;"
            [class.row-discrepancy]="row.hasDiscrepancy"
          ></tr>
        </table>
      </div>
    }
  `,
  styles: [`
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty {
      display: flex; align-items: center; justify-content: center;
      padding: 40px; color: #666;
    }
    .qty-input {
      width: 80px; padding: 4px 8px; border: 1px solid #ccc;
      border-radius: 4px; font-size: 14px; text-align: right;
    }
    .qty-input:focus { outline: none; border-color: #1976d2; }
    .diff-positive { color: #2e7d32; font-weight: 500; }
    .diff-negative { color: #c62828; font-weight: 500; }
    .neutral { color: #666; }
    .row-discrepancy { background: #fff5f5; }
    .item-status { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 500; }
    .item-status--pending     { background: #f5f5f5; color: #616161; }
    .item-status--counted     { background: #e8f5e9; color: #2e7d32; }
    .item-status--discrepancy { background: #fce4ec; color: #c62828; }
  `],
})
export class CountReconciliationTableComponent {
  @Input() items: PhysicalCountItem[] = [];
  @Input() loading = false;
  @Input() editable = true;
  @Output() itemUpdated = new EventEmitter<{ itemId: string; countedQty: number }>();

  readonly displayedColumns = [
    'productCode', 'productName', 'locationCode',
    'theoreticalQty', 'countedQty', 'difference', 'status',
  ];

  differenceClass(difference: number): string {
    if (difference > 0) return 'diff-positive';
    if (difference < 0) return 'diff-negative';
    return 'neutral';
  }

  onBlur(item: PhysicalCountItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value) && value >= 0) {
      this.itemUpdated.emit({ itemId: item.id, countedQty: value });
    }
  }
}
