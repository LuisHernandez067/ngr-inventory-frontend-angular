import { AuditEventMapper } from './audit-event.mapper';
import type { AuditEventDto } from './audit-event.types';

const baseDto: AuditEventDto = {
  id: 'evt-001',
  action: 'product.created',
  entityType: 'Product',
  entityId: 'prod-123',
  actorId: 'user-1',
  actorEmail: 'admin@example.com',
  occurredAt: '2026-03-30T14:30:00Z',
};

describe('AuditEventMapper', () => {
  describe('actionLabel', () => {
    it('should capitalize first segment for single-segment action', () => {
      const dto: AuditEventDto = { ...baseDto, action: 'login' };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.actionLabel).toBe('Login');
    });

    it('should format two-segment action as "First › second"', () => {
      const dto: AuditEventDto = { ...baseDto, action: 'product.created' };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.actionLabel).toBe('Product › created');
    });

    it('should format three-segment action as "First › second › third"', () => {
      const dto: AuditEventDto = { ...baseDto, action: 'movement.stock.adjusted' };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.actionLabel).toBe('Movement › stock › adjusted');
    });

    it('should format user.login action correctly', () => {
      const dto: AuditEventDto = { ...baseDto, action: 'user.login' };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.actionLabel).toBe('User › login');
    });
  });

  describe('defaults', () => {
    it('should default payload to empty object when undefined', () => {
      const dto: AuditEventDto = { ...baseDto, payload: undefined };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.payload).toEqual({});
    });

    it('should preserve payload when provided', () => {
      const dto: AuditEventDto = { ...baseDto, payload: { productId: 'p1', name: 'Widget' } };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.payload).toEqual({ productId: 'p1', name: 'Widget' });
    });

    it('should default ipAddress to empty string when undefined', () => {
      const dto: AuditEventDto = { ...baseDto, ipAddress: undefined };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.ipAddress).toBe('');
    });

    it('should preserve ipAddress when provided', () => {
      const dto: AuditEventDto = { ...baseDto, ipAddress: '192.168.1.1' };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.ipAddress).toBe('192.168.1.1');
    });
  });

  describe('date handling', () => {
    it('should parse occurredAt ISO string as a Date object', () => {
      const result = AuditEventMapper.fromDto(baseDto);
      expect(result.occurredAt).toBeInstanceOf(Date);
    });

    it('should format occurredAtLabel as dd/MM/yyyy HH:mm (UTC check on fixed date)', () => {
      // Use a fixed date. Format is local time, so we build the date explicitly.
      const dto: AuditEventDto = {
        ...baseDto,
        occurredAt: new Date(2026, 2, 30, 14, 30, 0).toISOString(), // 30/03/2026 14:30
      };
      const result = AuditEventMapper.fromDto(dto);
      expect(result.occurredAtLabel).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
      expect(result.occurredAtLabel).toContain('2026');
    });
  });

  describe('pass-through fields', () => {
    it('should pass entityType through unchanged', () => {
      const result = AuditEventMapper.fromDto(baseDto);
      expect(result.entityType).toBe('Product');
    });

    it('should pass actorEmail through unchanged', () => {
      const result = AuditEventMapper.fromDto(baseDto);
      expect(result.actorEmail).toBe('admin@example.com');
    });
  });
});
