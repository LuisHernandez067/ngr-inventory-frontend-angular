import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../shared/api/http/user.service';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-user-edit-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/admin/users">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">Editar usuario</h1>
    </div>

    @if (loadingData()) {
      <div class="state-center"><mat-spinner diameter="48" /></div>
    } @else if (loadError()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ loadError() }}</p>
        <button mat-button (click)="loadUser()">Reintentar</button>
      </div>
    } @else {
      <mat-card class="form-card">
        <mat-card-content>
          @if (serverError()) {
            <div class="form-alert" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ serverError() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="firstName" />
              @if (form.get('firstName')?.invalid && form.get('firstName')?.touched) {
                <mat-error>El nombre es requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Apellido</mat-label>
              <input matInput formControlName="lastName" />
              @if (form.get('lastName')?.invalid && form.get('lastName')?.touched) {
                <mat-error>El apellido es requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Estado</mat-label>
              <mat-select formControlName="status">
                <mat-option value="active">Activo</mat-option>
                <mat-option value="inactive">Inactivo</mat-option>
                <mat-option value="suspended">Suspendido</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="form-actions col-span-2">
              <button mat-button type="button" routerLink="/admin/users">Cancelar</button>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="submitting()"
              >
                @if (submitting()) {
                  <mat-spinner diameter="20" />
                } @else {
                  Guardar cambios
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header  { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-title   { margin: 0; font-size: 24px; font-weight: 500; }
    .form-card    { max-width: 640px; }
    .form-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .col-span-2   { grid-column: span 2; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
    .form-alert   { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fdecea; color: #c62828; border-radius: 4px; margin-bottom: 16px; }
    .state-center { display: flex; justify-content: center; align-items: center; padding: 64px; }
    .state-error  { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px; text-align: center; }
  `],
})
export class UserEditPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly loadingData = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);
  private readonly userId = signal<string>('');

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName:  ['', [Validators.required]],
    status:    ['active', [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.userId.set(id);
    this.loadUser();
  }

  loadUser(): void {
    const id = this.userId();
    if (!id) return;
    this.loadingData.set(true);
    this.loadError.set(null);
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.form.patchValue({
          firstName: user.firstName,
          lastName:  user.lastName,
          status:    user.status,
        });
        this.loadingData.set(false);
      },
      error: (err: AppError) => {
        this.loadError.set(err.title ?? 'Error al cargar el usuario');
        this.loadingData.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    const { firstName, lastName, status } = this.form.getRawValue();
    this.userService.update(this.userId(), { firstName, lastName, status }).subscribe({
      next: () => {
        this.router.navigate(['/admin/users']);
      },
      error: (err: AppError) => {
        this.serverError.set(err.title ?? 'Error al actualizar el usuario');
        this.submitting.set(false);
      },
    });
  }
}
