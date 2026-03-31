import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RolesPage } from './roles.page';
import { RoleService } from '../../../shared/api/http/role.service';
import { ApiClient } from '../../../shared/api/http/api-client';
import type { Role } from '../../../entities/role/role.types';
import type { PaginatedResponse } from '../../../shared/types';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

const mockRole: Role = {
  id: 'role-1',
  name: 'admin',
  description: 'Administrador del sistema',
  permissions: ['inventory.read'],
  permissionsCount: 1,
  isSystem: false,
  isDeletable: true,
  usersCount: 3,
  createdAt: new Date('2024-01-15T09:00:00Z'),
};

const mockSystemRole: Role = {
  id: 'role-sys',
  name: 'super-admin',
  description: 'Rol del sistema',
  permissions: [],
  permissionsCount: 0,
  isSystem: true,
  isDeletable: false,
  usersCount: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

const mockResponse: PaginatedResponse<Role> = {
  data: [mockRole, mockSystemRole],
  meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
};

function createWithMocks(serviceOverride?: Partial<RoleService>) {
  const mockService: RoleService = {
    getAll:             jest.fn().mockReturnValue(of(mockResponse)),
    getById:            jest.fn(),
    create:             jest.fn(),
    update:             jest.fn(),
    delete:             jest.fn().mockReturnValue(of(undefined)),
    updatePermissions:  jest.fn(),
    ...serviceOverride,
  } as unknown as RoleService;

  const mockRouter = { navigate: jest.fn() } as unknown as Router;
  const mockDialog = {
    open: jest.fn().mockReturnValue({ afterClosed: () => of(false) }),
  } as unknown as MatDialog;

  const mockHttpClient = {} as HttpClient;
  const mockApiClient  = {} as ApiClient;

  const injector = Injector.create({
    providers: [
      { provide: RoleService, useValue: mockService },
      { provide: Router,      useValue: mockRouter },
      { provide: MatDialog,   useValue: mockDialog },
      { provide: HttpClient,  useValue: mockHttpClient },
      { provide: ApiClient,   useValue: mockApiClient },
    ],
  });

  const component = runInInjectionContext(injector, () => new RolesPage());
  return { component, service: mockService, router: mockRouter, dialog: mockDialog };
}

describe('RolesPage', () => {
  it('should initialize with empty roles signal', () => {
    const { component } = createWithMocks();
    expect(component.roles()).toEqual([]);
  });

  it('should initialize with loading=false', () => {
    const { component } = createWithMocks();
    expect(component.loading()).toBe(false);
  });

  it('should call RoleService.getAll when loadRoles is called', () => {
    const { component, service } = createWithMocks();
    component.loadRoles();
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('should set roles on successful loadRoles call', () => {
    const { component } = createWithMocks();
    component.loadRoles();
    expect(component.roles()).toHaveLength(2);
    expect(component.roles()[0].name).toBe('admin');
  });

  it('should set loading to false after successful loadRoles', () => {
    const { component } = createWithMocks();
    component.loadRoles();
    expect(component.loading()).toBe(false);
  });

  it('should set meta signal on successful loadRoles', () => {
    const { component } = createWithMocks();
    component.loadRoles();
    expect(component.meta()?.total).toBe(2);
  });

  it('should set error signal when service fails', () => {
    const { component } = createWithMocks({
      getAll: jest.fn().mockReturnValue(
        throwError(() => ({ title: 'Error de servidor', type: 'SERVER_ERROR' }))
      ),
    });
    component.loadRoles();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('should have system role with isDeletable=false', () => {
    const { component } = createWithMocks();
    component.loadRoles();
    const systemRole = component.roles().find(r => r.isSystem);
    expect(systemRole?.isDeletable).toBe(false);
  });

  it('should have non-system role with isDeletable=true', () => {
    const { component } = createWithMocks();
    component.loadRoles();
    const normalRole = component.roles().find(r => !r.isSystem);
    expect(normalRole?.isDeletable).toBe(true);
  });
});
