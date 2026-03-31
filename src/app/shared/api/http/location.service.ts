import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { LocationMapper } from '../../../entities/location/location.mapper';
import type {
  LocationDto, CreateLocationDto, UpdateLocationDto,
  Location, LocationFilters
} from '../../../entities/location/location.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface LocationListParams extends PaginationParams {
  search?: string;
  warehouseId?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly api = inject(ApiClient);

  getAll(params: LocationListParams & LocationFilters): Observable<PaginatedResponse<Location>> {
    return this.api.get<PaginatedResponse<LocationDto>>('/locations', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search && { search: params.search }),
      ...(params.warehouseId && { warehouseId: params.warehouseId }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.sort && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(
      map(response => ({
        data: LocationMapper.fromDtoList(response.data),
        meta: response.meta,
      }))
    );
  }

  getAllByWarehouse(warehouseId: string, params: PaginationParams): Observable<PaginatedResponse<Location>> {
    return this.api.get<PaginatedResponse<LocationDto>>('/locations', {
      page: params.page,
      pageSize: params.pageSize,
      warehouseId,
      ...(params.sort && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(
      map(response => ({
        data: LocationMapper.fromDtoList(response.data),
        meta: response.meta,
      }))
    );
  }

  getById(id: string): Observable<Location> {
    return this.api.get<LocationDto>(`/locations/${id}`).pipe(
      map(dto => LocationMapper.fromDto(dto))
    );
  }

  create(dto: CreateLocationDto): Observable<Location> {
    return this.api.post<LocationDto>('/locations', dto).pipe(
      map(dto => LocationMapper.fromDto(dto))
    );
  }

  update(id: string, dto: UpdateLocationDto): Observable<Location> {
    return this.api.put<LocationDto>(`/locations/${id}`, dto).pipe(
      map(dto => LocationMapper.fromDto(dto))
    );
  }

  toggleStatus(id: string): Observable<Location> {
    return this.api.patch<LocationDto>(`/locations/${id}/toggle-status`, {}).pipe(
      map(dto => LocationMapper.fromDto(dto))
    );
  }
}
