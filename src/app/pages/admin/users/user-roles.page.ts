import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { UserService } from '../../../shared/api/http/user.service';
import { RoleService } from '../../../shared/api/http/role.service';
import type { User } from '../../../entities/user/user.types';
import type { Role } from '../../../entities/role/role.types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-user-roles-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/admin/users">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div>
        <h1 class="page-title">Gestionar roles</h1>
        @if (user()) {
          <p class="page-subtitle">{{ user()!.fullName }} — {{ user()!.email }}</p>
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

      <div class="roles-layout">
        <!-- Roles asignados -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Roles asignados ({{ assignedRoles().length }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (assignedRoles().length === 0) {
              <p class="empty-message">Sin roles asignados</p>
            }
            <mat-list>
              @for (role of assignedRoles(); track role.id) {
                <mat-list-item>
                  <span matListItemTitle>{{ role.name }}</span>
                  <span matListItemLine>{{ role.description }}</span>
                  <button mat-icon-button color="warn" matListItemMeta
                    (click)="removeRole(role)" [disabled]="saving()" title="Quitar">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          </mat-card-content>
        </mat-card>

        <!-- Roles disponibles -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Roles disponibles ({{ availableRoles().length }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (availableRoles().length === 0) {
              <p class="empty-message">Todos los roles ya están asignados</p>
            }
            <mat-list>
              @for (role of availableRoles(); track role.id) {
                <mat-list-item>
                  <span matListItemTitle>{{ role.name }}</span>
                  <span matListItemLine>{{ role.description }}</span>
                  <button mat-icon-button color="primary" matListItemMeta
                    (click)="addRole(role)" [disabled]="saving()" title="Agregar">
                    <mat-icon>add_circle</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="form-actions">
        <button mat-button routerLink="/admin/users">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="saving()" (click)="saveChanges()">
          @if (saving()) {
            <mat-spinner diameter="20" />
          } @else {
            Guardar cambios
          }
        </button>
      </div>
    }
  `,
  styles: [`
    .page-header   { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 24px; }
    .page-title    { margin: 0; font-size: 24px; font-weight: 500; }
    .page-subtitle { margin: 4px 0 0; color: rgba(0,0,0,.6); font-size: 14px; }
    .state-center, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .roles-layout  { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .empty-message { color: rgba(0,0,0,.4); font-style: italic; padding: 16px 0; }
    .form-actions  { display: flex; justify-content: flex-end; gap: 8px; }
    .form-alert    { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fdecea; color: #c62828; border-radius: 4px; margin-bottom: 16px; }
  `],
})
export class UserRolesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);

  readonly loadingData = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly allRoles = signal<Role[]>([]);
  readonly assignedRoleIds = signal<string[]>([]);

  readonly assignedRoles = computed(() =>
    this.allRoles().filter(r => this.assignedRoleIds().includes(r.id))
  );

  readonly availableRoles = computed(() =>
    this.allRoles().filter(r => !this.assignedRoleIds().includes(r.id))
  );

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadData();
  }

  private loadData(): void {
    this.loadingData.set(true);
    this.loadError.set(null);

    let userLoaded = false;
    let rolesLoaded = false;
    let loadedUser: User | null = null;
    let loadedRoles: Role[] = [];

    const tryFinish = () => {
      if (userLoaded && rolesLoaded) {
        this.user.set(loadedUser);
        this.allRoles.set(loadedRoles);
        if (loadedUser) {
          // Map current user roles (by name) to IDs from allRoles
          const roleIds = loadedRoles
            .filter(r => loadedUser!.roles.includes(r.name))
            .map(r => r.id);
          this.assignedRoleIds.set(roleIds);
        }
        this.loadingData.set(false);
      }
    };

    this.userService.getById(this.userId).subscribe({
      next: (user) => {
        loadedUser = user;
        userLoaded = true;
        tryFinish();
      },
      error: (err: AppError) => {
        this.loadError.set(err.title ?? 'Error al cargar el usuario');
        this.loadingData.set(false);
      },
    });

    this.roleService.getAll({ page: 1, pageSize: 100 }).subscribe({
      next: ({ data }) => {
        loadedRoles = data;
        rolesLoaded = true;
        tryFinish();
      },
      error: (err: AppError) => {
        this.loadError.set(err.title ?? 'Error al cargar los roles');
        this.loadingData.set(false);
      },
    });
  }

  addRole(role: Role): void {
    if (!this.assignedRoleIds().includes(role.id)) {
      this.assignedRoleIds.update(ids => [...ids, role.id]);
    }
  }

  removeRole(role: Role): void {
    this.assignedRoleIds.update(ids => ids.filter(id => id !== role.id));
  }

  saveChanges(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.serverError.set(null);

    this.userService.updateRoles(this.userId, this.assignedRoleIds()).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/admin/users']);
      },
      error: (err: AppError) => {
        this.serverError.set(err.title ?? 'Error al guardar los roles');
        this.saving.set(false);
      },
    });
  }
}
