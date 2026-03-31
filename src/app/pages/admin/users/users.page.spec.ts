import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UsersPage } from './users.page';
import { UserService } from '../../../shared/api/http/user.service';
import { ApiClient } from '../../../shared/api/http/api-client';
import type { User } from '../../../entities/user/user.types';
import type { PaginatedResponse } from '../../../shared/types';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

const mockUser: User = {
  id: 'user-1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  status: 'active',
  statusLabel: 'Activo',
  roles: ['admin'],
  roleNames: 'admin',
  createdAt: new Date('2024-03-01T10:00:00Z'),
  lastLoginAt: null,
};

const mockResponse: PaginatedResponse<User> = {
  data: [mockUser],
  meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
};

function createWithMocks(serviceOverride?: Partial<UserService>) {
  const mockService: UserService = {
    getAll:      jest.fn().mockReturnValue(of(mockResponse)),
    getById:     jest.fn(),
    create:      jest.fn(),
    update:      jest.fn(),
    delete:      jest.fn().mockReturnValue(of(undefined)),
    updateRoles: jest.fn(),
    ...serviceOverride,
  } as unknown as UserService;

  const mockRouter = { navigate: jest.fn() } as unknown as Router;
  const mockDialog = {
    open: jest.fn().mockReturnValue({ afterClosed: () => of(false) }),
  } as unknown as MatDialog;

  const mockHttpClient = {} as HttpClient;
  const mockApiClient  = {} as ApiClient;

  const injector = Injector.create({
    providers: [
      { provide: UserService, useValue: mockService },
      { provide: Router,      useValue: mockRouter },
      { provide: MatDialog,   useValue: mockDialog },
      { provide: HttpClient,  useValue: mockHttpClient },
      { provide: ApiClient,   useValue: mockApiClient },
    ],
  });

  const component = runInInjectionContext(injector, () => new UsersPage());
  return { component, service: mockService, router: mockRouter, dialog: mockDialog };
}

describe('UsersPage', () => {
  it('should initialize with empty users signal', () => {
    const { component } = createWithMocks();
    expect(component.users()).toEqual([]);
  });

  it('should initialize with loading=false', () => {
    const { component } = createWithMocks();
    expect(component.loading()).toBe(false);
  });

  it('should call UserService.getAll when loadUsers is called', () => {
    const { component, service } = createWithMocks();
    component.loadUsers();
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('should set users on successful loadUsers call', () => {
    const { component } = createWithMocks();
    component.loadUsers();
    expect(component.users()).toHaveLength(1);
    expect(component.users()[0].fullName).toBe('John Doe');
  });

  it('should set loading to false after successful loadUsers', () => {
    const { component } = createWithMocks();
    component.loadUsers();
    expect(component.loading()).toBe(false);
  });

  it('should set meta signal on successful loadUsers', () => {
    const { component } = createWithMocks();
    component.loadUsers();
    expect(component.meta()?.total).toBe(1);
    expect(component.meta()?.page).toBe(1);
  });

  it('should set error signal when service fails', () => {
    const { component } = createWithMocks({
      getAll: jest.fn().mockReturnValue(
        throwError(() => ({ title: 'Error de servidor', type: 'SERVER_ERROR' }))
      ),
    });
    component.loadUsers();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('should clear error before each load attempt', () => {
    const mockGetAll = jest.fn()
      .mockReturnValueOnce(throwError(() => ({ title: 'Error', type: 'SERVER_ERROR' })))
      .mockReturnValueOnce(of(mockResponse));

    const { component } = createWithMocks({ getAll: mockGetAll });
    component.loadUsers();
    expect(component.error()).toBeTruthy();

    component.loadUsers();
    expect(component.error()).toBeNull();
  });
});
