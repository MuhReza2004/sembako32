export interface PenjualanDetail {
  id?: string;
  penjualanId?: string;
  supplierProdukId: string;
  qty: number;
  harga: number;
  subtotal: number;
  // Additional fields for display
  namaProduk?: string;
  satuan?: string;
  hargaJual?: number;
}

export interface RiwayatPembayaran {
  tanggal: string;
  jumlah: number;
  metodePembayaran: string;
  atasNama: string;
  createdAt: Date | any;
}

export interface Penjualan {
  id?: string;
  tanggal: string;
  pelangganId: string;
  catatan?: string;
  noInvoice: string;
  noSuratJalan: string;
  total: number;
  totalDibayar?: number; // Total amount paid
  status: "Lunas" | "Belum Lunas";
  riwayatPembayaran?: RiwayatPembayaran[]; // Payment history
  createdAt?: Date | any;
  updatedAt?: Date | any;
  items?: PenjualanDetail[]; // populated from penjualan_detail

  // Additional fields for detailed view
  nomorInvoice?: string; // alias for noInvoice
  namaPelanggan?: string;
  alamatPelanggan?: string;
  metodePembayaran?: string;
  nomorRekening?: string;
  namaBank?: string;
  namaPemilikRekening?: string;
  tanggalJatuhTempo?: string;
  diskon?: number;
  pajakEnabled?: boolean;
  pajak?: number;
  totalAkhir?: number;
}
