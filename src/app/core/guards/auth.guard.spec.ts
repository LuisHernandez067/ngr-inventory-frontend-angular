import { Injector, runInInjectionContext } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthStateService } from '../providers/auth-state.service';
import { authGuard } from './auth.guard';

function createInjector(isAuthenticated: boolean) {
  const mockAuthState = {
    isAuthenticated: jest.fn().mockReturnValue(isAuthenticated),
  } as unknown as AuthStateService;

  const mockRouter = {
    navigate: jest.fn(),
    createUrlTree: jest.fn().mockReturnValue({ toString: () => '/auth/login' } as unknown as UrlTree),
  } as unknown as Router;

  const injector = Injector.create({
    providers: [
      { provide: AuthStateService, useValue: mockAuthState },
      { provide: Router, useValue: mockRouter },
    ],
  });

  return { injector, mockAuthState, mockRouter };
}

describe('authGuard', () => {
  it('should return true when user is authenticated', () => {
    const { injector } = createInjector(true);
    let result: unknown;

    runInInjectionContext(injector, () => {
      // authGuard is a CanActivateFn — call it with minimal stubs
      result = authGuard({} as never, {} as never);
    });

    expect(result).toBe(true);
  });

  it('should return a UrlTree redirecting to /auth/login when unauthenticated', () => {
    const { injector, mockRouter } = createInjector(false);
    let result: unknown;

    runInInjectionContext(injector, () => {
      result = authGuard({} as never, {} as never);
    });

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).not.toBe(true);
  });

  it('should call AuthStateService.isAuthenticated to determine access', () => {
    const { injector, mockAuthState } = createInjector(true);

    runInInjectionContext(injector, () => {
      authGuard({} as never, {} as never);
    });

    expect(mockAuthState.isAuthenticated).toHaveBeenCalled();
  });
});
