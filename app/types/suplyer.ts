import { Timestamp } from "firebase/firestore";

export interface SupplierFormData {
  kode: string;
  nama: string;
  alamat: string;
  telp: string;
  status: boolean;
}

export interface Supplier extends SupplierFormData {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupplierProduk {
  id: string;
  supplierId: string;
  produkId: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  createdAt: Timestamp;
}

export interface SupplierProdukFormData {
  supplierId: string;
  produkId: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
}
