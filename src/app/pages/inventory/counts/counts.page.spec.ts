import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CountsPage } from './counts.page';
import { CountService } from '../../../shared/api/http/count.service';
import { ApiClient } from '../../../shared/api/http/api-client';
import type { PhysicalCount } from '../../../entities/count/count.types';
import type { PaginatedResponse } from '../../../shared/types';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

const mockCount: PhysicalCount = {
  id: 'cnt-1',
  code: 'CNT-001',
  status: 'draft',
  statusLabel: 'Borrador',
  warehouseId: 'w-1',
  warehouseName: 'Almacén Central',
  createdBy: 'user-1',
  createdAt: new Date('2024-03-01T10:00:00Z'),
  completedAt: null,
  totalItems: 100,
  countedItems: 0,
  discrepancyItems: 0,
  progressPercent: 0,
};

const mockResponse: PaginatedResponse<PhysicalCount> = {
  data: [mockCount],
  meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
};

function createWithMocks(serviceOverride?: Partial<CountService>) {
  const mockService: CountService = {
    getAll: jest.fn().mockReturnValue(of(mockResponse)),
    cancel: jest.fn().mockReturnValue(of(mockCount)),
    getById: jest.fn(),
    create: jest.fn(),
    updateItem: jest.fn(),
    confirm: jest.fn(),
    ...serviceOverride,
  } as unknown as CountService;

  const mockRouter = { navigate: jest.fn() } as unknown as Router;
  const mockDialog = {
    open: jest.fn().mockReturnValue({ afterClosed: () => of(false) }),
  } as unknown as MatDialog;

  const mockHttpClient = {} as HttpClient;
  const mockApiClient = {} as ApiClient;

  const injector = Injector.create({
    providers: [
      { provide: CountService, useValue: mockService },
      { provide: Router, useValue: mockRouter },
      { provide: MatDialog, useValue: mockDialog },
      { provide: HttpClient, useValue: mockHttpClient },
      { provide: ApiClient, useValue: mockApiClient },
    ],
  });

  const component = runInInjectionContext(injector, () => new CountsPage());
  return { component, service: mockService, router: mockRouter, dialog: mockDialog };
}

describe('CountsPage', () => {
  it('should initialize with empty counts signal', () => {
    const { component } = createWithMocks();
    expect(component.counts()).toEqual([]);
  });

  it('should initialize with loading=false', () => {
    const { component } = createWithMocks();
    expect(component.loading()).toBe(false);
  });

  it('should call CountService.getAll when loadCounts is called', () => {
    const { component, service } = createWithMocks();
    component.loadCounts();
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('should set counts on successful loadCounts call', () => {
    const { component } = createWithMocks();
    component.loadCounts();
    expect(component.counts()).toHaveLength(1);
    expect(component.counts()[0].code).toBe('CNT-001');
  });

  it('should set loading to false after successful loadCounts', () => {
    const { component } = createWithMocks();
    component.loadCounts();
    expect(component.loading()).toBe(false);
  });

  it('should set meta signal on successful loadCounts', () => {
    const { component } = createWithMocks();
    component.loadCounts();
    expect(component.meta()?.total).toBe(1);
    expect(component.meta()?.page).toBe(1);
  });

  it('should set error signal when service fails', () => {
    const { component } = createWithMocks({
      getAll: jest.fn().mockReturnValue(
        throwError(() => ({ title: 'Error de servidor', type: 'SERVER_ERROR' }))
      ),
    });
    component.loadCounts();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('should clear error before each load attempt', () => {
    const mockGetAll = jest.fn()
      .mockReturnValueOnce(throwError(() => ({ title: 'Error', type: 'SERVER_ERROR' })))
      .mockReturnValueOnce(of(mockResponse));

    const { component } = createWithMocks({ getAll: mockGetAll });
    component.loadCounts();
    expect(component.error()).toBeTruthy();

    component.loadCounts();
    expect(component.error()).toBeNull();
  });
});
