import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { RoleService } from '../../../shared/api/http/role.service';
import { PermissionService } from '../../../shared/api/http/permission.service';
import { PermissionMapper } from '../../../entities/permission/permission.mapper';
import type { Role } from '../../../entities/role/role.types';
import type { Permission, PermissionGroup } from '../../../entities/permission/permission.types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-role-permissions-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/admin/roles">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div>
        <h1 class="page-title">Gestionar permisos</h1>
        @if (role()) {
          <p class="page-subtitle">{{ role()!.name }}</p>
        }
      </div>
    </div>

    @if (loadingData()) {
      <div class="state-center"><mat-spinner diameter="48" /></div>
    } @else if (loadError()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ loadError() }}</p>
      </div>
    } @else {
      @if (serverError()) {
        <div class="form-alert" role="alert">
          <mat-icon>error_outline</mat-icon>
          {{ serverError() }}
        </div>
      }

      <mat-accordion class="permissions-accordion">
        @for (moduleGroup of permissionGroups(); track moduleGroup.module) {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>{{ moduleGroup.moduleLabel }}</mat-panel-title>
              <mat-panel-description>
                {{ getSelectedCount(moduleGroup) }} / {{ getTotalCount(moduleGroup) }} seleccionados
              </mat-panel-description>
            </mat-expansion-panel-header>

            @for (group of moduleGroup.groups; track group.group) {
              <div class="permission-group">
                <div class="group-header">
                  <span class="group-name">{{ group.group }}</span>
                  <div class="group-actions">
                    <button mat-button type="button" (click)="selectAll(group.permissions)">
                      Seleccionar todo
                    </button>
                    <button mat-button type="button" (click)="deselectAll(group.permissions)">
                      Deseleccionar todo
                    </button>
                  </div>
                </div>
                <div class="permission-chips">
                  @for (perm of group.permissions; track perm.key) {
                    <mat-checkbox
                      [checked]="selectedKeys().has(perm.key)"
                      (change)="togglePermission(perm.key, $event.checked)"
                    >
                      {{ perm.label }}
                    </mat-checkbox>
                  }
                </div>
              </div>
            }
          </mat-expansion-panel>
        }
      </mat-accordion>

      <div class="form-actions">
        <button mat-button routerLink="/admin/roles">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="saving()" (click)="savePermissions()">
          @if (saving()) {
            <mat-spinner diameter="20" />
          } @else {
            Guardar
          }
        </button>
      </div>
    }
  `,
  styles: [`
    .page-header     { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 24px; }
    .page-title      { margin: 0; font-size: 24px; font-weight: 500; }
    .page-subtitle   { margin: 4px 0 0; color: rgba(0,0,0,.6); font-size: 14px; }
    .state-center, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .permissions-accordion { margin-bottom: 24px; }
    .permission-group { padding: 8px 0 16px; border-bottom: 1px solid rgba(0,0,0,.08); }
    .permission-group:last-child { border-bottom: none; }
    .group-header    { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .group-name      { font-weight: 500; text-transform: capitalize; }
    .group-actions   { display: flex; gap: 4px; }
    .permission-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .form-actions    { display: flex; justify-content: flex-end; gap: 8px; }
    .form-alert      { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fdecea; color: #c62828; border-radius: 4px; margin-bottom: 16px; }
  `],
})
export class RolePermissionsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleService);
  private readonly permissionService = inject(PermissionService);

  readonly loadingData = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly role = signal<Role | null>(null);
  readonly allPermissions = signal<Permission[]>([]);
  readonly selectedKeys = signal<Set<string>>(new Set());

  readonly permissionGroups = computed(() =>
    PermissionMapper.groupPermissions(this.allPermissions())
  );

  private roleId = '';

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadData();
  }

  private loadData(): void {
    this.loadingData.set(true);
    this.loadError.set(null);

    let roleLoaded = false;
    let permsLoaded = false;
    let currentPermKeys: string[] = [];

    const tryFinish = (role: Role | null, allPerms: Permission[]) => {
      this.role.set(role);
      this.allPermissions.set(allPerms);
      this.selectedKeys.set(new Set(currentPermKeys));
      this.loadingData.set(false);
    };

    let loadedRole: Role | null = null;
    let loadedPerms: Permission[] = [];

    this.roleService.getById(this.roleId).subscribe({
      next: (role) => {
        loadedRole = role;
        currentPermKeys = role.permissions;
        roleLoaded = true;
        if (permsLoaded) tryFinish(loadedRole, loadedPerms);
      },
      error: (err: AppError) => {
        this.loadError.set(err.title ?? 'Error al cargar el rol');
        this.loadingData.set(false);
      },
    });

    this.permissionService.getAll().subscribe({
      next: (perms) => {
        loadedPerms = perms;
        permsLoaded = true;
        if (roleLoaded) tryFinish(loadedRole, loadedPerms);
      },
      error: (err: AppError) => {
        this.loadError.set(err.title ?? 'Error al cargar permisos');
        this.loadingData.set(false);
      },
    });
  }

  togglePermission(key: string, checked: boolean): void {
    this.selectedKeys.update(keys => {
      const next = new Set(keys);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  selectAll(permissions: Permission[]): void {
    this.selectedKeys.update(keys => {
      const next = new Set(keys);
      permissions.forEach(p => next.add(p.key));
      return next;
    });
  }

  deselectAll(permissions: Permission[]): void {
    this.selectedKeys.update(keys => {
      const next = new Set(keys);
      permissions.forEach(p => next.delete(p.key));
      return next;
    });
  }

  getSelectedCount(moduleGroup: { groups: { permissions: Permission[] }[] }): number {
    return moduleGroup.groups.reduce((count, group) => {
      return count + group.permissions.filter(p => this.selectedKeys().has(p.key)).length;
    }, 0);
  }

  getTotalCount(moduleGroup: { groups: { permissions: Permission[] }[] }): number {
    return moduleGroup.groups.reduce((count, group) => count + group.permissions.length, 0);
  }

  savePermissions(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.serverError.set(null);

    const permissionKeys = Array.from(this.selectedKeys());
    this.roleService.updatePermissions(this.roleId, permissionKeys).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/admin/roles']);
      },
      error: (err: AppError) => {
        this.serverError.set(err.title ?? 'Error al guardar permisos');
        this.saving.set(false);
      },
    });
  }
}
