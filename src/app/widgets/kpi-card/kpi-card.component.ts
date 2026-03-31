import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="kpi-card" [class.kpi-card--alert]="variant === 'alert'" [class.kpi-card--warn]="variant === 'warn'">
      <div class="kpi-icon">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">{{ label }}</span>
        @if (loading) {
          <mat-spinner diameter="24" />
        } @else {
          <span class="kpi-value">{{ value }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .kpi-card {
      display: flex; align-items: center; gap: 16px;
      padding: 20px; background: white; border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.12);
    }
    .kpi-card--alert { border-left: 4px solid #c62828; }
    .kpi-card--warn  { border-left: 4px solid #f57f17; }
    .kpi-icon { width: 48px; height: 48px; border-radius: 50%; background: #f5f5f5;
      display: flex; align-items: center; justify-content: center; }
    .kpi-card--alert .kpi-icon { background: #fce4ec; color: #c62828; }
    .kpi-card--warn  .kpi-icon { background: #fff8e1; color: #f57f17; }
    .kpi-body { display: flex; flex-direction: column; gap: 4px; }
    .kpi-label { font-size: 13px; color: #666; }
    .kpi-value { font-size: 28px; font-weight: 700; line-height: 1; }
  `],
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() icon = 'info';
  @Input() loading = false;
  @Input() variant: 'default' | 'warn' | 'alert' = 'default';
}
