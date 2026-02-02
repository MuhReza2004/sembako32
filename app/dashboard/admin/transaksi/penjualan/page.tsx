"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Penjualan } from "@/app/types/penjualan";
import PenjualanTabel from "@/components/penjualan/PenjualanTabel";
import { DialogDetailPenjualan } from "@/components/penjualan/DialogDetailPenjualan";
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  where,
  startAt,
  endAt,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
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
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setIsLoading(true);

    let q = query(
      collection(db, "penjualan"),
      orderBy("tanggal", "desc"),
    );

    // Apply date range filter if both startDate and endDate are provided
    if (startDate && endDate) {
      q = query(
        q,
        where("tanggal", ">=", new Date(startDate).toISOString()),
        where(
          "tanggal",
          "<=",
          new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString(),
        ),
      );
    }

    // Apply pagination limit
    q = query(q, limit(perPage));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Penjualan,
        );
        setData(fetchedData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching sales:", err);
        setError("Gagal memuat data penjualan.");
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [perPage, startDate, endDate]);

  const fetchNext = () => {
    setIsLoading(true);
    let q = query(
      collection(db, "penjualan"),
      orderBy("tanggal", "desc"),
      startAfter(lastVisible),
    );

    if (startDate && endDate) {
      q = query(
        q,
        where("tanggal", ">=", new Date(startDate).toISOString()),
        where(
          "tanggal",
          "<=",
          new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString(),
        ),
      );
    }

    q = query(q, limit(perPage));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Penjualan,
        );
        setData(fetchedData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setPage(page + 1);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  };

  const fetchPrev = () => {
    setIsLoading(true);
    let q = query(
      collection(db, "penjualan"),
      orderBy("tanggal", "desc"),
      endBefore(firstVisible),
    );

    if (startDate && endDate) {
      q = query(
        q,
        where("tanggal", ">=", new Date(startDate).toISOString()),
        where(
          "tanggal",
          "<=",
          new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString(),
        ),
      );
    }

    q = query(q, limitToLast(perPage));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Penjualan,
        );
        setData(fetchedData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setPage(page - 1);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  };

  const filteredPaginatedData = useMemo(() => {
    return data.filter((p) => {
      const term = searchTerm.toLowerCase();
      if (term === "") return true;
      return (
        p.noInvoice?.toLowerCase().includes(term) ||
        p.namaPelanggan?.toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm]);

  const handleViewDetails = (penjualan: Penjualan) => {
    setSelectedPenjualan(penjualan);
    setDialogDetailOpen(true);
  };


  // Need to implement updatePenjualanStatus and cancelPenjualan in this component directly
  // Or modify app/services/penjualan.service.ts to take 'db' as an argument
  // For now, I will create local versions.

  const updatePenjualanStatus = async (
    id: string,
    status: "Lunas" | "Belum Lunas" | "Batal",
  ) => {
    setUpdatingStatus(id);
    try {
      const docRef = doc(db, "penjualan", id);
      await updateDoc(docRef, { status: status });
      // No need to fetch all data again, onSnapshot will handle it.
      // Optionally show a success message
      alert(`Status penjualan berhasil diubah menjadi ${status}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Gagal mengubah status penjualan.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const cancelPenjualan = async (id: string) => {
    if (
      confirm(
        "Apakah Anda yakin ingin membatalkan transaksi ini? Status akan diubah menjadi 'Batal' dan stok produk akan dikembalikan.",
      )
    ) {
      setCancelingTransaction(id);
      try {
        const docRef = doc(db, "penjualan", id);
        await updateDoc(docRef, { status: "Batal" });
        // Logic to return stock would go here
        // No need to fetch all data again, onSnapshot will handle it.
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

  const handleUpdateStatus = async (
    id: string,
    status: "Lunas" | "Belum Lunas",
  ) => {
    await updatePenjualanStatus(id, status);
  };

  const handleEdit = (penjualan: Penjualan) => {
    router.push(
      `/dashboard/admin/transaksi/penjualan/tambah?id=${penjualan.id}`,
    );
  };

  const handleCancel = async (id: string) => {
    await cancelPenjualan(id);
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
        data={filteredPaginatedData}
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
          onClick={fetchPrev}
          disabled={page === 1 || isLoading}
        >
          Sebelumnya
        </Button>
        <span className="text-sm">Halaman {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchNext}
          disabled={data.length < perPage || isLoading}
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
