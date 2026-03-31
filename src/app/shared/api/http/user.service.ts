import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { UserMapper } from '../../../entities/user/user.mapper';
import type { UserDto, User } from '../../../entities/user/user.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface UserListParams extends PaginationParams {
  status?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiClient);

  getAll(params: UserListParams): Observable<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<UserDto>>('/admin/users', {
      page:     params.page,
      pageSize: params.pageSize,
      ...(params.status && { status: params.status }),
      ...(params.search && { search: params.search }),
      ...(params.sort   && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(
      map(r => ({
        data: r.data.map(dto => UserMapper.fromDto(dto)),
        meta: r.meta,
      }))
    );
  }

  getById(id: string): Observable<User> {
    return this.api.get<UserDto>(`/admin/users/${id}`).pipe(
      map(dto => UserMapper.fromDto(dto))
    );
  }

  create(body: { email: string; firstName: string; lastName: string; password: string }): Observable<User> {
    return this.api.post<UserDto>('/admin/users', body).pipe(
      map(dto => UserMapper.fromDto(dto))
    );
  }

  update(id: string, body: { firstName: string; lastName: string; status: string }): Observable<User> {
    return this.api.put<UserDto>(`/admin/users/${id}`, body).pipe(
      map(dto => UserMapper.fromDto(dto))
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/users/${id}`);
  }

  updateRoles(userId: string, roleIds: string[]): Observable<User> {
    return this.api.patch<UserDto>(`/admin/users/${userId}/roles`, { roleIds }).pipe(
      map(dto => UserMapper.fromDto(dto))
    );
  }
}
