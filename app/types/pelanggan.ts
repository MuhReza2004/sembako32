export interface PelangganFormData {
  namaPelanggan: string;
  kodePelanggan: string;
  namaToko: string;
  nib: string;
  alamat: string;
  noTelp: string;
  email?: string;
  status: "aktif" | "nonaktif";
}

export interface Pelanggan {
  id?: string;
  idPelanggan: string; // The auto-generated PLG-xxxxx
  kodePelanggan: string;
  namaPelanggan: string;
  namaToko: string;
  nib: string;
  alamat: string;
  noTelp: string;
  email?: string;
  status: "aktif" | "nonaktif";
  createdAt?: Date;
  updatedAt?: Date;
}