export interface PembelianDetail {
  id?: string;
  pembelianId?: string;
  supplierProdukId: string;
  qty: number;
  harga: number;
  subtotal: number;
  namaProduk?: string; // Added for product name
  satuan?: string; // Added for product unit
}

export interface Pembelian {
  id?: string;
  supplierId: string;
  tanggal: string;
  noDO?: string;
  noNPB?: string;
  invoice?: string;
  total: number;
  status: string;
  createdAt?: Date | any;
  updatedAt?: Date | any;
  items?: PembelianDetail[]; // populated from pembelian_detail
  namaSupplier?: string; // Added for supplier name
}
