import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { MovementMapper } from '../../../entities/movement/movement.mapper';
import type {
  MovementDto, Movement, CreateMovementDto, ValidateMovementDto,
  ValidationResult, MovementFilters,
} from '../../../entities/movement/movement.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface MovementListParams extends PaginationParams {
  search?: string;
  type?: string;
  status?: string;
  productId?: string;
  warehouseId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly api = inject(ApiClient);

  getAll(params: MovementListParams & MovementFilters): Observable<PaginatedResponse<Movement>> {
    return this.api.get<PaginatedResponse<MovementDto>>('/inventory/movements', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search && { search: params.search }),
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
      ...(params.productId && { productId: params.productId }),
      ...(params.warehouseId && { warehouseId: params.warehouseId }),
      ...(params.dateFrom && { dateFrom: params.dateFrom }),
      ...(params.dateTo && { dateTo: params.dateTo }),
      ...(params.sort && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(
      map(response => ({
        data: MovementMapper.fromDtoList(response.data),
        meta: response.meta,
      }))
    );
  }

  getById(id: string): Observable<Movement> {
    return this.api.get<MovementDto>(`/inventory/movements/${id}`).pipe(
      map(dto => MovementMapper.fromDto(dto))
    );
  }

  validate(dto: ValidateMovementDto): Observable<ValidationResult> {
    return this.api.post<ValidationResult>('/inventory/movements/validate', dto);
  }

  create(dto: CreateMovementDto): Observable<Movement> {
    return this.api.post<MovementDto>('/inventory/movements', dto).pipe(
      map(dto => MovementMapper.fromDto(dto))
    );
  }
}
