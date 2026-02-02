"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
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
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPembelian, setTotalPembelian] = useState(0); // To store total count for pagination info

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "pembelian"),
      orderBy("tanggal", "desc"),
      limit(perPage),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Pembelian,
        );
        setData(fetchedData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching pembelian:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [perPage]);

  const fetchNext = () => {
    setLoading(true);
    const q = query(
      collection(db, "pembelian"),
      orderBy("tanggal", "desc"),
      startAfter(lastVisible),
      limit(perPage),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Pembelian,
        );
        setData(fetchedData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setPage(page + 1);
      }
      setLoading(false);
    });
    return unsubscribe;
  };

  const fetchPrev = () => {
    setLoading(true);
    const q = query(
      collection(db, "pembelian"),
      orderBy("tanggal", "desc"),
      endBefore(firstVisible),
      limitToLast(perPage),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Pembelian,
        );
        setData(fetchedData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setPage(page - 1);
      }
      setLoading(false);
    });
    return unsubscribe;
  };

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

      <div className="flex justify-end gap-4 mt-4">
        <Button onClick={fetchPrev} disabled={page === 1 || loading}>
          Previous
        </Button>
        <Button onClick={fetchNext} disabled={data.length < perPage || loading}>
          Next
        </Button>
      </div>
    </div>
  );
}
