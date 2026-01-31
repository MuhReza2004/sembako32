"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAllPembelian } from "@/app/services/pembelian.service";
import { Pembelian } from "@/app/types/pembelian";
import PembelianTable from "@/components/pembelian/pembelianTabel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PagePembelian() {
  const [data, setData] = useState<Pembelian[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllPembelian();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaksi Pembelian</h1>
          <p className="text-muted-foreground mt-1">
            Kelola transaksi pembelian dari supplier
          </p>
        </div>
        <Button
          onClick={() =>
            router.push("/dashboard/admin/transaksi/pembelian/tambah")
          }
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pembelian
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-1/3">
          <Label htmlFor="search">Cari (Invoice / Supplier)</Label>
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data pembelian...</p>
          </div>
        </div>
      ) : (
        <PembelianTable
          data={data}
          searchTerm={searchTerm}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}
