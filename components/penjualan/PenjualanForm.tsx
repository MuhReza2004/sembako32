"use client";

import { useEffect, useState, useMemo } from "react";
import {
  createPenjualan,
  updatePenjualan,
  generateInvoiceNumber,
} from "@/app/services/penjualan.service";
import { PenjualanDetail, Penjualan } from "@/app/types/penjualan";
import { Produk } from "@/app/types/produk";
import { Pelanggan } from "@/app/types/pelanggan";
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
import { Card } from "@/components/ui/card";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { formatRupiah } from "@/helper/format";
import {
  AlertCircle,
  Plus,
  Trash2,
  Receipt,
  User,
  Package,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface PenjualanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingPenjualan?: Penjualan | null;
}

export default function PenjualanForm({
  open,
  onOpenChange,
  onSuccess,
  editingPenjualan,
}: PenjualanFormProps) {
  const [pelangganId, setPelangganId] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [namaToko, setNamaToko] = useState("");
  const [alamatPelanggan, setAlamatPelanggan] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [items, setItems] = useState<PenjualanDetail[]>([]);
  const [status, setStatus] = useState<"Lunas" | "Belum Lunas">("Lunas");
  const [metodePembayaran, setMetodePembayaran] = useState<
    "Tunai" | "Transfer"
  >("Tunai");
  const [nomorRekening, setNomorRekening] = useState("");
  const [namaBank, setNamaBank] = useState("");
  const [namaPemilikRekening, setNamaPemilikRekening] = useState("");
  const [diskon, setDiskon] = useState(0);
  const [pajakEnabled, setPajakEnabled] = useState(true);
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setPelangganId("");
    setNamaPelanggan("");
    setNamaToko("");
    setAlamatPelanggan("");
    setItems([]);
    setStatus("Lunas");
    setMetodePembayaran("Tunai");
    setNomorRekening("1953017106");
    setNamaBank("BNI");
    setNamaPemilikRekening("RIZAL");
    setDiskon(0);
    setPajakEnabled(true);
    setTanggalJatuhTempo("");
    setError(null);
    if (!editingPenjualan) {
      generateInvoiceNumber().then(setInvoiceNumber);
    }
  };

  useEffect(() => {
    if (open) {
      if (editingPenjualan) {
        // Populate form with existing data for editing
        const penj = editingPenjualan as Penjualan;
        setPelangganId(penj.pelangganId);
        setNamaPelanggan(penj.namaPelanggan || "");
        setAlamatPelanggan(penj.alamatPelanggan || "");
        setInvoiceNumber(penj.noInvoice || "");
        setItems(penj.items || []);
        setStatus((penj.status as "Lunas" | "Belum Lunas") || "Lunas");
        setMetodePembayaran(
          (penj.metodePembayaran as "Tunai" | "Transfer") || "Tunai",
        );
        setNomorRekening(penj.nomorRekening || "");
        setNamaBank(penj.namaBank || "");
        setNamaPemilikRekening(penj.namaPemilikRekening || "");
        setDiskon(penj.diskon || 0);
        setPajakEnabled(penj.pajakEnabled ?? true);
        setTanggalJatuhTempo(penj.tanggalJatuhTempo || "");
        setError(null);
      } else {
        resetForm();
      }
    }

    const qProduk = query(collection(db, "produk"), orderBy("nama", "asc"));
    const unsubscribeProduk = onSnapshot(qProduk, (snapshot) => {
      const prods = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Produk)
        .filter((p) => p.status === "aktif");
      setProdukList(prods);
    });

    const qPelanggan = query(
      collection(db, "pelanggan"),
      orderBy("namaPelanggan", "asc"),
    );
    const unsubscribePelanggan = onSnapshot(qPelanggan, (snapshot) => {
      const allPelanggan = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pelanggan[];
      setPelangganList(allPelanggan);
    });

    return () => {
      unsubscribeProduk();
      unsubscribePelanggan();
    };
  }, [open, editingPenjualan]);

  const addItem = () => {
    setItems([
      ...items,
      {
        supplierProdukId: "",
        namaProduk: "",
        satuan: "",
        harga: 0,
        qty: 1,
        subtotal: 0,
      },
    ]);
  };

  const updateItem = (i: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[i];
    (item as any)[field] = value;

    const produk = produkList.find((p) => p.id === item.supplierProdukId);

    if (field === "supplierProdukId" && produk) {
      item.namaProduk = produk.nama;
      item.harga = (produk as any).hargaJual || 0;
      item.satuan = produk.satuan;
    }

    if (produk && item.qty > produk.stok) {
      setError(`Stok ${produk.nama} tidak mencukupi (sisa: ${produk.stok})`);
      item.qty = produk.stok;
    } else {
      setError(null);
    }

    item.subtotal = item.harga * item.qty;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.subtotal, 0),
    [items],
  );

  const pajak = useMemo(() => {
    if (!pajakEnabled) return 0;
    return (subtotal - diskon) * 0.11;
  }, [subtotal, diskon, pajakEnabled]);

  const totalAkhir = useMemo(
    () => subtotal - diskon + pajak,
    [subtotal, diskon, pajak],
  );

  const submit = async () => {
    setError(null);
    if (!pelangganId) {
      setError("Pilih pelanggan terlebih dahulu");
      return;
    }
    if (
      items.length === 0 ||
      items.some((item) => !item.supplierProdukId || !item.qty)
    ) {
      setError("Pastikan ada produk yang dipilih dan kuantitas terisi");
      return;
    }

    if (status === "Belum Lunas" && !tanggalJatuhTempo) {
      setError("Tanggal jatuh tempo harus diisi jika status belum lunas");
      return;
    }

    setIsLoading(true);
    try {
      const penjualanData: any = {
        nomorInvoice: invoiceNumber,
        pelangganId,
        namaPelanggan,
        namaToko,
        alamatPelanggan,
        tanggal: editingPenjualan
          ? editingPenjualan.tanggal
          : new Date().toISOString(),
        items,
        total: subtotal,
        diskon,
        pajak,
        totalAkhir,
        status,
        metodePembayaran,
        pajakEnabled,
      };

      // Only include bank details if payment method is Transfer
      if (metodePembayaran === "Transfer") {
        penjualanData.nomorRekening = nomorRekening;
        penjualanData.namaBank = namaBank;
        penjualanData.namaPemilikRekening = namaPemilikRekening;
      }

      // Include tanggalJatuhTempo if status is Belum Lunas
      if (status === "Belum Lunas") {
        penjualanData.tanggalJatuhTempo = tanggalJatuhTempo;
      }

      if (editingPenjualan && editingPenjualan.id) {
        await updatePenjualan(editingPenjualan.id, penjualanData);
        alert("Penjualan berhasil diperbarui!");
      } else {
        penjualanData.createdAt = new Date();
        await createPenjualan(penjualanData);
        alert("Penjualan berhasil disimpan!");
      }

      onSuccess();
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Gagal menyimpan penjualan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                Transaksi Penjualan Baru
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Isi detail transaksi penjualan kepada pelanggan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ERROR ALERT */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* INFO SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-600" />
                Nomor Invoice
              </Label>
              <Input
                value={invoiceNumber}
                readOnly
                className="bg-gray-50 font-mono font-semibold"
              />
            </div>

            {/* Pelanggan */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                Pelanggan
              </Label>
              <Select
                onValueChange={(val) => {
                  const p = pelangganList.find((x) => x.id === val);
                  if (p && p.id) {
                    setPelangganId(p.id as string);
                    setNamaPelanggan(p.namaPelanggan as string);
                    setNamaToko(p.namaToko as string);
                    setAlamatPelanggan(p.alamat as string);
                  }
                }}
                value={pelangganId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Pelanggan" />
                </SelectTrigger>
                <SelectContent>
                  {pelangganList
                    .filter(
                      (p): p is Pelanggan & { id: string } =>
                        p.id !== undefined,
                    )
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.namaPelanggan || ""} - {p.namaToko || ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Pembayaran */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-gray-600" />
                Status Pembayaran
              </Label>
              <Select onValueChange={(v: any) => setStatus(v)} value={status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lunas">Lunas</SelectItem>
                  <SelectItem value="Belum Lunas">Belum Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tanggal Jatuh Tempo - hanya muncul jika Belum Lunas */}
            {status === "Belum Lunas" && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Tanggal Jatuh Tempo
                </Label>
                <Input
                  type="date"
                  value={tanggalJatuhTempo}
                  onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                  placeholder="Pilih tanggal jatuh tempo"
                />
              </div>
            )}

            {/* Metode Pembayaran */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                Metode Pembayaran
              </Label>
              <Select
                onValueChange={(v: any) => {
                  setMetodePembayaran(v);
                  if (v === "Tunai") {
                    setNomorRekening("");
                  }
                }}
                value={metodePembayaran}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunai">Tunai</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Details - hanya muncul jika Transfer */}
            {metodePembayaran === "Transfer" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Nama Bank
                  </Label>
                  <Input
                    value={namaBank}
                    onChange={(e) => setNamaBank(e.target.value)}
                    placeholder="Masukkan nama bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Nama Pemilik Rekening
                  </Label>
                  <Input
                    value={namaPemilikRekening}
                    onChange={(e) => setNamaPemilikRekening(e.target.value)}
                    placeholder="Masukkan nama pemilik rekening"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Nomor Rekening
                  </Label>
                  <Input
                    value={nomorRekening}
                    onChange={(e) => setNomorRekening(e.target.value)}
                    placeholder="Masukkan nomor rekening"
                  />
                </div>
              </>
            )}

            {/* Diskon */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Diskon (Rp)
              </Label>
              <Input
                type="number"
                min={0}
                value={diskon}
                onChange={(e) => setDiskon(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            {/* Pajak Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Pajak PPN 11%
              </Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pajak-toggle"
                  checked={pajakEnabled}
                  onChange={(e) => setPajakEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="pajak-toggle" className="text-sm text-gray-700">
                  {pajakEnabled ? "Aktif" : "Nonaktif"}
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* ITEMS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                <Label className="text-base font-semibold text-foreground">
                  Daftar Produk
                </Label>
              </div>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            </div>

            {items.length > 0 ? (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-3 bg-gray-50 rounded-lg font-medium text-sm text-foreground">
                  <div className="col-span-4">Produk</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-2">Satuan</div>
                  <div className="col-span-2">Harga</div>
                  <div className="col-span-2">Subtotal</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Table Body */}
                {items.map((item, i) => {
                  const selectedProduk = produkList.find(
                    (p) => p.id === item.supplierProdukId,
                  );
                  return (
                    <Card
                      key={i}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Produk */}
                        <div className="md:col-span-4 space-y-1">
                          <Label className="md:hidden text-xs text-gray-600">
                            Produk
                          </Label>
                          <Select
                            onValueChange={(val) =>
                              updateItem(i, "supplierProdukId", val)
                            }
                            value={item.supplierProdukId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Produk" />
                            </SelectTrigger>
                            <SelectContent>
                              {produkList.map((p) => (
                                <SelectItem
                                  key={p.id}
                                  value={p.id}
                                  disabled={p.stok === 0}
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <span>{p.nama}</span>
                                    <Badge
                                      variant={
                                        p.stok > 0 ? "outline" : "destructive"
                                      }
                                      className="ml-2"
                                    >
                                      Stok: {p.stok}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Qty */}
                        <div className="md:col-span-1 space-y-1">
                          <Label className="md:hidden text-xs text-gray-600">
                            Qty
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            max={selectedProduk?.stok}
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(i, "qty", Number(e.target.value))
                            }
                            disabled={!item.supplierProdukId}
                            className="w-full"
                          />
                        </div>

                        {/* Satuan */}
                        <div className="md:col-span-2 space-y-1">
                          <Label className="md:hidden text-xs text-gray-600">
                            Satuan
                          </Label>
                          <div className="font-medium text-foreground px-3 py-2 bg-gray-50 rounded-md">
                            {item.satuan || "-"}
                          </div>
                        </div>

                        {/* Harga */}
                        <div className="md:col-span-2 space-y-1">
                          <Label className="md:hidden text-xs text-gray-600">
                            Harga Satuan
                          </Label>
                          <div className="font-medium text-foreground px-3 py-2 bg-gray-50 rounded-md">
                            {formatRupiah(item.hargaJual || 0)}
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="md:col-span-2 space-y-1">
                          <Label className="md:hidden text-xs text-gray-600">
                            Subtotal
                          </Label>
                          <div className="font-semibold text-green-600 px-3 py-2 bg-green-50 rounded-md">
                            {formatRupiah(item.subtotal)}
                          </div>
                        </div>

                        {/* Delete */}
                        <div className="md:col-span-1 flex md:justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(i)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">
                  Belum ada produk ditambahkan
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Klik tombol "Tambah Produk" untuk memulai
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* TOTAL SECTION */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Subtotal:</div>
              <div className="text-right">{formatRupiah(subtotal)}</div>
              <div>Diskon:</div>
              <div className="text-right text-red-600">
                -{formatRupiah(diskon)}
              </div>
              {pajakEnabled && (
                <>
                  <div>PPN 11%:</div>
                  <div className="text-right">{formatRupiah(pajak)}</div>
                </>
              )}
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">
                Total Akhir
              </span>
              <span className="text-3xl font-bold text-green-600">
                {formatRupiah(totalAkhir)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={isLoading || !pelangganId || items.length === 0}
            className="min-w-[150px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Memproses...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4 mr-2" />
                Proses
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
