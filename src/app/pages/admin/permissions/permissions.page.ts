import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { PermissionService } from '../../../shared/api/http/permission.service';
import { PermissionMapper } from '../../../entities/permission/permission.mapper';
import type { Permission } from '../../../entities/permission/permission.types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-permissions-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Permisos del sistema</h1>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="state-center">
        <mat-spinner diameter="48" />
      </div>
    }

    <!-- Error -->
    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-button (click)="loadPermissions()">Reintentar</button>
      </div>
    }

    <!-- Árbol de permisos -->
    @if (!loading() && !error()) {
      @if (permissions().length === 0) {
        <div class="state-empty">
          <mat-icon>lock</mat-icon>
          <p>No hay permisos registrados.</p>
        </div>
      } @else {
        <mat-accordion class="permissions-accordion" multi>
          @for (moduleGroup of permissionGroups(); track moduleGroup.module) {
            <mat-expansion-panel [expanded]="true">
              <mat-expansion-panel-header>
                <mat-panel-title>{{ moduleGroup.moduleLabel }}</mat-panel-title>
                <mat-panel-description>
                  {{ getTotalCount(moduleGroup) }} permisos
                </mat-panel-description>
              </mat-expansion-panel-header>

              @for (group of moduleGroup.groups; track group.group) {
                <div class="permission-group">
                  <h3 class="group-name">{{ group.group }}</h3>
                  <div class="permission-chips">
                    @for (perm of group.permissions; track perm.key) {
                      <span class="perm-chip" [title]="perm.description || perm.key">
                        {{ perm.label }}
                      </span>
                    }
                  </div>
                </div>
              }
            </mat-expansion-panel>
          }
        </mat-accordion>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
    .permissions-accordion { max-width: 900px; }
    .permission-group { padding: 8px 0 16px; border-bottom: 1px solid rgba(0,0,0,.08); }
    .permission-group:last-child { border-bottom: none; }
    .group-name  { margin: 0 0 8px; font-size: 14px; font-weight: 500; text-transform: capitalize; color: rgba(0,0,0,.6); }
    .permission-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .perm-chip   { padding: 4px 12px; border-radius: 16px; font-size: 12px; background: #e3f2fd; color: #1565c0; cursor: default; }
  `],
})
export class PermissionsPage implements OnInit {
  private readonly permissionService = inject(PermissionService);

  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly permissionGroups = computed(() =>
    PermissionMapper.groupPermissions(this.permissions())
  );

  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.permissionService.getAll().subscribe({
      next: (data) => {
        this.permissions.set(data);
        this.loading.set(false);
      },
      error: (err: AppError) => {
        this.error.set(err.title ?? 'Error al cargar permisos');
        this.loading.set(false);
      },
    });
  }

  getTotalCount(moduleGroup: { groups: { permissions: Permission[] }[] }): number {
    return moduleGroup.groups.reduce((count, group) => count + group.permissions.length, 0);
  }
}
