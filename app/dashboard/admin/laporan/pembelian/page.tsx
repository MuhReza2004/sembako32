"use client";

import { useEffect, useState } from "react";
import { Pembelian } from "@/app/types/pembelian";
import { getAllPembelian } from "@/app/services/pembelian.service";
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const purchases = await getAllPembelian();
        setData(purchases);
        setFilteredData(purchases);
      } catch (err: any) {
        console.error("Error fetching purchases:", err);
        setError("Gagal memuat data pembelian.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = data;
    if (startDate) {
      filtered = filtered.filter(
        (purchase) => new Date(purchase.tanggal) >= new Date(startDate),
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (purchase) => new Date(purchase.tanggal) <= new Date(endDate),
      );
    }
    setFilteredData(filtered);
  }, [data, startDate, endDate]);

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

  const totalPurchases = filteredData.length;
  const totalCost = filteredData.reduce(
    (sum, purchase) => sum + purchase.total,
    0,
  );
  const paidPurchases = filteredData.filter(
    (purchase) => purchase.status === "Lunas",
  ).length;
  const unpaidPurchases = filteredData.filter(
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
          {filteredData.length === 0 ? (
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
                  {filteredData.map((purchase, index) => (
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
    </div>
  );
}
