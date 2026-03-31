import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { StockMapper } from '../../../entities/stock/stock.mapper';
import type { StockEntryDto, StockEntry, StockFilters } from '../../../entities/stock/stock.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface StockListParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  warehouseId?: string;
  locationId?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly api = inject(ApiClient);

  /** Stock consolidado por producto */
  getCurrent(params: StockListParams & StockFilters): Observable<PaginatedResponse<StockEntry>> {
    return this.api.get<PaginatedResponse<StockEntryDto>>('/inventory/stock', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search      && { search:      params.search }),
      ...(params.categoryId  && { categoryId:  params.categoryId }),
      ...(params.warehouseId && { warehouseId: params.warehouseId }),
      ...(params.locationId  && { locationId:  params.locationId }),
      ...(params.status      && { status:      params.status }),
      ...(params.sort        && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(map(r => ({ data: StockMapper.fromDtoList(r.data), meta: r.meta })));
  }

  /** Stock de un producto desglosado por almacén */
  getByWarehouse(productId: string, params: PaginationParams): Observable<PaginatedResponse<StockEntry>> {
    return this.api.get<PaginatedResponse<StockEntryDto>>(`/inventory/stock/${productId}/by-warehouse`, {
      page: params.page,
      pageSize: params.pageSize,
    }).pipe(map(r => ({ data: StockMapper.fromDtoList(r.data), meta: r.meta })));
  }

  /** Stock de un almacén desglosado por ubicación */
  getByLocation(warehouseId: string, params: StockListParams): Observable<PaginatedResponse<StockEntry>> {
    return this.api.get<PaginatedResponse<StockEntryDto>>(`/inventory/stock/warehouse/${warehouseId}/locations`, {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search    && { search:    params.search }),
      ...(params.locationId && { locationId: params.locationId }),
    }).pipe(map(r => ({ data: StockMapper.fromDtoList(r.data), meta: r.meta })));
  }

  /** KPIs para el dashboard */
  getKpis(): Observable<StockKpis> {
    return this.api.get<StockKpis>('/inventory/stock/kpis');
  }
}

export interface StockKpis {
  totalProducts: number;
  totalMovementsToday: number;
  lowStockAlerts: number;
  outOfStockCount: number;
  totalWarehouses: number;
}
