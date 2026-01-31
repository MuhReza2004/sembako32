"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pembelian, PembelianDetail } from "@/app/types/pembelian";
import { useEffect, useState } from "react";
import {
  updatePembelianAndStock,
  getPembelianDetails,
} from "@/app/services/pembelian.service";
import { getAllProduk } from "@/app/services/produk.service";
import { getAllSupplierProduk } from "@/app/services/supplierProduk.service";
import { Produk } from "@/app/types/produk";
import { SupplierProduk } from "@/app/types/suplyer";
import { formatRupiah } from "@/helper/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  pembelian: Pembelian | null;
}

export default function DialogEditPembelian({
  open,
  onOpenChange,
  onSuccess,
  pembelian,
}: Props) {
  const [noDO, setNoDO] = useState("");
  const [noNPB, setNoNPB] = useState("");
  const [invoice, setInvoice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<PembelianDetail[]>([]);
  const [products, setProducts] = useState<Produk[]>([]);
  const [supplierProduks, setSupplierProduks] = useState<SupplierProduk[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (pembelian && pembelian.id) {
        setNoDO(pembelian.noDO || "");
        setNoNPB(pembelian.noNPB || "");
        setInvoice(pembelian.invoice || "");
        const det = await getPembelianDetails(pembelian.id);
        const prods = await getAllProduk();
        const supProds = await getAllSupplierProduk();
        setDetails(det);
        setProducts(prods);
        setSupplierProduks(supProds);
      }
    };
    fetchData();
  }, [pembelian]);

  const handleSubmit = async () => {
    if (!pembelian || !pembelian.id) return;

    setIsLoading(true);
    try {
      await updatePembelianAndStock(pembelian.id, { noDO, noNPB, invoice });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update pembelian:", error);
      alert("Gagal memperbarui pembelian.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!pembelian) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Pembelian & Update Stok</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="noDO">No. Delivery Order (DO)</Label>
              <Input
                id="noDO"
                value={noDO}
                onChange={(e) => setNoDO(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="noNPB">No. Penerimaan Barang (NPB)</Label>
              <Input
                id="noNPB"
                value={noNPB}
                onChange={(e) => setNoNPB(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="invoice">Invoice / Faktur</Label>
              <Input
                id="invoice"
                value={invoice}
                onChange={(e) => setInvoice(e.target.value)}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Detail Produk</h3>
            <div className="space-y-2">
              {details.map((detail) => {
                const supplierProduk = supplierProduks.find(
                  (sp) => sp.id === detail.supplierProdukId,
                );
                const product = products.find(
                  (p) => p.id === supplierProduk?.produkId,
                );
                return (
                  <div
                    key={detail.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {product?.nama || "Unknown Product"}
                      </p>
                      <p className="text-sm text-gray-600">Qty: {detail.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatRupiah(detail.harga)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatRupiah(detail.subtotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Menyimpan...
              </>
            ) : (
              "Terima"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
