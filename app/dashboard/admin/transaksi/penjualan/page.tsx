"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Penjualan } from "@/app/types/penjualan";
import PenjualanForm from "@/components/penjualan/PenjualanForm";
import PenjualanTabel from "@/components/penjualan/PenjualanTabel";
import { DialogDetailPenjualan } from "@/components/penjualan/DialogDetailPenjualan";
import {
  getAllPenjualan,
  updatePenjualanStatus,
  deletePenjualan,
  cancelPenjualan,
} from "@/app/services/penjualan.service";
import { getPelangganById } from "@/app/services/pelanggan.service";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PenjualanPage() {
  const router = useRouter();
  const [data, setData] = useState<Penjualan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogDetailOpen, setDialogDetailOpen] = useState(false);
  const [selectedPenjualan, setSelectedPenjualan] = useState<Penjualan | null>(
    null,
  );
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [cancelingTransaction, setCancelingTransaction] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const sales = await getAllPenjualan();
        setData(sales);
      } catch (err: any) {
        console.error("Error fetching sales:", err);
        setError("Gagal memuat data penjualan.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewDetails = (penjualan: Penjualan) => {
    setSelectedPenjualan(penjualan);
    setDialogDetailOpen(true);
  };

  const handleUpdateStatus = async (
    id: string,
    status: "Lunas" | "Belum Lunas",
  ) => {
    setUpdatingStatus(id);
    try {
      await updatePenjualanStatus(id, status);
      // Refresh data to reflect the updated status
      const updatedSales = await getAllPenjualan();
      setData(updatedSales);
      alert(`Status penjualan berhasil diubah menjadi ${status}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Gagal mengubah status penjualan.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEdit = (penjualan: Penjualan) => {
    router.push(
      `/dashboard/admin/transaksi/penjualan/tambah?id=${penjualan.id}`,
    );
  };

  const handleCancel = async (id: string) => {
    if (
      confirm(
        "Apakah Anda yakin ingin membatalkan transaksi ini? Status akan diubah menjadi 'Batal' dan stok produk akan dikembalikan.",
      )
    ) {
      setCancelingTransaction(id);
      try {
        await cancelPenjualan(id);
        // Refresh data to reflect the updated status
        const updatedSales = await getAllPenjualan();
        setData(updatedSales);
        alert(
          "Transaksi berhasil dibatalkan. Status diubah menjadi 'Batal' dan stok telah dikembalikan.",
        );
      } catch (error) {
        console.error("Error canceling transaction:", error);
        alert("Gagal membatalkan transaksi.");
      } finally {
        setCancelingTransaction(null);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Transaksi Penjualan
        </h1>
        <Button
          onClick={() =>
            router.push("/dashboard/admin/transaksi/penjualan/tambah")
          }
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Penjualan
        </Button>
      </div>

      <PenjualanTabel
        data={data}
        isLoading={isLoading}
        error={error}
        onViewDetails={handleViewDetails}
        onUpdateStatus={handleUpdateStatus}
        onEdit={handleEdit}
        onCancel={handleCancel}
        updatingStatus={updatingStatus}
        cancelingTransaction={cancelingTransaction}
      />
      <DialogDetailPenjualan
        open={dialogDetailOpen}
        onOpenChange={setDialogDetailOpen}
        penjualan={selectedPenjualan}
      />
    </div>
  );
}
