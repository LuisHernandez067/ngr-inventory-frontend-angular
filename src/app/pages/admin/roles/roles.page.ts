import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleService } from '../../../shared/api/http/role.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import type { Role } from '../../../entities/role/role.types';
import type { PaginationMeta, AppError } from '../../../shared/types';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Roles</h1>
      <button mat-flat-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Nuevo rol
      </button>
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
        <button mat-button (click)="loadRoles()">Reintentar</button>
      </div>
    }

    <!-- Tabla -->
    @if (!loading() && !error()) {
      @if (roles().length === 0) {
        <div class="state-empty">
          <mat-icon>security</mat-icon>
          <p>No hay roles para mostrar.</p>
          <button mat-flat-button color="primary" routerLink="new">Crear primer rol</button>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="roles()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let r">{{ r.name }}</td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Descripción</th>
              <td mat-cell *matCellDef="let r">{{ r.description }}</td>
            </ng-container>

            <ng-container matColumnDef="permissionsCount">
              <th mat-header-cell *matHeaderCellDef>Permisos</th>
              <td mat-cell *matCellDef="let r">{{ r.permissionsCount }}</td>
            </ng-container>

            <ng-container matColumnDef="usersCount">
              <th mat-header-cell *matHeaderCellDef>Usuarios</th>
              <td mat-cell *matCellDef="let r">{{ r.usersCount }}</td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Fecha creación</th>
              <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'dd/MM/yyyy' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-icon-button [routerLink]="['/admin/roles', r.id, 'edit']" title="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/admin/roles', r.id, 'permissions']" title="Gestionar permisos">
                  <mat-icon>lock</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteRole(r)"
                  [disabled]="!r.isDeletable" title="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

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
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
  `],
})
export class RolesPage implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly displayedColumns = [
    'name', 'description', 'permissionsCount', 'usersCount', 'createdAt', 'actions',
  ];
  readonly roles = signal<Role[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.error.set(null);
    const page = this.meta()?.page ?? 1;
    const pageSize = this.meta()?.pageSize ?? 10;

    this.roleService.getAll({ page, pageSize }).subscribe({
      next: ({ data, meta }) => {
        this.roles.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err: AppError) => {
        this.error.set(err.title ?? 'Error al cargar roles');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => m ? { ...m, page: event.pageIndex + 1, pageSize: event.pageSize } : m);
    this.loadRoles();
  }

  deleteRole(role: Role): void {
    if (!role.isDeletable) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar rol',
        message: `¿Estás seguro de eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        danger: true,
      },
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.roleService.delete(role.id).subscribe({
          next: () => this.loadRoles(),
          error: (err: AppError) => this.error.set(err.title ?? 'Error al eliminar rol'),
        });
      }
    });
  }
}
