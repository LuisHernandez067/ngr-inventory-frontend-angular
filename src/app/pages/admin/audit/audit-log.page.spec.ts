import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuditLogPage } from './audit-log.page';
import { AuditEventService } from '../../../shared/api/http/audit-event.service';
import { ExportService } from '../../../shared/services/export.service';
import { ApiClient } from '../../../shared/api/http/api-client';
import type { AuditEvent } from '../../../entities/audit-event/audit-event.types';
import type { PaginatedResponse } from '../../../shared/types';
import { of, throwError } from 'rxjs';

const mockEvent: AuditEvent = {
  id: 'evt-001',
  action: 'product.created',
  actionLabel: 'Product › created',
  entityType: 'Product',
  entityId: 'prod-123',
  actorId: 'user-1',
  actorEmail: 'admin@example.com',
  payload: { name: 'Widget' },
  ipAddress: '192.168.1.1',
  occurredAt: new Date('2026-03-30T14:30:00Z'),
  occurredAtLabel: '30/03/2026 14:30',
};

const mockResponse: PaginatedResponse<AuditEvent> = {
  data: [mockEvent],
  meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
};

function createPage(serviceOverride?: Partial<AuditEventService>) {
  const mockAuditService: AuditEventService = {
    getAll: jest.fn().mockReturnValue(of(mockResponse)),
    getById: jest.fn().mockReturnValue(of(mockEvent)),
    ...serviceOverride,
  } as unknown as AuditEventService;

  const mockExportService = {
    isExporting: jest.fn().mockReturnValue(false),
    exportCsv: jest.fn().mockReturnValue(of(undefined)),
    exportXlsx: jest.fn().mockReturnValue(of(undefined)),
  } as unknown as ExportService;

  const mockHttpClient = {} as HttpClient;
  const mockApiClient = {} as ApiClient;

  const injector = Injector.create({
    providers: [
      { provide: AuditEventService, useValue: mockAuditService },
      { provide: ExportService, useValue: mockExportService },
      { provide: HttpClient, useValue: mockHttpClient },
      { provide: ApiClient, useValue: mockApiClient },
    ],
  });

  const component = runInInjectionContext(injector, () => new AuditLogPage());
  return { component, auditService: mockAuditService, exportService: mockExportService };
}

describe('AuditLogPage', () => {
  it('should initialize with empty events signal', () => {
    const { component } = createPage();
    expect(component.events()).toEqual([]);
  });

  it('should initialize with loading=false and error=null', () => {
    const { component } = createPage();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should initialize with expandedEventId=null', () => {
    const { component } = createPage();
    expect(component.expandedEventId()).toBeNull();
  });

  it('should load events and populate events signal', () => {
    const { component } = createPage();
    component.loadData();
    expect(component.events()).toHaveLength(1);
    expect(component.events()[0].actionLabel).toBe('Product › created');
  });

  it('should set meta on successful load', () => {
    const { component } = createPage();
    component.loadData();
    expect(component.meta()?.total).toBe(1);
  });

  it('should toggle expandedEventId when toggleExpand is called', () => {
    const { component } = createPage();
    component.toggleExpand('evt-001');
    expect(component.expandedEventId()).toBe('evt-001');
  });

  it('should collapse row when toggleExpand is called again with same id', () => {
    const { component } = createPage();
    component.toggleExpand('evt-001');
    component.toggleExpand('evt-001');
    expect(component.expandedEventId()).toBeNull();
  });

  it('should update filter signals', () => {
    const { component } = createPage();
    component.entityTypeFilter.set('Product');
    expect(component.entityTypeFilter()).toBe('Product');
    component.actionFilter.set('product.created');
    expect(component.actionFilter()).toBe('product.created');
  });

  it('should set error when service fails', () => {
    const { component } = createPage({
      getAll: jest.fn().mockReturnValue(throwError(() => new Error('Network error'))),
    });
    component.loadData();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });
});
