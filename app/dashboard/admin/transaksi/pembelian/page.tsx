"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAllPembelian } from "@/app/services/pembelian.service";
import { Pembelian } from "@/app/types/pembelian";
import PembelianTable from "@/components/pembelian/pembelianTabel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PagePembelian() {
  const [data, setData] = useState<Pembelian[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data pembelian...</p>
          </div>
        </div>
      ) : (
        <PembelianTable data={data} />
      )}
    </div>
  );
}
