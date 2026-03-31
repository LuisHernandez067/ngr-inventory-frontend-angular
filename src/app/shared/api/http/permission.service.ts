import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { PermissionMapper } from '../../../entities/permission/permission.mapper';
import type { PermissionDto, Permission } from '../../../entities/permission/permission.types';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly api = inject(ApiClient);

  getAll(): Observable<Permission[]> {
    return this.api.get<PermissionDto[]>('/admin/permissions').pipe(
      map(dtos => dtos.map(dto => PermissionMapper.fromDto(dto)))
    );
  }

  getByRole(roleId: string): Observable<Permission[]> {
    return this.api.get<PermissionDto[]>(`/admin/roles/${roleId}/permissions`).pipe(
      map(dtos => dtos.map(dto => PermissionMapper.fromDto(dto)))
    );
  }

  getByUser(userId: string): Observable<Permission[]> {
    return this.api.get<PermissionDto[]>(`/admin/users/${userId}/permissions`).pipe(
      map(dtos => dtos.map(dto => PermissionMapper.fromDto(dto)))
    );
  }
}
