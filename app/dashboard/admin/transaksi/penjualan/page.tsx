"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Penjualan } from "@/app/types/penjualan";
import PenjualanTabel from "@/components/penjualan/PenjualanTabel";
import { DialogDetailPenjualan } from "@/components/penjualan/DialogDetailPenjualan";
import {
  getAllPenjualan,
  updatePenjualanStatus,
  cancelPenjualan,
} from "@/app/services/penjualan.service";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredData = useMemo(() => {
    return data
      .filter((p) => {
        const term = searchTerm.toLowerCase();
        if (term === "") return true;
        return (
          p.noInvoice?.toLowerCase().includes(term) ||
          p.namaPelanggan?.toLowerCase().includes(term)
        );
      })
      .filter((p) => {
        if (!startDate && !endDate) return true;
        const saleDate = new Date(p.tanggal);
        if (startDate && saleDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the whole day
          if (saleDate > end) return false;
        }
        return true;
      });
  }, [data, searchTerm, startDate, endDate]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

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

      <div className="flex items-center gap-4">
        <div className="w-1/3">
          <Label htmlFor="search">Cari (Invoice / Pelanggan)</Label>
          <Input
            id="search"
            placeholder="Ketik untuk mencari..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-1/4">
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-1/4">
          <Label htmlFor="endDate">Tanggal Akhir</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <PenjualanTabel
        data={paginatedData}
        isLoading={isLoading}
        error={error}
        onViewDetails={handleViewDetails}
        onUpdateStatus={handleUpdateStatus}
        onEdit={handleEdit}
        onCancel={handleCancel}
        updatingStatus={updatingStatus}
        cancelingTransaction={cancelingTransaction}
      />

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Sebelumnya
        </Button>
        <span className="text-sm">
          Halaman {currentPage} dari {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Berikutnya
        </Button>
      </div>

      <DialogDetailPenjualan
        open={dialogDetailOpen}
        onOpenChange={setDialogDetailOpen}
        penjualan={selectedPenjualan}
      />
    </div>
  );
}
