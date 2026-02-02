"use client";

import { useEffect, useState, useCallback } from "react";
import { Penjualan } from "@/app/types/penjualan";
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
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import PiutangTable from "../../../../../components/Piutang/PiutangTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Komponen untuk menampilkan halaman daftar piutang

export default function PiutangPage() {
  const [piutang, setPiutang] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "penjualan"),
      where("status", "==", "Belum Lunas"),
      orderBy("tanggal", "desc"),
      limit(perPage),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Penjualan,
        );
        setPiutang(data);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setLoading(false);
      },
      (err) => {
        setError("Gagal memuat data piutang.");
        console.error("Error fetching piutang:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [perPage]);

  const fetchNext = () => {
    setLoading(true);
    const q = query(
      collection(db, "penjualan"),
      where("status", "==", "Belum Lunas"),
      orderBy("tanggal", "desc"),
      startAfter(lastVisible),
      limit(perPage),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Penjualan,
        );
        setPiutang(data);
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
      collection(db, "penjualan"),
      where("status", "==", "Belum Lunas"),
      orderBy("tanggal", "desc"),
      endBefore(firstVisible),
      limitToLast(perPage),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Penjualan,
        );
        setPiutang(data);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setPage(page - 1);
      }
      setLoading(false);
    });
    return unsubscribe;
  };

  const refreshPiutang = () => {
    setLoading(true);
    let q = query(
      collection(db, "penjualan"),
      where("status", "==", "Belum Lunas"),
      orderBy("tanggal", "desc"),
    );

    // If we are not on the first page, we need to re-query with startAt(firstVisible)
    // to get the current page content again.
    if (firstVisible && page > 1) {
      q = query(q, startAt(firstVisible));
    }

    q = query(q, limit(perPage));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Penjualan,
        );
        setPiutang(data);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
      }
      setLoading(false);
    });
    return unsubscribe;
  };

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
            <PiutangTable piutang={piutang} onPaymentSuccess={refreshPiutang} />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-4">
        <Button onClick={fetchPrev} disabled={page === 1 || loading}>
          Previous
        </Button>
        <Button onClick={fetchNext} disabled={piutang.length < perPage || loading}>
          Next
        </Button>
      </div>
    </div>
  );
}
