"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createPenjualan,
  updatePenjualan,
  generateInvoiceNumber,
  generateNPBNumber,
  generateDONumber,
  getAllPenjualan,
} from "@/app/services/penjualan.service";
import { PenjualanDetail, Penjualan } from "@/app/types/penjualan";
import { SupplierProduk, Supplier } from "@/app/types/suplyer";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CheckCircle2,
  ArrowLeft,
  Save,
  FileText,
  Calendar,
  CreditCard,
  Building2,
  UserCircle,
  Hash,
  Percent,
  TrendingUp,
  ShoppingCart,
  Calculator,
  Truck,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ComboboxPelanggan } from "@/components/ui/combobox-pelanggan";
import { ComboboxSupplierProduk } from "@/components/ui/combobox-supplier-produk";
import {
  addpelanggan,
  getNewKodePelanggan,
} from "@/app/services/pelanggan.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function TambahPenjualanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [pelangganId, setPelangganId] = useState("");
  const [catatan, setCatatan] = useState("");
  const [noInvoice, setNoInvoice] = useState("Generating...");
  const [noNPB, setNoNPB] = useState("Generating...");
  const [noDO, setNoDO] = useState("Generating...");
  const [metodePengambilan, setMetodePengambilan] = useState<
    "Ambil Langsung" | "Diantar"
  >("Ambil Langsung");
  const [supplierProdukList, setSupplierProdukList] = useState<
    SupplierProduk[]
  >([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [items, setItems] = useState<PenjualanDetail[]>([]);
  const [currentItem, setCurrentItem] = useState<{
    supplierProdukId: string;
    qty: number;
  }>({
    supplierProdukId: "",
    qty: 1,
  });
  const [status, setStatus] = useState<"Lunas" | "Belum Lunas">("Lunas");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPenjualan, setEditingPenjualan] = useState<Penjualan | null>(
    null,
  );
  const [metodePembayaran, setMetodePembayaran] = useState("");
  const [namaBank, setNamaBank] = useState("BRI");
  const [namaPemilikRekening, setNamaPemilikRekening] =
    useState("RAHMAT SYUKUR");
  const [nomorRekening, setNomorRekening] = useState("7071 0101 9195 533");
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState("");
  const [pajakEnabled, setPajakEnabled] = useState(false);
  const [diskon, setDiskon] = useState(0);
  const [showNewPelangganForm, setShowNewPelangganForm] = useState(false);
  const [newPelanggan, setNewPelanggan] = useState({
    namaPelanggan: "",
    kodePelanggan: "",
    namaToko: "",
    alamat: "",
    noTelp: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleAddNewPelanggan = async () => {
    if (!newPelanggan.namaPelanggan) {
      setError("Nama pelanggan harus diisi.");
      return;
    }
    setIsLoading(true);
    try {
      const newId = await addpelanggan(newPelanggan as Pelanggan);
      setPelangganId(newId);
      setShowNewPelangganForm(false);
      setNewPelanggan({
        namaPelanggan: "",
        kodePelanggan: "",
        namaToko: "",
        alamat: "",
        noTelp: "-",
      });
    } catch (e: any) {
      setError("Gagal menambah pelanggan baru: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPelangganId("");
    setCatatan("");
    setItems([]);
    setStatus("Lunas");
    setMetodePembayaran("");
    setMetodePengambilan("Ambil Langsung");
    setNamaBank("BRI");
    setNamaPemilikRekening("RAHMAT SYUKUR");
    setNomorRekening("7071 0101 9195 533");
    setTanggalJatuhTempo("");
    setPajakEnabled(false);
    setDiskon(0);
    setError(null);
    if (!editingPenjualan) {
      generateInvoiceNumber().then(setNoInvoice);
      generateNPBNumber().then(setNoNPB);
      generateDONumber().then(setNoDO);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // Load supplier produk
      const qSupplierProduk = query(
        collection(db, "supplier_produk"),
        orderBy("createdAt", "desc"),
      );
      const unsubscribeSupplierProduk = onSnapshot(
        qSupplierProduk,
        (snapshot) => {
          const supplierProds = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as SupplierProduk[];
          setSupplierProdukList(supplierProds);
        },
      );

      // Load produk
      const qProduk = query(collection(db, "produk"), orderBy("nama", "asc"));
      const unsubscribeProduk = onSnapshot(qProduk, (snapshot) => {
        const prods = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Produk)
          .filter((p) => p.status === "aktif");
        setProdukList(prods);
      });

      // Load pelanggan
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

      // Load editing data if editId exists
      if (editId) {
        const allPenjualan = await getAllPenjualan();
        const penjualan = allPenjualan.find((p) => p.id === editId);
        if (penjualan) {
          setEditingPenjualan(penjualan);
          setPelangganId(penjualan.pelangganId);
          setCatatan(penjualan.catatan || "");
          setNoInvoice(penjualan.noInvoice);
          setNoNPB(penjualan.noNPB);
          setNoDO(penjualan.noDO || "");
          setMetodePengambilan(penjualan.metodePengambilan || "Ambil Langsung");
          setItems(penjualan.items || []);
          setStatus(penjualan.status);
          setMetodePembayaran(penjualan.metodePembayaran || "");
          setNamaBank(penjualan.namaBank || "BRI");
          setNamaPemilikRekening(
            penjualan.namaPemilikRekening || "RAHMAT SYUKUR",
          );
          setNomorRekening(penjualan.nomorRekening || "7071 0101 9195 533");
          setTanggalJatuhTempo(penjualan.tanggalJatuhTempo || "");
          setPajakEnabled(penjualan.pajakEnabled || false);
          setDiskon(penjualan.diskon || 0);
        }
      } else {
        resetForm();
      }

      return () => {
        unsubscribeSupplierProduk();
        unsubscribeProduk();
        unsubscribePelanggan();
      };
    };

    loadData();
  }, [editId]);

  const addItemToList = () => {
    if (!currentItem.supplierProdukId || currentItem.qty <= 0) {
      setError("Pilih produk dan masukkan jumlah yang valid");
      return;
    }

    const supplierProduk = supplierProdukList.find(
      (sp) => sp.id === currentItem.supplierProdukId,
    );

    if (!supplierProduk) {
      setError("Produk tidak ditemukan");
      return;
    }

    if (currentItem.qty > supplierProduk.stok) {
      const produk = produkList.find((p) => p.id === supplierProduk.produkId);
      setError(
        `Stok ${produk?.nama || "Produk"} tidak mencukupi (sisa: ${
          supplierProduk.stok
        })`,
      );
      return;
    }

    // Check if product already exists in items
    const existingIndex = items.findIndex(
      (item) => item.supplierProdukId === currentItem.supplierProdukId,
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      const newItems = [...items];
      newItems[existingIndex].qty += currentItem.qty;
      newItems[existingIndex].subtotal =
        newItems[existingIndex].harga * newItems[existingIndex].qty;
      setItems(newItems);
    } else {
      // Add new item
      setItems([
        ...items,
        {
          supplierProdukId: currentItem.supplierProdukId,
          qty: currentItem.qty,
          harga: supplierProduk.hargaJual,
          subtotal: supplierProduk.hargaJual * currentItem.qty,
        },
      ]);
    }

    // Reset current item
    setCurrentItem({
      supplierProdukId: "",
      qty: 1,
    });
    setError(null);
  };

  const updateItem = (i: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[i];
    (item as any)[field] = value;

    const supplierProduk = supplierProdukList.find(
      (sp) => sp.id === item.supplierProdukId,
    );

    if (field === "supplierProdukId" && supplierProduk) {
      item.harga = supplierProduk.hargaJual;
    }

    if (supplierProduk && item.qty > supplierProduk.stok) {
      const produk = produkList.find((p) => p.id === supplierProduk.produkId);
      setError(
        `Stok ${produk?.nama || "Produk"} tidak mencukupi (sisa: ${
          supplierProduk.stok
        })`,
      );
      item.qty = supplierProduk.stok;
    } else {
      setError(null);
    }

    item.subtotal = item.harga * item.qty;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const { subTotal, totalDiskon, totalPajak, total } = useMemo(() => {
    const subTotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const totalDiskon = (subTotal * diskon) / 100;
    const totalSetelahDiskon = subTotal - totalDiskon;
    const totalPajak = pajakEnabled ? totalSetelahDiskon * 0.11 : 0;
    const total = totalSetelahDiskon + totalPajak;
    return { subTotal, totalDiskon, totalPajak, total };
  }, [items, diskon, pajakEnabled]);

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

    setIsLoading(true);
    try {
      const penjualanData: any = {
        tanggal: editingPenjualan?.tanggal
          ? editingPenjualan.tanggal
          : new Date().toISOString(),
        pelangganId,
        catatan: catatan,
        noInvoice,
        noNPB: noNPB,
        metodePengambilan,
        total,
        status,
        items,
      };

      if (metodePengambilan === "Diantar") {
        penjualanData.noDO = noDO;
      }

      if (metodePembayaran) penjualanData.metodePembayaran = metodePembayaran;
      if (namaBank) penjualanData.namaBank = namaBank;
      if (namaPemilikRekening)
        penjualanData.namaPemilikRekening = namaPemilikRekening;
      if (nomorRekening) penjualanData.nomorRekening = nomorRekening;
      if (tanggalJatuhTempo)
        penjualanData.tanggalJatuhTempo = tanggalJatuhTempo;
      penjualanData.pajakEnabled = pajakEnabled;
      if (pajakEnabled) penjualanData.pajak = totalPajak;
      if (diskon > 0) penjualanData.diskon = diskon;

      if (editingPenjualan && editingPenjualan.id) {
        await updatePenjualan(editingPenjualan.id, penjualanData);
        alert("Penjualan berhasil diperbarui!");
      } else {
        await createPenjualan(penjualanData);
        alert("Penjualan berhasil disimpan!");
      }

      router.push("/dashboard/admin/transaksi/penjualan");
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Gagal menyimpan penjualan");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPelanggan = pelangganList.find((p) => p.id === pelangganId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/10 to-primary-foreground/10">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-primary via-yellow-400 to-yellow-500 text-primary-foreground shadow-xl">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 text-white hover:bg-white/20 border border-white/30 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
              <div className="relative p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <ShoppingCart className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2 tracking-tight">
                {editingPenjualan ? "Edit" : "Buat"} Transaksi Penjualan
              </h1>
              <p className="text-yellow-100 text-lg flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Kelola transaksi penjualan dengan detail lengkap
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* ERROR ALERT - Enhanced */}
          {error && (
            <div className="animate-in slide-in-from-top duration-300">
              <Card className="border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
                <div className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">
                      Terjadi Kesalahan
                    </h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Products Section */}
              <Card className="overflow-hidden border-none shadow-lg bg-background/80 backdrop-blur-sm">
                <div className="bg-gradient-to-r from-primary to-yellow-500 p-6 text-primary-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Input Produk</h3>
                        <p className="text-sm text-yellow-100">
                          Pilih produk dan jumlah, lalu klik tambah
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Pelanggan */}
                <div className="group px-8">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                    <UserCircle className="h-4 w-4 text-primary-foreground" />
                    Pelanggan
                    <span className="text-red-500">*</span>
                  </Label>
                  <ComboboxPelanggan
                    pelangganList={pelangganList}
                    value={pelangganId}
                    onChange={(value) => {
                      setShowNewPelangganForm(false);
                      setPelangganId(value);
                    }}
                    onAddNew={async () => {
                      setShowNewPelangganForm(true);
                      setPelangganId("");
                      const newKode = await getNewKodePelanggan();
                      setNewPelanggan((prev) => ({
                        ...prev,
                        kodePelanggan: newKode,
                      }));
                    }}
                  />
                </div>
                {showNewPelangganForm && (
                  <Card className="p-4 mt-4 bg-slate-50">
                    <h4 className="font-semibold mb-2">
                      Tambah Pelanggan Baru
                    </h4>
                    <div className="space-y-2">
                      <Label>Kode Pelanggan</Label>
                      <Input value={newPelanggan.kodePelanggan} readOnly />
                      <Label>Nama Pelanggan</Label>
                      <Input
                        value={newPelanggan.namaPelanggan}
                        onChange={(e) =>
                          setNewPelanggan({
                            ...newPelanggan,
                            namaPelanggan: e.target.value,
                          })
                        }
                      />
                      <Label>Nama Toko</Label>
                      <Input
                        value={newPelanggan.namaToko}
                        onChange={(e) =>
                          setNewPelanggan({
                            ...newPelanggan,
                            namaToko: e.target.value,
                          })
                        }
                      />
                      <Label>Alamat</Label>
                      <Input
                        value={newPelanggan.alamat}
                        onChange={(e) =>
                          setNewPelanggan({
                            ...newPelanggan,
                            alamat: e.target.value,
                          })
                        }
                      />
                      <Label>No. Telepon</Label>
                      <Input
                        value={newPelanggan.noTelp}
                        onChange={(e) =>
                          setNewPelanggan({
                            ...newPelanggan,
                            noTelp: e.target.value,
                          })
                        }
                      />
                      <Button
                        onClick={handleAddNewPelanggan}
                        className="mt-2"
                        disabled={isLoading}
                      >
                        {isLoading ? "Menyimpan..." : "Simpan Pelanggan"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowNewPelangganForm(false)}
                      >
                        Batal
                      </Button>
                    </div>
                  </Card>
                )}
                <div className="p-6 space-y-6">
                  {/* Current Item Input */}
                  <Card className="p-4 border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-yellow-50">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-foreground">
                          Tambah Produk Baru
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Product Selection */}
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-slate-700 mb-2 block">
                            Pilih Produk
                          </Label>
                          <ComboboxSupplierProduk
                            supplierProdukList={supplierProdukList}
                            produkList={produkList}
                            value={currentItem.supplierProdukId}
                            onChange={(val) =>
                              setCurrentItem((prev) => ({
                                ...prev,
                                supplierProdukId: val,
                              }))
                            }
                          />
                        </div>

                        {/* Quantity Input */}
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-2 block">
                            Jumlah
                          </Label>
                          <Input
                            type="text"
                            min={1}
                            value={currentItem.qty}
                            onChange={(e) =>
                              setCurrentItem((prev) => ({
                                ...prev,
                                qty: Number(e.target.value),
                              }))
                            }
                            className="h-12 text-center font-semibold border-2"
                            placeholder="1"
                          />
                        </div>
                      </div>

                      {/* Add Button */}
                      <Button
                        onClick={addItemToList}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah ke Daftar
                      </Button>
                    </div>
                  </Card>

                  {/* Items Table */}
                  {items.length > 0 && (
                    <Card className="overflow-hidden border-none shadow-lg bg-white/80 backdrop-blur-sm">
                      <div className="bg-gradient-to-r from-muted-foreground to-foreground p-4 text-primary-foreground">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          <h4 className="font-semibold">
                            Daftar Produk ({items.length})
                          </h4>
                        </div>
                      </div>

                      <div className="p-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produk</TableHead>
                              <TableHead>Jumlah</TableHead>
                              <TableHead>Harga Satuan</TableHead>
                              <TableHead>Subtotal</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item, i) => {
                              const selectedSupplierProduk =
                                supplierProdukList.find(
                                  (sp) => sp.id === item.supplierProdukId,
                                );
                              const selectedProduk = produkList.find(
                                (p) =>
                                  p.id === selectedSupplierProduk?.produkId,
                              );

                              return (
                                <TableRow key={i}>
                                  <TableCell>
                                    {selectedProduk?.nama ||
                                      "Produk Tidak Ditemukan"}
                                  </TableCell>
                                  <TableCell>{item.qty}</TableCell>
                                  <TableCell>
                                    {formatRupiah(item.harga)}
                                  </TableCell>
                                  <TableCell>
                                    {formatRupiah(item.subtotal)}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeItem(i)}
                                      className="hover:bg-red-50 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  )}

                  {items.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-xl p-16 text-center bg-gradient-to-br from-muted to-background">
                      <div className="w-20 h-20 bg-muted-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-semibold text-lg mb-2">
                        Belum Ada Produk
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Pilih produk di atas dan klik "Tambah ke Daftar"
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="overflow-hidden border-none shadow-lg bg-background/80 backdrop-blur-sm">
                <div className="bg-gradient-to-r from-primary to-yellow-500 p-6 text-primary-foreground">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Detail Pelanggan & Transaksi
                      </h3>
                      <p className="text-sm text-yellow-100">
                        Informasi pelanggan dan metode pembayaran
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Pelanggan */}
                  <div className="group">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                      <UserCircle className="h-4 w-4 text-blue-600" />
                      Pelanggan
                      <span className="text-red-500">*</span>
                    </Label>
                                        <ComboboxPelanggan
                                          pelangganList={pelangganList}
                                          value={pelangganId}
                                          onChange={(value) => {
                                            setShowNewPelangganForm(false);
                                            setPelangganId(value);
                                          }}
                                          onAddNew={async () => {
                                            setShowNewPelangganForm(true);
                                            setPelangganId("");
                                            const newKode = await getNewKodePelanggan();
                                            setNewPelanggan((prev) => ({
                                              ...prev,
                                              kodePelanggan: newKode,
                                            }));
                                          }}
                                        />
                  </div>
                  {showNewPelangganForm && (
                    <Card className="p-4 mt-4 bg-slate-50">
                      <h4 className="font-semibold mb-2">
                        Tambah Pelanggan Baru
                      </h4>
                      <div className="space-y-2">
                        <Label>Kode Pelanggan</Label>
                        <Input value={newPelanggan.kodePelanggan} readOnly />
                        <Label>Nama Pelanggan</Label>
                        <Input
                          value={newPelanggan.namaPelanggan}
                          onChange={(e) =>
                            setNewPelanggan({
                              ...newPelanggan,
                              namaPelanggan: e.target.value,
                            })
                          }
                        />
                        <Label>Nama Toko</Label>
                        <Input
                          value={newPelanggan.namaToko}
                          onChange={(e) =>
                            setNewPelanggan({
                              ...newPelanggan,
                              namaToko: e.target.value,
                            })
                          }
                        />
                        <Label>Alamat</Label>
                        <Input
                          value={newPelanggan.alamat}
                          onChange={(e) =>
                            setNewPelanggan({
                              ...newPelanggan,
                              alamat: e.target.value,
                            })
                          }
                        />
                        <Label>No. Telepon</Label>
                        <Input
                          value={newPelanggan.noTelp}
                          onChange={(e) =>
                            setNewPelanggan({
                              ...newPelanggan,
                              noTelp: e.target.value,
                            })
                          }
                        />
                        <Button
                          onClick={handleAddNewPelanggan}
                          className="mt-2"
                          disabled={isLoading}
                        >
                          {isLoading ? "Menyimpan..." : "Simpan Pelanggan"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setShowNewPelangganForm(false)}
                        >
                          Batal
                        </Button>
                      </div>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Metode Pengambilan */}
                    <div className="group">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                        <Truck className="h-4 w-4 text-primary-foreground" />
                        Metode Pengambilan
                      </Label>
                      <Select
                        onValueChange={(v: any) => setMetodePengambilan(v)}
                        value={metodePengambilan}
                      >
                        <SelectTrigger className="h-12 border-2 group-hover:border-primary-foreground/50 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ambil Langsung">
                            Ambil Langsung
                          </SelectItem>
                          <SelectItem value="Diantar">Diantar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Status Pembayaran */}
                    <div className="group">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Status Pembayaran
                      </Label>
                      <Select
                        onValueChange={(v: any) => setStatus(v)}
                        value={status}
                      >
                        <SelectTrigger className="h-12 border-2 group-hover:border-primary/50 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lunas">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              <span className="font-medium">Lunas</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Belum Lunas">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <span className="font-medium">Belum Lunas</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Metode Pembayaran */}
                    <div className="group">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-primary-foreground" />
                        Metode Pembayaran
                      </Label>
                      <Select
                        onValueChange={setMetodePembayaran}
                        value={metodePembayaran}
                      >
                        <SelectTrigger className="h-12 border-2 group-hover:border-primary-foreground/50 transition-colors">
                          <SelectValue placeholder="Pilih Metode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tunai">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              Tunai
                            </div>
                          </SelectItem>
                          <SelectItem value="Transfer">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                              Transfer Bank
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bank Details - Collapsible */}
                  {metodePembayaran === "Transfer" && (
                    <div className="animate-in slide-in-from-top duration-300">
                      <Card className="bg-gradient-to-br from-primary-foreground/10 to-primary-foreground/20 border-primary-foreground/30">
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Building2 className="h-5 w-5 text-primary-foreground" />
                            <h4 className="font-semibold text-slate-800">
                              Informasi Rekening Bank
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs font-medium text-slate-600 mb-1">
                                Nama Bank
                              </Label>
                              <Input
                                value={namaBank}
                                onChange={(e) => setNamaBank(e.target.value)}
                                placeholder="Contoh: BNI"
                                className="h-10 bg-white border-primary-foreground/30"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-600 mb-1">
                                Nama Pemilik
                              </Label>
                              <Input
                                value={namaPemilikRekening}
                                onChange={(e) =>
                                  setNamaPemilikRekening(e.target.value)
                                }
                                placeholder="Nama pemilik rekening"
                                className="h-10 bg-white border-primary-foreground/30"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-600 mb-1">
                                Nomor Rekening
                              </Label>
                              <Input
                                value={nomorRekening}
                                onChange={(e) =>
                                  setNomorRekening(e.target.value)
                                }
                                placeholder="Nomor rekening"
                                className="h-10 bg-white border-primary-foreground/30 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Due Date - Conditional */}
                  {status === "Belum Lunas" && (
                    <div className="animate-in slide-in-from-top duration-300">
                      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                        <div className="p-4">
                          <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            Tanggal Jatuh Tempo
                          </Label>
                          <Input
                            type="date"
                            value={tanggalJatuhTempo}
                            onChange={(e) =>
                              setTanggalJatuhTempo(e.target.value)
                            }
                            className="h-11 bg-white border-amber-200"
                          />
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Catatan */}
                  <div className="group">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      Catatan Tambahan
                      <span className="text-xs text-slate-400 font-normal">
                        (Opsional)
                      </span>
                    </Label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Tambahkan catatan atau keterangan khusus..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all resize-none group-hover:border-slate-300"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Customer Info Card */}
              {selectedPelanggan && (
                <Card className="overflow-hidden border-none shadow-lg  top-6">
                  <div className="bg-gradient-to-r from-primary to-yellow-500 p-6 text-white">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      <h4 className="font-semibold">Info Pelanggan</h4>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 bg-gradient-to-br from-background to-primary-foreground/10">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Nama</div>
                      <div className="font-semibold text-slate-800">
                        {selectedPelanggan?.namaPelanggan || "Tidak ada nama"} (
                        {selectedPelanggan?.kodePelanggan || "N/A"})
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Toko</div>
                      <div className="font-medium text-slate-700">
                        {selectedPelanggan?.namaToko || "Tidak ada toko"}
                      </div>
                    </div>
                    {selectedPelanggan?.noTelp && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Telepon
                          </div>
                          <div className="font-medium text-slate-700">
                            {selectedPelanggan.noTelp}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              )}

              {/* Calculation Summary */}
              <Card className="overflow-hidden border-none shadow-lg  top-6">
                <div className="bg-gradient-to-r from-primary to-yellow-500 p-4 text-primary-foreground">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    <h4 className="font-semibold">Ringkasan Pembayaran</h4>
                  </div>
                </div>

                <div className="p-5 space-y-4 bg-gradient-to-br from-background to-muted">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-800 text-lg">
                      {formatRupiah(subTotal)}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Percent className="h-4 w-4 text-orange-600" />
                        Diskon
                      </Label>
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        {diskon}%
                      </Badge>
                    </div>
                    <Input
                      type="text"
                      value={diskon}
                      onChange={(e) => setDiskon(Number(e.target.value))}
                      placeholder="0"
                      min={0}
                      max={100}
                      className="h-10 border-2"
                    />
                    {diskon > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">Potongan</span>
                        <span className="font-semibold text-orange-700">
                          - {formatRupiah(totalDiskon)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Tax Toggle */}
                  <div className="space-y-3 p-3 bg-gradient-to-br from-primary-foreground/10 to-primary-foreground/20 rounded-lg border border-primary-foreground/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary-foreground" />
                        Pajak 11%
                      </Label>
                      <Switch
                        checked={pajakEnabled}
                        onCheckedChange={setPajakEnabled}
                      />
                    </div>
                    {pajakEnabled && (
                      <div className="flex justify-between text-sm pt-2 border-t border-primary-foreground/30">
                        <span className="text-primary-foreground">
                          Nilai Pajak
                        </span>
                        <span className="font-semibold text-primary-foreground/90">
                          + {formatRupiah(totalPajak)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Total */}
                  <div className="bg-gradient-to-br from-primary to-yellow-500 p-5 rounded-xl text-primary-foreground shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-yellow-100 text-sm font-medium">
                        Total Pembayaran
                      </span>
                    </div>
                    <div className="text-3xl font-bold tracking-tight">
                      {formatRupiah(total)}
                    </div>
                    {items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-yellow-400/30 text-yellow-100 text-xs">
                        {items.length} item ·{" "}
                        {items.reduce((sum, item) => sum + item.qty, 0)} unit
                        total
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                    {status === "Lunas" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          Pembayaran Lunas
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">
                          Belum Lunas
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => setShowPreview(true)}
                  disabled={isLoading || !pelangganId || items.length === 0}
                  className="w-full h-12 bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-400 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      {editingPenjualan ? "Perbarui" : "Proses"} Transaksi
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="w-full h-11 border-2"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview Transaksi</DialogTitle>
            <DialogDescription>
              Harap periksa kembali detail transaksi sebelum melanjutkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pelanggan</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <span className="font-semibold">Nama:</span>{" "}
                  {selectedPelanggan?.namaPelanggan} (
                  {selectedPelanggan?.kodePelanggan || "N/A"})
                </p>
                <p>
                  <span className="font-semibold">Toko:</span>{" "}
                  {selectedPelanggan?.namaToko}
                </p>
                <p>
                  <span className="font-semibold">Alamat:</span>{" "}
                  {selectedPelanggan?.alamat}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Detail Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => {
                      const selectedSupplierProduk = supplierProdukList.find(
                        (sp) => sp.id === item.supplierProdukId,
                      );
                      const selectedProduk = produkList.find(
                        (p) => p.id === selectedSupplierProduk?.produkId,
                      );
                      return (
                        <TableRow key={i}>
                          <TableCell>{selectedProduk?.nama || "N/A"}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{formatRupiah(item.harga)}</TableCell>
                          <TableCell>{formatRupiah(item.subtotal)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">
                      Metode Pembayaran
                    </span>
                    <span className="font-semibold text-slate-800 text-lg">
                      {metodePembayaran || "Belum dipilih"}
                    </span>
                  </div>
                  {metodePembayaran === "Transfer" && (
                    <div className="space-y-2 mt-3 pt-3 border-t">
                      <p className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-500">
                          Nama Bank:
                        </span>
                        <span>{namaBank}</span>
                      </p>
                      <p className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-500">
                          Atas Nama:
                        </span>
                        <span>{namaPemilikRekening}</span>
                      </p>
                      <p className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-500">
                          No. Rekening:
                        </span>
                        <span>{nomorRekening}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatRupiah(subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diskon ({diskon}%)</span>
                    <span className="text-red-500">
                      -{formatRupiah(totalDiskon)}
                    </span>
                  </div>
                  {pajakEnabled && (
                    <div className="flex justify-between">
                      <span>Pajak (11%)</span>
                      <span>{formatRupiah(totalPajak)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Akhir</span>
                    <span>{formatRupiah(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button onClick={submit} disabled={isLoading}>
              {isLoading ? "Memproses..." : "Lanjutkan Proses"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TambahPenjualanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TambahPenjualanForm />
    </Suspense>
  );
}
