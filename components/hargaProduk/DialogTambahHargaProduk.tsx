"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SupplierProdukFormData } from "@/app/types/suplyer";
import { addSupplierProduk } from "@/app/services/supplierProduk.service";
import { getAllSuppliers } from "@/app/services/supplyer.service";
import { getAllProduk } from "@/app/services/produk.service";
import { Supplier } from "@/app/types/suplyer";
import { Produk } from "@/app/types/produk";
import { formatRupiah } from "@/helper/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedSupplierId?: string;
}

export default function DialogTambahHargaProduk({
  open,
  onOpenChange,
  onSuccess,
  preselectedSupplierId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Produk[]>([]);
  const [displayPrice, setDisplayPrice] = useState("");
  const [displaySellPrice, setDisplaySellPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState<SupplierProdukFormData>({
    supplierId: "",
    produkId: "",
    hargaBeli: 0,
    hargaJual: 0,
    stok: 0,
  });

  const filteredProducts = products.filter((p) =>
    p.nama.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    const fetchData = async () => {
      const [sups, prods] = await Promise.all([
        getAllSuppliers(),
        getAllProduk(),
      ]);
      setSuppliers(sups);
      setProducts(prods);

      // Reset form data when dialog opens
      setFormData({
        supplierId: preselectedSupplierId || "",
        produkId: "",
        hargaBeli: 0,
        hargaJual: 0,
        stok: 0,
      });
      setDisplayPrice("");
      setDisplaySellPrice("");
      setSearchQuery("");
      setShowDropdown(false);
    };
    if (open) {
      fetchData();
    }
  }, [open, preselectedSupplierId]);

  useEffect(() => {
    if (formData.produkId && products.length > 0) {
      const selectedProduct = products.find((p) => p.id === formData.produkId);
      if (selectedProduct) {
        setSearchQuery(selectedProduct.nama);
      }
    } else if (!formData.produkId) {
      setSearchQuery("");
    }
  }, [formData.produkId, products]);

  const handlePriceChange = (value: string) => {
    // Remove non-numeric characters except comma and dot
    const numericValue = value.replace(/[^\d]/g, "");
    const numberValue = parseInt(numericValue) || 0;

    setFormData((p) => ({ ...p, hargaBeli: numberValue }));
    setDisplayPrice(formatRupiah(numberValue));
  };

  const handleSellPriceChange = (value: string) => {
    // Remove non-numeric characters except comma and dot
    const numericValue = value.replace(/[^\d]/g, "");
    const numberValue = parseInt(numericValue) || 0;

    setFormData((p) => ({ ...p, hargaJual: numberValue }));
    setDisplaySellPrice(formatRupiah(numberValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await addSupplierProduk(formData);

    setLoading(false);
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Supplier Produk</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Supplier *</Label>
            <Select
              value={formData.supplierId}
              onValueChange={(val) =>
                setFormData((p) => ({ ...p, supplierId: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Label>Produk *</Label>
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Cari Produk"
              required
            />
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, produkId: p.id }));
                      setSearchQuery(p.nama);
                      setShowDropdown(false);
                    }}
                  >
                    {p.nama}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Harga Beli *</Label>
            <Input
              value={displayPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="Rp 0"
              required
            />
          </div>

          <div>
            <Label>Harga Jual *</Label>
            <Input
              value={displaySellPrice}
              onChange={(e) => handleSellPriceChange(e.target.value)}
              placeholder="Rp 0"
              required
            />
          </div>

          <div>
            <Label>Stok Fisik *</Label>
            <Input
              type="text"
              value={formData.stok}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  stok: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="0"
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
