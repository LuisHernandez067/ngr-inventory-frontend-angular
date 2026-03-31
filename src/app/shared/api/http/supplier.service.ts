import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from './api-client';
import { SupplierMapper } from '../../../entities/supplier/supplier.mapper';
import type { SupplierDto, CreateSupplierDto, UpdateSupplierDto, Supplier } from '../../../entities/supplier/supplier.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface SupplierListParams extends PaginationParams {
  search?: string;
  status?: 'active' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly api = inject(ApiClient);

  getAll(params: SupplierListParams): Observable<PaginatedResponse<Supplier>> {
    return this.api.get<PaginatedResponse<SupplierDto>>('/suppliers', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status }),
    }).pipe(
      map(response => ({
        data: response.data.map(SupplierMapper.toViewModel),
        meta: response.meta,
      }))
    );
  }

  getById(id: string): Observable<Supplier> {
    return this.api.get<SupplierDto>(`/suppliers/${id}`).pipe(
      map(SupplierMapper.toViewModel)
    );
  }

  create(dto: CreateSupplierDto): Observable<Supplier> {
    return this.api.post<SupplierDto>('/suppliers', dto).pipe(
      map(SupplierMapper.toViewModel)
    );
  }

  update(id: string, dto: UpdateSupplierDto): Observable<Supplier> {
    return this.api.put<SupplierDto>(`/suppliers/${id}`, dto).pipe(
      map(SupplierMapper.toViewModel)
    );
  }

  toggleStatus(id: string, active: boolean): Observable<Supplier> {
    return this.api.patch<SupplierDto>(`/suppliers/${id}/status`, { active }).pipe(
      map(SupplierMapper.toViewModel)
    );
  }
}
