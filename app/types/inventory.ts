import { Produk } from "./produk";

export interface InventoryData extends Produk {
  totalMasuk: number;
  totalKeluar: number;
}

export interface StockAdjustment {
  id: string;
  produkId: string;
  adjustmentType: "increase" | "decrease";
  quantity: number;
  reason: string;
  createdAt: Date;
  createdBy: string;
}

export interface LowStockAlert {
  produkId: string;
  nama: string;
  currentStock: number;
  minStock: number;
}
