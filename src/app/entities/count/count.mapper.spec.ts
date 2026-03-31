import { CountMapper } from './count.mapper';
import type { PhysicalCountSummaryDto, PhysicalCountItemDto, PhysicalCountDetailDto } from './count.types';

const baseSummary: PhysicalCountSummaryDto = {
  id: 'cnt-1',
  code: 'CNT-001',
  status: 'draft',
  warehouseId: 'w-1',
  warehouseName: 'Almacén Central',
  createdBy: 'user-1',
  createdAt: '2024-03-01T10:00:00Z',
  totalItems: 100,
  countedItems: 50,
  discrepancyItems: 5,
};

const baseItem: PhysicalCountItemDto = {
  id: 'item-1',
  productId: 'p-1',
  productCode: 'PROD-001',
  productName: 'Producto Test',
  locationId: 'loc-1',
  locationCode: 'A-01',
  theoreticalQty: 100,
  countedQty: 95,
  difference: -5,
  status: 'discrepancy',
};

describe('CountMapper', () => {
  describe('fromSummaryDto', () => {
    it('maps base fields correctly', () => {
      const result = CountMapper.fromSummaryDto(baseSummary);
      expect(result.id).toBe('cnt-1');
      expect(result.code).toBe('CNT-001');
      expect(result.warehouseId).toBe('w-1');
      expect(result.warehouseName).toBe('Almacén Central');
      expect(result.totalItems).toBe(100);
      expect(result.countedItems).toBe(50);
      expect(result.discrepancyItems).toBe(5);
    });

    it('statusLabel is "Borrador" for draft', () => {
      const result = CountMapper.fromSummaryDto({ ...baseSummary, status: 'draft' });
      expect(result.statusLabel).toBe('Borrador');
    });

    it('statusLabel is "En progreso" for in_progress', () => {
      const result = CountMapper.fromSummaryDto({ ...baseSummary, status: 'in_progress' });
      expect(result.statusLabel).toBe('En progreso');
    });

    it('statusLabel is "Completado" for completed', () => {
      const result = CountMapper.fromSummaryDto({ ...baseSummary, status: 'completed' });
      expect(result.statusLabel).toBe('Completado');
    });

    it('statusLabel is "Cancelado" for cancelled', () => {
      const result = CountMapper.fromSummaryDto({ ...baseSummary, status: 'cancelled' });
      expect(result.statusLabel).toBe('Cancelado');
    });

    it('progressPercent is 0 when totalItems is 0', () => {
      const result = CountMapper.fromSummaryDto({ ...baseSummary, totalItems: 0, countedItems: 0 });
      expect(result.progressPercent).toBe(0);
    });

    it('progressPercent is calculated correctly for normal case', () => {
      const result = CountMapper.fromSummaryDto({ ...baseSummary, totalItems: 100, countedItems: 50 });
      expect(result.progressPercent).toBe(50);
    });

    it('progressPercent rounds to nearest integer', () => {
      const result = CountMapper.fromSummaryDto({ ...baseSummary, totalItems: 3, countedItems: 1 });
      expect(result.progressPercent).toBe(33);
    });

    it('parses createdAt to Date object', () => {
      const result = CountMapper.fromSummaryDto(baseSummary);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.getFullYear()).toBe(2024);
    });

    it('completedAt is null when not provided', () => {
      const result = CountMapper.fromSummaryDto(baseSummary);
      expect(result.completedAt).toBeNull();
    });

    it('completedAt is parsed to Date when provided', () => {
      const result = CountMapper.fromSummaryDto({ ...baseSummary, completedAt: '2024-03-10T15:00:00Z' });
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.completedAt?.getFullYear()).toBe(2024);
    });
  });

  describe('fromItemDto', () => {
    it('maps base fields correctly', () => {
      const result = CountMapper.fromItemDto(baseItem);
      expect(result.id).toBe('item-1');
      expect(result.productCode).toBe('PROD-001');
      expect(result.theoreticalQty).toBe(100);
      expect(result.countedQty).toBe(95);
      expect(result.difference).toBe(-5);
    });

    it('hasDiscrepancy is true when status is discrepancy', () => {
      const result = CountMapper.fromItemDto({ ...baseItem, status: 'discrepancy' });
      expect(result.hasDiscrepancy).toBe(true);
    });

    it('hasDiscrepancy is false when status is counted', () => {
      const result = CountMapper.fromItemDto({ ...baseItem, status: 'counted' });
      expect(result.hasDiscrepancy).toBe(false);
    });

    it('hasDiscrepancy is false when status is pending', () => {
      const result = CountMapper.fromItemDto({ ...baseItem, status: 'pending' });
      expect(result.hasDiscrepancy).toBe(false);
    });

    it('statusLabel is "Pendiente" for pending', () => {
      const result = CountMapper.fromItemDto({ ...baseItem, status: 'pending' });
      expect(result.statusLabel).toBe('Pendiente');
    });

    it('statusLabel is "Contado" for counted', () => {
      const result = CountMapper.fromItemDto({ ...baseItem, status: 'counted' });
      expect(result.statusLabel).toBe('Contado');
    });

    it('statusLabel is "Diferencia" for discrepancy', () => {
      const result = CountMapper.fromItemDto({ ...baseItem, status: 'discrepancy' });
      expect(result.statusLabel).toBe('Diferencia');
    });

    it('countedQty is null when null in dto', () => {
      const result = CountMapper.fromItemDto({ ...baseItem, countedQty: null, difference: null });
      expect(result.countedQty).toBeNull();
      expect(result.difference).toBeNull();
    });
  });

  describe('fromDetailDto', () => {
    it('maps summary fields and items array', () => {
      const dto: PhysicalCountDetailDto = { ...baseSummary, items: [baseItem] };
      const result = CountMapper.fromDetailDto(dto);
      expect(result.id).toBe('cnt-1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('item-1');
    });

    it('returns empty items array when no items', () => {
      const dto: PhysicalCountDetailDto = { ...baseSummary, items: [] };
      const result = CountMapper.fromDetailDto(dto);
      expect(result.items).toEqual([]);
    });
  });
});
