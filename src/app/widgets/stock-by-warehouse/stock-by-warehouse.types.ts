export interface StockByWarehouseEntry {
  warehouseId: string;
  warehouseName: string;
  locationId?: string;
  locationName?: string;
  quantity: number;
  unit: string;
  reserved: number;
  available: number;
  productId: string;
  productName: string;
  productSku: string;
}
