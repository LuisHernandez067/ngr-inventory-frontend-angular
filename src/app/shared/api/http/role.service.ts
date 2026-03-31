import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { RoleMapper } from '../../../entities/role/role.mapper';
import type { RoleDto, Role } from '../../../entities/role/role.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly api = inject(ApiClient);

  getAll(params: PaginationParams): Observable<PaginatedResponse<Role>> {
    return this.api.get<PaginatedResponse<RoleDto>>('/admin/roles', {
      page:     params.page,
      pageSize: params.pageSize,
      ...(params.sort && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(
      map(r => ({
        data: r.data.map(dto => RoleMapper.fromDto(dto)),
        meta: r.meta,
      }))
    );
  }

  getById(id: string): Observable<Role> {
    return this.api.get<RoleDto>(`/admin/roles/${id}`).pipe(
      map(dto => RoleMapper.fromDto(dto))
    );
  }

  create(body: { name: string; description: string }): Observable<Role> {
    return this.api.post<RoleDto>('/admin/roles', body).pipe(
      map(dto => RoleMapper.fromDto(dto))
    );
  }

  update(id: string, body: { name: string; description: string }): Observable<Role> {
    return this.api.put<RoleDto>(`/admin/roles/${id}`, body).pipe(
      map(dto => RoleMapper.fromDto(dto))
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/roles/${id}`);
  }

  updatePermissions(roleId: string, permissionKeys: string[]): Observable<Role> {
    return this.api.put<RoleDto>(`/admin/roles/${roleId}/permissions`, { permissionKeys }).pipe(
      map(dto => RoleMapper.fromDto(dto))
    );
  }
}
