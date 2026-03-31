import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  // PermissionService es puro Signals, sin dependencias Angular — no necesita TestBed
  beforeEach(() => {
    service = new PermissionService();
  });

  it('should start with no permissions', () => {
    expect(service.can('any.permission')).toBe(false);
  });

  it('should return true for loaded permissions', () => {
    service.load(['products.read', 'products.write']);
    expect(service.can('products.read')).toBe(true);
    expect(service.can('products.write')).toBe(true);
  });

  it('should return false for permissions not loaded', () => {
    service.load(['products.read']);
    expect(service.can('products.delete')).toBe(false);
  });

  it('should clear all permissions on clear()', () => {
    service.load(['products.read']);
    service.clear();
    expect(service.can('products.read')).toBe(false);
  });

  it('canAll() should return true only when all permissions match', () => {
    service.load(['a', 'b', 'c']);
    expect(service.canAll(['a', 'b'])).toBe(true);
    expect(service.canAll(['a', 'x'])).toBe(false);
  });

  it('canAny() should return true if at least one permission matches', () => {
    service.load(['a', 'b']);
    expect(service.canAny(['a', 'x'])).toBe(true);
    expect(service.canAny(['x', 'y'])).toBe(false);
  });

  it('canSignal() should reactively reflect permission state', () => {
    const canRead = service.canSignal('products.read');
    expect(canRead()).toBe(false);
    service.load(['products.read']);
    expect(canRead()).toBe(true);
    service.clear();
    expect(canRead()).toBe(false);
  });
});
