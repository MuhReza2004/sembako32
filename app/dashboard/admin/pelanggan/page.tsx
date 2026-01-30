"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogTambahPelanggan } from "@/components/pelanggan/DialogTambahPelanggan";
import { DialogEditPelanggan } from "@/components/pelanggan/DialogEditPelanggan";
import { DialogHapusPelanggan } from "@/components/pelanggan/DialogHapusPelanggan";
import { TabelPelanggan } from "@/components/pelanggan/TabelPelanggan";
import { Pelanggan, PelangganFormData } from "@/app/types/pelanggan";
import { Plus, Search } from "lucide-react";
import {
  addpelanggan,
  deletePelanggan,
  updatePelanggan,
} from "@/app/services/pelanggan.service";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export default function PelangganAdminPage() {
  const [customers, setCustomers] = useState<Pelanggan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogTambahOpen, setDialogTambahOpen] = useState(false);
  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [dialogHapusOpen, setDialogHapusOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Pelanggan | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");

  // Load pelanggan in real-time
  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, "pelanggan"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Pelanggan,
        );
        setCustomers(data);
        setIsLoading(false);
      },
      (err) => {
        setError("Gagal memuat data pelanggan");
        console.error("Error fetching customers:", err);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const checkDuplicateNIB = (nib: string) => {
    return customers.find((c) => c.nib === nib);
  };

  const handleTambahSubmit = async (data: PelangganFormData) => {
    const duplicateNIB = checkDuplicateNIB(data.nib);
    if (duplicateNIB) {
      setError(`NIB sudah terdaftar atas nama: ${duplicateNIB.namaToko}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await addpelanggan(data);
      showSuccess("Pelanggan berhasil ditambahkan");
      setDialogTambahOpen(false);
      setError(null);
    } catch (err) {
      setError("Gagal menambah pelanggan");
      console.error("Error adding customer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (data: PelangganFormData) => {
    if (!selectedCustomer || !selectedCustomer.id) return;

    // A new object is created with only the properties of `PelangganFormData`
    const cleanData: Partial<PelangganFormData> = {
      namaPelanggan: data.namaPelanggan,
      kodePelanggan: data.kodePelanggan,
      namaToko: data.namaToko,
      nib: data.nib,
      alamat: data.alamat,
      noTelp: data.noTelp,
      email: data.email,
      status: data.status,
    };

    try {
      setIsSubmitting(true);
      await updatePelanggan(selectedCustomer.id, cleanData);
      showSuccess("Pelanggan berhasil diperbarui");
      setDialogEditOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      setError("Gagal memperbarui pelanggan");
      console.error("Error updating customer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (customer: Pelanggan) => {
    setSelectedCustomer(customer);
    setDialogEditOpen(true);
  };

  const handleDeleteClick = (customer: Pelanggan) => {
    setSelectedCustomer(customer);
    setDialogHapusOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer || !selectedCustomer.id) return;

    try {
      setIsSubmitting(true);
      await deletePelanggan(selectedCustomer.id);
      showSuccess("Pelanggan berhasil dihapus");
      setDialogHapusOpen(false);
      setSelectedCustomer(null);
    } catch (err) {
      setError("Gagal menghapus pelanggan");
      console.error("Error deleting customer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Manajemen Pelanggan
        </h1>
        <p className="mt-2 text-gray-600">
          Kelola daftar pelanggan dan informasi kontak mereka
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari ID, kode, nama, atau nomor telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setDialogTambahOpen(true);
            }}
            variant={"primary"}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pelanggan
          </Button>
        </div>
      </div>

      <TabelPelanggan
        customers={customers}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        searchTerm={searchTerm}
      />

      <DialogTambahPelanggan
        open={dialogTambahOpen}
        onOpenChange={setDialogTambahOpen}
        onSubmit={handleTambahSubmit}
        isLoading={isSubmitting}
      />

      <DialogEditPelanggan
        open={dialogEditOpen}
        onOpenChange={setDialogEditOpen}
        onSubmit={handleEditSubmit}
        pelanggan={selectedCustomer}
        isLoading={isSubmitting}
      />

      <DialogHapusPelanggan
        open={dialogHapusOpen}
        onOpenChange={setDialogHapusOpen}
        onConfirm={handleDeleteConfirm}
        pelanggan={selectedCustomer}
        isLoading={isSubmitting}
      />
    </div>
  );
}
