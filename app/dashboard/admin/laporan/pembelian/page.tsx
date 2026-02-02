"use client";

import { useEffect, useState } from "react";
import { Pembelian } from "@/app/types/pembelian";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/helper/format";
import { Download, Calendar, FileText } from "lucide-react";
import * as ExcelJS from "exceljs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PembelianReportPage() {
  const [data, setData] = useState<Pembelian[]>([]);
  const [filteredData, setFilteredData] = useState<Pembelian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    setIsLoading(true);
    let q = query(
      collection(db, "pembelian"),
      orderBy("tanggal", "desc"),
    );

    if (startDate) {
      q = query(q, where("tanggal", ">=", new Date(startDate).toISOString()));
    }
    if (endDate) {
      q = query(q, where("tanggal", "<=", new Date(endDate).toISOString()));
    }

    q = query(q, limit(perPage));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Pembelian,
        );
        setData(fetchedData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setFirstVisible(snapshot.docs[0]);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching purchases:", err);
        setError("Gagal memuat data pembelian.");
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [perPage, startDate, endDate]);

  const fetchNext = () => {
    setIsLoading(true);
    let q = query(
      collection(db, "pembelian"),
      orderBy("tanggal", "desc"),
      startAfter(lastVisible),
    );

    if (startDate) {
      q = query(q, where("tanggal", ">=", new Date(startDate).toISOString()));
    }
    if (endDate) {
      q = query(q, where("tanggal", "<=", new Date(endDate).toISOString()));
    }

    q = query(q, limit(perPage));

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
      setIsLoading(false);
    });
    return unsubscribe;
  };

  const fetchPrev = () => {
    setIsLoading(true);
    let q = query(
      collection(db, "pembelian"),
      orderBy("tanggal", "desc"),
      endBefore(firstVisible),
    );

    if (startDate) {
      q = query(q, where("tanggal", ">=", new Date(startDate).toISOString()));
    }
    if (endDate) {
      q = query(q, where("tanggal", "<=", new Date(endDate).toISOString()));
    }

    q = query(q, limitToLast(perPage));

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
      setIsLoading(false);
    });
    return unsubscribe;
  };

  const exportToPDF = async () => {
    const newTab = window.open("", "_blank");
    if (!newTab) {
      alert("Gagal membuka tab baru. Mohon izinkan pop-up untuk situs ini.");
      return;
    }
    newTab.document.write("Menghasilkan laporan PDF, mohon tunggu...");

    try {
      const response = await fetch("/api/generate-purchase-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      newTab.location.href = url;
    } catch (error) {
      console.error("Error exporting PDF:", error);
      if (newTab) {
        newTab.document.body.innerHTML = `<pre>Gagal membuat PDF. Silakan periksa konsol untuk detailnya.</pre>`;
      }
      alert("Gagal mengekspor laporan PDF. Silakan coba lagi.");
    }
  };

  const exportToExcel = async () => {
    // Excel export logic adapted for purchases
    // ...
  };

  const totalPurchases = data.length;
  const totalCost = data.reduce((sum, purchase) => sum + purchase.total, 0);
  const paidPurchases = data.filter(
    (purchase) => purchase.status === "Lunas",
  ).length;
  const unpaidPurchases = data.filter(
    (purchase) => purchase.status === "Belum Lunas",
  ).length;

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Memuat data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Pembelian</h1>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pembelian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pembelian Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidPurchases}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pembelian Belum Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {unpaidPurchases}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data pembelian untuk periode yang dipilih.
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>No. DO</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Produk Dibeli</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((purchase, index) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {new Date(purchase.tanggal).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {purchase.invoice || "-"}
                      </TableCell>
                      <TableCell>{purchase.noDO || "-"}</TableCell>
                      <TableCell>{purchase.namaSupplier}</TableCell>
                      <TableCell>
                        {purchase.items && purchase.items.length > 0 ? (
                          <ul className="list-disc pl-4 text-xs">
                            {purchase.items.map((item) => (
                              <li key={item.id}>
                                {item.namaProduk} ({item.qty} {item.satuan} x{" "}
                                {formatRupiah(item.harga)})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500">
                            Tidak ada item
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(purchase.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            purchase.status === "Lunas"
                              ? "bg-green-600"
                              : "bg-red-600"
                          }
                        >
                          {purchase.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-4">
        <Button onClick={fetchPrev} disabled={page === 1 || isLoading}>
          Previous
        </Button>
        <Button onClick={fetchNext} disabled={data.length < perPage || isLoading}>
          Next
        </Button>
      </div>
    </div>
  );
}
