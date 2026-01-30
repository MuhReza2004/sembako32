"use client";

import { useEffect, useState, useCallback } from "react";
import { Penjualan } from "@/app/types/penjualan";
import { getPiutang } from "@/app/services/penjualan.service"; // Will be created
import PiutangTable from "../../../../../components/Piutang/PiutangTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Komponen untuk menampilkan halaman daftar piutang

export default function PiutangPage() {
  const [piutang, setPiutang] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPiutang = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPiutang();
      setPiutang(data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data piutang.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPiutang();
  }, [fetchPiutang]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Daftar Piutang</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Piutang Usaha</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Memuat data...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <PiutangTable piutang={piutang} onPaymentSuccess={fetchPiutang} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
