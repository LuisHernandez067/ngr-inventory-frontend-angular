import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { CountMapper } from '../../../entities/count/count.mapper';
import type {
  PhysicalCountSummaryDto,
  PhysicalCountDetailDto,
  PhysicalCountItemDto,
  PhysicalCount,
  PhysicalCountDetail,
  PhysicalCountItem,
} from '../../../entities/count/count.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface CountListParams extends PaginationParams {
  warehouseId?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class CountService {
  private readonly api = inject(ApiClient);

  getAll(params: CountListParams): Observable<PaginatedResponse<PhysicalCount>> {
    return this.api.get<PaginatedResponse<PhysicalCountSummaryDto>>('/inventory/physical-counts', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.warehouseId && { warehouseId: params.warehouseId }),
      ...(params.status      && { status:      params.status }),
      ...(params.sort        && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(
      map(r => ({
        data: r.data.map(dto => CountMapper.fromSummaryDto(dto)),
        meta: r.meta,
      }))
    );
  }

  getById(id: string): Observable<PhysicalCountDetail> {
    return this.api.get<PhysicalCountDetailDto>(`/inventory/physical-counts/${id}`).pipe(
      map(dto => CountMapper.fromDetailDto(dto))
    );
  }

  create(body: { warehouseId: string; notes?: string }): Observable<PhysicalCount> {
    return this.api.post<PhysicalCountSummaryDto>('/inventory/physical-counts', body).pipe(
      map(dto => CountMapper.fromSummaryDto(dto))
    );
  }

  updateItem(countId: string, itemId: string, countedQty: number): Observable<PhysicalCountItem> {
    return this.api.patch<PhysicalCountItemDto>(
      `/inventory/physical-counts/${countId}/items/${itemId}`,
      { countedQty }
    ).pipe(
      map(dto => CountMapper.fromItemDto(dto))
    );
  }

  confirm(countId: string): Observable<PhysicalCount> {
    return this.api.post<PhysicalCountSummaryDto>(
      `/inventory/physical-counts/${countId}/confirm`,
      {}
    ).pipe(
      map(dto => CountMapper.fromSummaryDto(dto))
    );
  }

  cancel(countId: string): Observable<PhysicalCount> {
    return this.api.post<PhysicalCountSummaryDto>(
      `/inventory/physical-counts/${countId}/cancel`,
      {}
    ).pipe(
      map(dto => CountMapper.fromSummaryDto(dto))
    );
  }
}
