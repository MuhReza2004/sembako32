"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogTambahProduk } from "@/components/produk/DialogTambahProduk";
import { DialogEditProduk } from "@/components/produk/DialogEditProduk";
import { DialogHapusProduk } from "@/components/produk/DialogHapusProduk";

import { TabelProdukNew } from "@/components/produk/TabelProduk";
import {
  addProduk,
  updateProduk,
  deleteProduk,
} from "@/app/services/produk.service";
import { Produk, ProdukFormData } from "@/app/types/produk";
import { Plus, Search } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export default function ProdukAdminPage() {
  const [products, setProducts] = useState<Produk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [dialogTambahOpen, setDialogTambahOpen] = useState(false);
  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [dialogHapusOpen, setDialogHapusOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produk | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");

  // Load produk in real-time
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "produk"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Produk[];
        setProducts(data);
        setIsLoading(false);
      },
      (err) => {
        setError("Gagal memuat data produk");
        console.error("Error fetching products:", err);
        setIsLoading(false);
      },
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show success message
  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Cek apakah produk dengan nama yang sama sudah ada
  const checkDuplicateProduct = (nama: string) => {
    if (!nama) return undefined;
    return products.find(
      (p) =>
        p.nama &&
        typeof p.nama === "string" &&
        p.nama.toLowerCase().trim() === nama.toLowerCase().trim(),
    );
  };

  // Handle tambah produk dengan validasi duplikasi
  const handleTambahSubmit = async (data: ProdukFormData) => {
    const duplicate = checkDuplicateProduct(data.nama);
    if (duplicate) {
      setError("Produk dengan nama yang sama sudah terdaftar");
      return;
    }

    try {
      setIsSubmitting(true);
      await addProduk(data);
      showSuccess("Produk berhasil ditambahkan");
      setDialogTambahOpen(false);
    } catch (err) {
      setError("Gagal menambah produk");
      console.error("Error adding product:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit produk
  const handleEditSubmit = async (data: ProdukFormData) => {
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      await updateProduk(selectedProduct.id, data);
      showSuccess("Produk berhasil diupdate");
      setDialogEditOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      setError("Gagal mengupdate produk");
      console.error("Error updating product:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit produk (button click)
  const handleEditClick = (product: Produk) => {
    setSelectedProduct(product);
    setDialogEditOpen(true);
  };

  // Handle delete produk
  const handleDeleteClick = (product: Produk) => {
    setSelectedProduct(product);
    setDialogHapusOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      await deleteProduk(selectedProduct.id);
      showSuccess("Produk berhasil dihapus");
      setDialogHapusOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      setError("Gagal menghapus produk");
      console.error("Error deleting product:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Produk</h1>
        <p className="mt-2 text-gray-600">
          Kelola produk, harga, stok, dan status di sini
        </p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Search & Button Bar */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <div className="flex gap-4 items-end">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari ID, kode, atau nama produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tombol Tambah */}
          <Button
            onClick={() => {
              setSelectedProduct(null);
              setDialogTambahOpen(true);
            }}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <TabelProdukNew
        products={products}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        searchTerm={searchTerm}
      />

      {/* Dialog Tambah */}
      <DialogTambahProduk
        open={dialogTambahOpen}
        onOpenChange={setDialogTambahOpen}
        onSubmit={handleTambahSubmit}
        isLoading={isSubmitting}
      />

      {/* Dialog Edit */}
      <DialogEditProduk
        open={dialogEditOpen}
        onOpenChange={setDialogEditOpen}
        onSubmit={handleEditSubmit}
        produk={selectedProduct}
        isLoading={isSubmitting}
      />

      {/* Dialog Hapus */}
      <DialogHapusProduk
        open={dialogHapusOpen}
        onOpenChange={setDialogHapusOpen}
        onConfirm={handleDeleteConfirm}
        produk={selectedProduct}
        isLoading={isSubmitting}
      />
    </div>
  );
}
