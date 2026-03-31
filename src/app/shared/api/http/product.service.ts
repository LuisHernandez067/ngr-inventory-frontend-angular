import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from './api-client';
import { ProductMapper } from '../../../entities/product/product.mapper';
import type {
  ProductDto, CreateProductDto, UpdateProductDto,
  Product, ProductStockEntry, ProductStockEntryDto
} from '../../../entities/product/product.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface ProductListParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  status?: 'active' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiClient);

  getAll(params: ProductListParams): Observable<PaginatedResponse<Product>> {
    return this.api.get<PaginatedResponse<ProductDto>>('/products', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search && { search: params.search }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.status && { status: params.status }),
      ...(params.sort && { sort: params.sort.field, order: params.sort.order }),
    }).pipe(
      map(response => ({
        data: response.data.map(ProductMapper.toViewModel),
        meta: response.meta,
      }))
    );
  }

  getById(id: string): Observable<Product> {
    return this.api.get<ProductDto>(`/products/${id}`).pipe(
      map(ProductMapper.toViewModel)
    );
  }

  create(dto: CreateProductDto): Observable<Product> {
    return this.api.post<ProductDto>('/products', dto).pipe(
      map(ProductMapper.toViewModel)
    );
  }

  update(id: string, dto: UpdateProductDto): Observable<Product> {
    return this.api.put<ProductDto>(`/products/${id}`, dto).pipe(
      map(ProductMapper.toViewModel)
    );
  }

  toggleStatus(id: string, active: boolean): Observable<Product> {
    return this.api.patch<ProductDto>(`/products/${id}/status`, { active }).pipe(
      map(ProductMapper.toViewModel)
    );
  }

  getStock(id: string, minStock: number): Observable<ProductStockEntry[]> {
    return this.api.get<ProductStockEntryDto[]>(`/products/${id}/stock`).pipe(
      map(entries => entries.map(e => ProductMapper.stockToViewModel(e, minStock)))
    );
  }
}
