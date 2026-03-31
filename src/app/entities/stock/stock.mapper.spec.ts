import { StockMapper } from './stock.mapper';
import type { StockEntryDto } from './stock.types';

const base: StockEntryDto = {
  productId: 'p-1',
  productName: 'Producto Test',
  productSku: 'SKU-001',
  categoryId: 'c-1',
  categoryName: 'Categoría',
  unit: 'unidad',
  minStock: 10,
  totalQuantity: 50,
  reservedQuantity: 5,
  availableQuantity: 45,
};

describe('StockMapper', () => {
  describe('fromDto', () => {
    it('maps all base fields correctly', () => {
      const r = StockMapper.fromDto(base);
      expect(r.productId).toBe('p-1');
      expect(r.productSku).toBe('SKU-001');
      expect(r.totalQuantity).toBe(50);
      expect(r.availableQuantity).toBe(45);
    });

    it('defaults optional warehouse/location fields to empty string', () => {
      const r = StockMapper.fromDto(base);
      expect(r.warehouseId).toBe('');
      expect(r.warehouseName).toBe('');
      expect(r.locationId).toBe('');
      expect(r.locationName).toBe('');
    });

    it('maps optional fields when present', () => {
      const r = StockMapper.fromDto({ ...base, warehouseId: 'w-1', warehouseName: 'Almacén A' });
      expect(r.warehouseId).toBe('w-1');
      expect(r.warehouseName).toBe('Almacén A');
    });

    it('status is "ok" when available > minStock', () => {
      expect(StockMapper.fromDto({ ...base, availableQuantity: 45, minStock: 10 }).status).toBe('ok');
    });

    it('status is "low" when available <= minStock but > 25% of minStock', () => {
      expect(StockMapper.fromDto({ ...base, availableQuantity: 10, minStock: 10 }).status).toBe('low');
      expect(StockMapper.fromDto({ ...base, availableQuantity: 4, minStock: 10 }).status).toBe('low');
    });

    it('status is "critical" when available <= 25% of minStock', () => {
      expect(StockMapper.fromDto({ ...base, availableQuantity: 2, minStock: 10 }).status).toBe('critical');
    });

    it('status is "out" when available <= 0', () => {
      expect(StockMapper.fromDto({ ...base, availableQuantity: 0 }).status).toBe('out');
      expect(StockMapper.fromDto({ ...base, availableQuantity: -1 }).status).toBe('out');
    });

    it('status is "ok" when minStock is 0 and available > 0', () => {
      expect(StockMapper.fromDto({ ...base, availableQuantity: 1, minStock: 0 }).status).toBe('ok');
    });

    it('sets correct statusLabel for each status', () => {
      expect(StockMapper.fromDto({ ...base, availableQuantity: 45 }).statusLabel).toBe('OK');
      expect(StockMapper.fromDto({ ...base, availableQuantity: 10 }).statusLabel).toBe('Stock bajo');
      expect(StockMapper.fromDto({ ...base, availableQuantity: 2 }).statusLabel).toBe('Stock crítico');
      expect(StockMapper.fromDto({ ...base, availableQuantity: 0 }).statusLabel).toBe('Sin stock');
    });

    it('computes availabilityPct correctly', () => {
      const r = StockMapper.fromDto({ ...base, availableQuantity: 25, totalQuantity: 50 });
      expect(r.availabilityPct).toBe(50);
    });

    it('avoids division by zero when totalQuantity is 0', () => {
      const r = StockMapper.fromDto({ ...base, totalQuantity: 0, availableQuantity: 0 });
      expect(r.availabilityPct).toBe(0);
    });
  });

  describe('fromDtoList', () => {
    it('maps an array of DTOs', () => {
      const r = StockMapper.fromDtoList([base, { ...base, productId: 'p-2' }]);
      expect(r).toHaveLength(2);
      expect(r[1].productId).toBe('p-2');
    });

    it('returns empty array for empty input', () => {
      expect(StockMapper.fromDtoList([])).toEqual([]);
    });
  });
});
