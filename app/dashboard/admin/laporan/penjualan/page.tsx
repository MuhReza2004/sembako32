"use client";

import { useEffect, useState } from "react";
import { Penjualan } from "@/app/types/penjualan";
import { getAllPenjualan } from "@/app/services/penjualan.service";
import { DialogDetailPenjualan } from "@/components/penjualan/DialogDetailPenjualan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/helper/format";
import { Download, Eye, Calendar, FileText } from "lucide-react";
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

export default function PenjualanReportPage() {
  const [data, setData] = useState<Penjualan[]>([]);
  const [filteredData, setFilteredData] = useState<Penjualan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogDetailOpen, setDialogDetailOpen] = useState(false);
  const [selectedPenjualan, setSelectedPenjualan] = useState<Penjualan | null>(
    null,
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const sales = await getAllPenjualan();
        setData(sales);
        setFilteredData(sales);
      } catch (err: any) {
        console.error("Error fetching sales:", err);
        setError("Gagal memuat data penjualan.");
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
        (sale) => new Date(sale.tanggal) >= new Date(startDate),
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (sale) => new Date(sale.tanggal) <= new Date(endDate),
      );
    }

    setFilteredData(filtered);
  }, [data, startDate, endDate]);

  const handleViewDetails = (penjualan: Penjualan) => {
    setSelectedPenjualan(penjualan);
    setDialogDetailOpen(true);
  };

  const exportToPDF = async () => {
    // Open a new tab immediately and show a loading message.
    const newTab = window.open("", "_blank");
    if (!newTab) {
      alert("Gagal membuka tab baru. Mohon izinkan pop-up untuk situs ini.");
      return;
    }
    newTab.document.write("Menghasilkan laporan PDF, mohon tunggu...");

    try {
      const response = await fetch("/api/generate-sales-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Load the PDF into the already-opened tab.
      newTab.location.href = url;
    } catch (error) {
      console.error("Error exporting PDF:", error);
      // If an error occurs, show it in the new tab and alert the user.
      if (newTab) {
        newTab.document.body.innerHTML = `<pre>Gagal membuat PDF. Silakan periksa konsol untuk detailnya.</pre>`;
      }
      alert("Gagal mengekspor laporan PDF. Silakan coba lagi.");
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Penjualan");

      // Set column widths
      worksheet.columns = [
        { width: 5 }, // No
        { width: 18 }, // Invoice
        { width: 18 }, // Surat Jalan
        { width: 15 }, // Tanggal
        { width: 25 }, // Pelanggan
        { width: 35 }, // Alamat
        { width: 45 }, // Produk Dibeli
        { width: 18 }, // Total
        { width: 15 }, // Status
      ];

      // Add title
      worksheet.mergeCells("A1:I1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "LAPORAN PENJUALAN";
      titleCell.font = { size: 18, bold: true, color: { argb: "FF1F2937" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
      worksheet.getRow(1).height = 30;

      // Add period info
      worksheet.mergeCells("A2:I2");
      const periodText =
        startDate && endDate
          ? `Periode: ${new Date(startDate).toLocaleDateString("id-ID")} - ${new Date(endDate).toLocaleDateString("id-ID")}`
          : startDate
            ? `Dari: ${new Date(startDate).toLocaleDateString("id-ID")}`
            : endDate
              ? `Sampai: ${new Date(endDate).toLocaleDateString("id-ID")}`
              : "Semua Periode";
      const periodCell = worksheet.getCell("A2");
      periodCell.value = periodText;
      periodCell.font = { size: 11, italic: true };
      periodCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(2).height = 20;

      // Add spacing
      worksheet.getRow(3).height = 5;

      // Add summary section with better styling
      const summaryStartRow = 4;

      // Summary title
      worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);
      const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
      summaryTitleCell.value = "RINGKASAN";
      summaryTitleCell.font = {
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      summaryTitleCell.alignment = { horizontal: "center", vertical: "middle" };
      summaryTitleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3B82F6" },
      };
      summaryTitleCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      worksheet.getRow(summaryStartRow).height = 25;

      // Summary data
      const summaryData = [
        { label: "Total Penjualan", value: totalSales, format: "number" },
        { label: "Total Pendapatan", value: totalRevenue, format: "currency" },
        { label: "Penjualan Lunas", value: paidSales, format: "number" },
        {
          label: "Penjualan Belum Lunas",
          value: unpaidSales,
          format: "number",
        },
      ];

      summaryData.forEach((item, index) => {
        const rowNum = summaryStartRow + 1 + index;
        const labelCell = worksheet.getCell(`A${rowNum}`);
        const valueCell = worksheet.getCell(`B${rowNum}`);

        labelCell.value = item.label;
        labelCell.font = { bold: true, size: 11 };
        labelCell.alignment = { horizontal: "left", vertical: "middle" };
        labelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        };
        labelCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (item.format === "currency") {
          valueCell.value = item.value;
          valueCell.numFmt = '"Rp" #,##0';
        } else {
          valueCell.value = item.value;
        }
        valueCell.font = { size: 11 };
        valueCell.alignment = { horizontal: "right", vertical: "middle" };
        valueCell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        worksheet.getRow(rowNum).height = 20;
      });

      // Add spacing
      const dataStartRow = summaryStartRow + summaryData.length + 2;
      worksheet.getRow(dataStartRow - 1).height = 5;

      // Add headers
      const headers = [
        "No",
        "Invoice",
        "Surat Jalan",
        "Tanggal",
        "Pelanggan",
        "Alamat",
        "Produk Dibeli",
        "Total",
        "Status",
      ];

      const headerRow = worksheet.getRow(dataStartRow);
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F2937" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      headerRow.height = 25;

      // Add data with alternating row colors
      filteredData.forEach((penjualan, index) => {
        const produkDibeli =
          penjualan.items && penjualan.items.length > 0
            ? penjualan.items
                .map(
                  (item) =>
                    `${item.namaProduk} (${item.qty} x ${formatRupiah(item.hargaJual || 0)})`,
                )
                .join("\n")
            : "Tidak ada item";

        const rowData = [
          index + 1,
          penjualan.noInvoice,
          penjualan.noSuratJalan,
          new Date(penjualan.tanggal).toLocaleDateString("id-ID"),
          penjualan.namaPelanggan || "Pelanggan Tidak Diketahui",
          penjualan.alamatPelanggan || "-",
          produkDibeli,
          penjualan.total,
          penjualan.status,
        ];

        const row = worksheet.addRow(rowData);
        row.height = 30;

        // Apply alternating row colors
        const fillColor = index % 2 === 0 ? "FFFFFFFF" : "FFF9FAFB";

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // Alignment
          if (colNumber === 1 || colNumber === 8 || colNumber === 9) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          } else if (colNumber === 7) {
            cell.alignment = {
              horizontal: "left",
              vertical: "top",
              wrapText: true,
            };
          } else {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          }

          // Fill color
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: fillColor },
          };

          // Border
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };

          // Font
          cell.font = { size: 10 };

          // Format currency
          if (colNumber === 8) {
            cell.numFmt = '"Rp" #,##0';
          }

          // Status styling
          if (colNumber === 9) {
            cell.font = { bold: true, size: 10 };
            if (cell.value === "Lunas") {
              cell.font = { ...cell.font, color: { argb: "FF16A34A" } };
            } else if (cell.value === "Belum Lunas") {
              cell.font = { ...cell.font, color: { argb: "FFDC2626" } };
            }
          }
        });
      });

      // Add footer
      const lastRow = worksheet.rowCount + 2;
      worksheet.mergeCells(`A${lastRow}:I${lastRow}`);
      const footerCell = worksheet.getCell(`A${lastRow}`);
      footerCell.value = `Dicetak pada: ${new Date().toLocaleString("id-ID")}`;
      footerCell.font = { size: 9, italic: true, color: { argb: "FF6B7280" } };
      footerCell.alignment = { horizontal: "center", vertical: "middle" };

      // Set print options
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3,
        },
      };

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan_penjualan_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Gagal mengekspor laporan Excel. Silakan coba lagi.");
    }
  };

  const totalSales = filteredData.length;
  const totalRevenue = filteredData.reduce((sum, sale) => sum + sale.total, 0);
  const totalPajak = filteredData.reduce(
    (sum, sale) => sum + (sale.pajak || 0),
    0,
  );
  const penjualanBersih = totalRevenue - totalPajak;
  const paidSales = filteredData.filter(
    (sale) => sale.status === "Lunas",
  ).length;
  const unpaidSales = filteredData.filter(
    (sale) => sale.status === "Belum Lunas",
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Memuat data laporan penjualan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pendapatan (Bruto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pajak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalPajak)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Penjualan Bersih (Netto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(penjualanBersih)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Penjualan Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Penjualan Belum Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unpaidSales}</div>
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

      {/* Sales Table */}
      <Card>
        <CardHeader className="flex flex-row justify-between ">
          <CardTitle>Detail Penjualan</CardTitle>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data penjualan untuk periode yang dipilih.
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto print:overflow-visible">
              <Table className="print:text-sm print:border-collapse">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Invoice</TableHead>
                    <TableHead>Surat Jalan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Produk Dibeli</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((penjualan) => (
                    <TableRow key={penjualan.id}>
                      <TableCell className="font-medium">
                        {penjualan.noInvoice}
                      </TableCell>
                      <TableCell className="font-medium">
                        {penjualan.noSuratJalan}
                      </TableCell>
                      <TableCell>
                        {new Date(penjualan.tanggal).toLocaleDateString(
                          "id-ID",
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {penjualan.namaPelanggan ||
                            "Pelanggan Tidak Diketahui"}
                        </p>
                        {penjualan.alamatPelanggan && (
                          <p className="text-sm text-gray-500">
                            {penjualan.alamatPelanggan}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {penjualan.items && penjualan.items.length > 0 ? (
                          <ul className="list-disc pl-4 text-xs">
                            {penjualan.items.map((item) => (
                              <li key={item.id}>
                                {item.namaProduk} ({item.qty} x{" "}
                                {formatRupiah(item.hargaJual || 0)})
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
                        {formatRupiah(penjualan.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            penjualan.status === "Lunas"
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }
                        >
                          {penjualan.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(penjualan)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogDetailPenjualan
        open={dialogDetailOpen}
        onOpenChange={setDialogDetailOpen}
        penjualan={selectedPenjualan}
      />
    </div>
  );
}
