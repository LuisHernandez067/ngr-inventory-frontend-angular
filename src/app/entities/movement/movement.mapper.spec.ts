import { MovementMapper } from './movement.mapper';
import type { MovementDto } from './movement.types';

const baseDto: MovementDto = {
  id: 'mv-1',
  type: 'ENTRY',
  status: 'CONFIRMED',
  productId: 'p-1',
  productName: 'Producto Test',
  productSku: 'SKU-001',
  quantity: 10,
  unit: 'unidad',
  performedBy: 'u-1',
  performedByName: 'Juan Pérez',
  createdAt: '2024-01-15T10:00:00Z',
};

describe('MovementMapper', () => {
  describe('fromDto', () => {
    it('maps base fields correctly', () => {
      const result = MovementMapper.fromDto(baseDto);
      expect(result.id).toBe('mv-1');
      expect(result.type).toBe('ENTRY');
      expect(result.status).toBe('CONFIRMED');
      expect(result.productSku).toBe('SKU-001');
      expect(result.quantity).toBe(10);
    });

    it('provides empty string defaults for optional location fields', () => {
      const result = MovementMapper.fromDto(baseDto);
      expect(result.sourceWarehouseId).toBe('');
      expect(result.sourceWarehouseName).toBe('');
      expect(result.destinationWarehouseId).toBe('');
      expect(result.destinationLocationName).toBe('');
      expect(result.reference).toBe('');
      expect(result.notes).toBe('');
    });

    it('maps optional location fields when present', () => {
      const dto: MovementDto = {
        ...baseDto,
        sourceWarehouseId: 'wh-1',
        sourceWarehouseName: 'Almacén Norte',
        destinationWarehouseId: 'wh-2',
        destinationWarehouseName: 'Almacén Sur',
      };
      const result = MovementMapper.fromDto(dto);
      expect(result.sourceWarehouseName).toBe('Almacén Norte');
      expect(result.destinationWarehouseName).toBe('Almacén Sur');
    });

    it('sets typeLabel for each movement type', () => {
      const cases: Array<[MovementDto['type'], string]> = [
        ['ENTRY',          'Entrada'],
        ['EXIT',           'Salida'],
        ['TRANSFER',       'Transferencia'],
        ['ADJUSTMENT_IN',  'Ajuste entrada'],
        ['ADJUSTMENT_OUT', 'Ajuste salida'],
        ['RETURN',         'Devolución'],
      ];
      cases.forEach(([type, label]) => {
        const result = MovementMapper.fromDto({ ...baseDto, type });
        expect(result.typeLabel).toBe(label);
      });
    });

    it('sets statusLabel for each status', () => {
      expect(MovementMapper.fromDto({ ...baseDto, status: 'PENDING' }).statusLabel).toBe('Pendiente');
      expect(MovementMapper.fromDto({ ...baseDto, status: 'CONFIRMED' }).statusLabel).toBe('Confirmado');
      expect(MovementMapper.fromDto({ ...baseDto, status: 'CANCELLED' }).statusLabel).toBe('Cancelado');
    });

    it('sets isDestructive=true only for EXIT and ADJUSTMENT_OUT', () => {
      expect(MovementMapper.fromDto({ ...baseDto, type: 'EXIT' }).isDestructive).toBe(true);
      expect(MovementMapper.fromDto({ ...baseDto, type: 'ADJUSTMENT_OUT' }).isDestructive).toBe(true);
      expect(MovementMapper.fromDto({ ...baseDto, type: 'ENTRY' }).isDestructive).toBe(false);
      expect(MovementMapper.fromDto({ ...baseDto, type: 'TRANSFER' }).isDestructive).toBe(false);
      expect(MovementMapper.fromDto({ ...baseDto, type: 'ADJUSTMENT_IN' }).isDestructive).toBe(false);
      expect(MovementMapper.fromDto({ ...baseDto, type: 'RETURN' }).isDestructive).toBe(false);
    });

    it('sets directionIcon based on movement type', () => {
      expect(MovementMapper.fromDto({ ...baseDto, type: 'ENTRY' }).directionIcon).toBe('arrow_downward');
      expect(MovementMapper.fromDto({ ...baseDto, type: 'EXIT' }).directionIcon).toBe('arrow_upward');
      expect(MovementMapper.fromDto({ ...baseDto, type: 'TRANSFER' }).directionIcon).toBe('swap_horiz');
    });

    it('parses createdAt to Date object', () => {
      const result = MovementMapper.fromDto(baseDto);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.getFullYear()).toBe(2024);
    });

    it('sets confirmedAt to null when absent', () => {
      const result = MovementMapper.fromDto(baseDto);
      expect(result.confirmedAt).toBeNull();
    });

    it('parses confirmedAt when present', () => {
      const result = MovementMapper.fromDto({ ...baseDto, confirmedAt: '2024-01-15T12:00:00Z' });
      expect(result.confirmedAt).toBeInstanceOf(Date);
    });
  });

  describe('fromDtoList', () => {
    it('maps an array of DTOs', () => {
      const result = MovementMapper.fromDtoList([baseDto, { ...baseDto, id: 'mv-2' }]);
      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('mv-2');
    });

    it('returns empty array for empty input', () => {
      expect(MovementMapper.fromDtoList([])).toEqual([]);
    });
  });
});
