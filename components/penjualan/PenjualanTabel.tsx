"use client";

import { Penjualan } from "@/app/types/penjualan";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatTanggal } from "@/helper/format";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PenjualanTabelProps {
  data: Penjualan[];
  isLoading: boolean;
  error: string | null;
  onViewDetails: (penjualan: Penjualan) => void;
  onUpdateStatus: (id: string, status: "Lunas" | "Belum Lunas") => void;
  onEdit: (penjualan: Penjualan) => void;
  onCancel: (id: string) => void;
}

export default function PenjualanTabel({
  data = [],
  isLoading,
  error,
  onViewDetails,
  onUpdateStatus,
  onEdit,
  onCancel,
}: PenjualanTabelProps) {
  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (data.length === 0) {
    return <p>Tidak ada data penjualan.</p>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Invoice</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead className="text-center">Total</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data
            .filter((p): p is Penjualan & { id: string } => !!p.id)
            .map((penjualan) => (
            <TableRow key={penjualan.id}>
              <TableCell className="font-medium">
                {penjualan.noInvoice}
              </TableCell>
              <TableCell>{formatTanggal(penjualan.tanggal)}</TableCell>
              <TableCell>{penjualan.namaPelanggan}</TableCell>
              <TableCell className="text-center">
                {formatRupiah(penjualan.total)}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={
                    penjualan.status === "Lunas" ? "default" : "destructive"
                  }
                >
                  {penjualan.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewDetails(penjualan)}>
                      Lihat Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(penjualan)}>
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onCancel(penjualan.id)}
                    >
                      Batal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
