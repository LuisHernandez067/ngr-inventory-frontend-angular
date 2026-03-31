import { CountReconciliationTableComponent } from './count-reconciliation-table.component';
import type { PhysicalCountItem } from '../../entities/count/count.types';

const makeItem = (overrides: Partial<PhysicalCountItem> = {}): PhysicalCountItem => ({
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
  statusLabel: 'Diferencia',
  hasDiscrepancy: true,
  ...overrides,
});

describe('CountReconciliationTableComponent', () => {
  let component: CountReconciliationTableComponent;

  beforeEach(() => {
    component = new CountReconciliationTableComponent();
  });

  it('should have empty items by default', () => {
    expect(component.items).toEqual([]);
  });

  it('should have loading=false by default', () => {
    expect(component.loading).toBe(false);
  });

  it('should have editable=true by default', () => {
    expect(component.editable).toBe(true);
  });

  it('should display all defined columns', () => {
    expect(component.displayedColumns).toContain('productCode');
    expect(component.displayedColumns).toContain('productName');
    expect(component.displayedColumns).toContain('locationCode');
    expect(component.displayedColumns).toContain('theoreticalQty');
    expect(component.displayedColumns).toContain('countedQty');
    expect(component.displayedColumns).toContain('difference');
    expect(component.displayedColumns).toContain('status');
  });

  it('differenceClass returns "diff-negative" for negative values', () => {
    expect(component.differenceClass(-5)).toBe('diff-negative');
  });

  it('differenceClass returns "diff-positive" for positive values', () => {
    expect(component.differenceClass(3)).toBe('diff-positive');
  });

  it('differenceClass returns "neutral" for zero', () => {
    expect(component.differenceClass(0)).toBe('neutral');
  });

  it('should emit itemUpdated when onBlur is called with valid number input', () => {
    component.items = [makeItem()];

    const emitted: Array<{ itemId: string; countedQty: number }> = [];
    component.itemUpdated.subscribe((val: { itemId: string; countedQty: number }) => emitted.push(val));

    const mockInput = { value: '90' } as HTMLInputElement;
    const mockEvent = { target: mockInput } as unknown as Event;

    component.onBlur(makeItem(), mockEvent);

    expect(emitted.length).toBe(1);
    expect(emitted[0].itemId).toBe('item-1');
    expect(emitted[0].countedQty).toBe(90);
  });

  it('should not emit itemUpdated when input value is NaN', () => {
    const emitted: Array<{ itemId: string; countedQty: number }> = [];
    component.itemUpdated.subscribe((val: { itemId: string; countedQty: number }) => emitted.push(val));

    const mockInput = { value: 'abc' } as HTMLInputElement;
    const mockEvent = { target: mockInput } as unknown as Event;

    component.onBlur(makeItem(), mockEvent);

    expect(emitted.length).toBe(0);
  });

  it('should accept items input', () => {
    const items = [makeItem(), makeItem({ id: 'item-2' })];
    component.items = items;
    expect(component.items.length).toBe(2);
  });
});
