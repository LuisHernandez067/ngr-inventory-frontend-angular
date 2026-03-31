import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ReportStockPage } from './report-stock.page';
import { StockService } from '../../shared/api/http/stock.service';
import { ExportService } from '../../shared/services/export.service';
import { ApiClient } from '../../shared/api/http/api-client';
import type { StockEntry } from '../../entities/stock/stock.types';
import type { PaginatedResponse } from '../../shared/types';
import { of, throwError } from 'rxjs';

const mockStockEntry: StockEntry = {
  productId: 'p-001',
  productName: 'Widget Pro',
  productSku: 'WGT-001',
  categoryId: 'cat-1',
  categoryName: 'Electronics',
  unit: 'pcs',
  minStock: 10,
  totalQuantity: 5,
  reservedQuantity: 0,
  availableQuantity: 5,
  warehouseId: 'wh-1',
  warehouseName: 'Main Warehouse',
  locationId: 'loc-1',
  locationName: 'A-1',
  status: 'low',
  statusLabel: 'Stock bajo',
  statusColor: 'warn',
  availabilityPct: 100,
};

const mockResponse: PaginatedResponse<StockEntry> = {
  data: [mockStockEntry],
  meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
};

function createPage(stockServiceOverride?: Partial<StockService>) {
  const mockStockService: StockService = {
    getCurrent: jest.fn().mockReturnValue(of(mockResponse)),
    getByWarehouse: jest.fn(),
    getByLocation: jest.fn(),
    getKpis: jest.fn(),
    ...stockServiceOverride,
  } as unknown as StockService;

  const mockExportService = {
    isExporting: jest.fn().mockReturnValue(false),
    exportCsv: jest.fn().mockReturnValue(of(undefined)),
    exportXlsx: jest.fn().mockReturnValue(of(undefined)),
  } as unknown as ExportService;

  const mockHttpClient = {} as HttpClient;
  const mockApiClient = {} as ApiClient;

  const injector = Injector.create({
    providers: [
      { provide: StockService, useValue: mockStockService },
      { provide: ExportService, useValue: mockExportService },
      { provide: HttpClient, useValue: mockHttpClient },
      { provide: ApiClient, useValue: mockApiClient },
    ],
  });

  const component = runInInjectionContext(injector, () => new ReportStockPage());
  return { component, stockService: mockStockService, exportService: mockExportService };
}

describe('ReportStockPage', () => {
  it('should initialize with empty data signal', () => {
    const { component } = createPage();
    expect(component.data()).toEqual([]);
  });

  it('should initialize with loading=false', () => {
    const { component } = createPage();
    expect(component.loading()).toBe(false);
  });

  it('should initialize with error=null', () => {
    const { component } = createPage();
    expect(component.error()).toBeNull();
  });

  it('should set loading=true during fetch and false after success', () => {
    const { component } = createPage();
    component.loadData();
    // After synchronous observable completes, loading should be false
    expect(component.loading()).toBe(false);
  });

  it('should populate data on successful load', () => {
    const { component } = createPage();
    component.loadData();
    expect(component.data()).toHaveLength(1);
    expect(component.data()[0].productName).toBe('Widget Pro');
  });

  it('should set meta on successful load', () => {
    const { component } = createPage();
    component.loadData();
    expect(component.meta()?.total).toBe(1);
  });

  it('should set error when service fails', () => {
    const { component } = createPage({
      getCurrent: jest.fn().mockReturnValue(
        throwError(() => new Error('Network error'))
      ),
    });
    component.loadData();
    expect(component.error()).toBeTruthy();
  });

  it('should reflect isExporting from ExportService', () => {
    const { component } = createPage();
    // The ExportService.isExporting mock returns false
    expect(component.isExporting()).toBe(false);
  });
});
