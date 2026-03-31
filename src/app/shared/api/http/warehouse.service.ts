import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { WarehouseMapper } from '../../../entities/warehouse/warehouse.mapper';
import type {
  WarehouseDto, CreateWarehouseDto, UpdateWarehouseDto,
  Warehouse, WarehouseFilters
} from '../../../entities/warehouse/warehouse.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface WarehouseListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly api = inject(ApiClient);

  getAll(params: WarehouseListParams & WarehouseFilters): Observable<PaginatedResponse<Warehouse>> {
    return this.api.get<PaginatedResponse<WarehouseDto>>('/warehouses', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search && { search: params.search }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.sort && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(
      map(response => ({
        data: WarehouseMapper.fromDtoList(response.data),
        meta: response.meta,
      }))
    );
  }

  getById(id: string): Observable<Warehouse> {
    return this.api.get<WarehouseDto>(`/warehouses/${id}`).pipe(
      map(dto => WarehouseMapper.fromDto(dto))
    );
  }

  create(dto: CreateWarehouseDto): Observable<Warehouse> {
    return this.api.post<WarehouseDto>('/warehouses', dto).pipe(
      map(dto => WarehouseMapper.fromDto(dto))
    );
  }

  update(id: string, dto: UpdateWarehouseDto): Observable<Warehouse> {
    return this.api.put<WarehouseDto>(`/warehouses/${id}`, dto).pipe(
      map(dto => WarehouseMapper.fromDto(dto))
    );
  }

  toggleStatus(id: string): Observable<Warehouse> {
    return this.api.patch<WarehouseDto>(`/warehouses/${id}/toggle-status`, {}).pipe(
      map(dto => WarehouseMapper.fromDto(dto))
    );
  }
}
