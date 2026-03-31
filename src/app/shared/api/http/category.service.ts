import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from './api-client';
import { CategoryMapper } from '../../../entities/category/category.mapper';
import type { CategoryDto, CreateCategoryDto, UpdateCategoryDto, Category } from '../../../entities/category/category.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface CategoryListParams extends PaginationParams {
  search?: string;
  status?: 'active' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiClient);

  getAll(params: CategoryListParams): Observable<PaginatedResponse<Category>> {
    return this.api.get<PaginatedResponse<CategoryDto>>('/categories', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status }),
    }).pipe(
      map(response => ({
        data: response.data.map(CategoryMapper.toViewModel),
        meta: response.meta,
      }))
    );
  }

  getById(id: string): Observable<Category> {
    return this.api.get<CategoryDto>(`/categories/${id}`).pipe(
      map(CategoryMapper.toViewModel)
    );
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return this.api.post<CategoryDto>('/categories', dto).pipe(
      map(CategoryMapper.toViewModel)
    );
  }

  update(id: string, dto: UpdateCategoryDto): Observable<Category> {
    return this.api.put<CategoryDto>(`/categories/${id}`, dto).pipe(
      map(CategoryMapper.toViewModel)
    );
  }

  toggleStatus(id: string, active: boolean): Observable<Category> {
    return this.api.patch<CategoryDto>(`/categories/${id}/status`, { active }).pipe(
      map(CategoryMapper.toViewModel)
    );
  }
}
