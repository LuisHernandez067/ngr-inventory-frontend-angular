import { Injectable, Signal, computed, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly _user = signal<AuthUser | null>(null);

  readonly user: Signal<AuthUser | null> = this._user.asReadonly();
  readonly isAuthenticated: Signal<boolean> = computed(() => this._user() !== null);

  setUser(user: AuthUser): void {
    this._user.set(user);
  }

  clearUser(): void {
    this._user.set(null);
  }
}
