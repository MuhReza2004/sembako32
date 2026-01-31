import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Produk } from "../types/produk";
import { Pelanggan } from "../types/pelanggan";
import { Supplier } from "../types/suplyer";
import { Penjualan } from "../types/penjualan";
import { Pembelian } from "../types/pembelian";

export interface DashboardData {
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalSales: number;
  totalPurchases: number;
  totalRevenue: number;
  totalExpenses: number;
  lowStockItems: LowStockItem[];
  recentSales: RecentTransaction[];
  recentPurchases: RecentTransaction[];
}

export interface LowStockItem {
  id: string;
  nama: string;
  kode: string;
  currentStock: number;
  minStock: number;
}

export interface RecentTransaction {
  id: string;
  kode: string;
  tanggal: Date;
  total: number;
  status: string;
  pelanggan?: string;
  supplier?: string;
}

export const getDashboardData = async (dateRange?: {
  startDate: Date;
  endDate: Date;
}): Promise<DashboardData> => {
  try {
    const [
      products,
      customers,
      suppliers,
      sales,
      purchases,
      revenue,
      expenses,
      lowStockItems,
      recentSales,
      recentPurchases,
    ] = await Promise.all([
      getTotalProducts(),
      getTotalCustomers(),
      getTotalSuppliers(),
      getTotalSales(dateRange),
      getTotalPurchases(dateRange),
      getTotalRevenue(dateRange),
      getTotalExpenses(dateRange),
      getLowStockItems(),
      getRecentSales(dateRange),
      getRecentPurchases(dateRange),
    ]);

    return {
      totalProducts: products,
      totalCustomers: customers,
      totalSuppliers: suppliers,
      totalSales: sales,
      totalPurchases: purchases,
      totalRevenue: revenue,
      totalExpenses: expenses,
      lowStockItems,
      recentSales,
      recentPurchases,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};

const getTotalProducts = async (): Promise<number> => {
  const q = query(collection(db, "produk"));
  const snap = await getDocs(q);
  return snap.size;
};

const getTotalCustomers = async (): Promise<number> => {
  const q = query(collection(db, "pelanggan"));
  const snap = await getDocs(q);
  return snap.size;
};

const getTotalSuppliers = async (): Promise<number> => {
  const q = query(collection(db, "suppliers"));
  const snap = await getDocs(q);
  return snap.size;
};

const getTotalSales = async (dateRange?: {
  startDate: Date;
  endDate: Date;
}): Promise<number> => {
  let q = query(collection(db, "penjualan"));
  if (dateRange) {
    q = query(
      q,
      where("createdAt", ">=", dateRange.startDate),
      where("createdAt", "<=", dateRange.endDate),
    );
  }
  const snap = await getDocs(q);
  return snap.size;
};

const getTotalPurchases = async (dateRange?: {
  startDate: Date;
  endDate: Date;
}): Promise<number> => {
  let q = query(collection(db, "pembelian"));
  if (dateRange) {
    q = query(
      q,
      where("createdAt", ">=", dateRange.startDate),
      where("createdAt", "<=", dateRange.endDate),
    );
  }
  const snap = await getDocs(q);
  return snap.size;
};

const getTotalRevenue = async (dateRange?: {
  startDate: Date;
  endDate: Date;
}): Promise<number> => {
  let q = query(collection(db, "penjualan"));
  if (dateRange) {
    q = query(
      q,
      where("createdAt", ">=", dateRange.startDate),
      where("createdAt", "<=", dateRange.endDate),
    );
  }
  const snap = await getDocs(q);

  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data() as Penjualan;
    if (data.status !== "Batal") {
      total += data.total || 0;
    }
  });

  return total;
};

const getTotalExpenses = async (dateRange?: {
  startDate: Date;
  endDate: Date;
}): Promise<number> => {
  let q = query(collection(db, "pembelian"));
  if (dateRange) {
    q = query(
      q,
      where("createdAt", ">=", dateRange.startDate),
      where("createdAt", "<=", dateRange.endDate),
    );
  }
  const snap = await getDocs(q);

  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data() as Pembelian;
    total += data.total || 0;
  });

  return total;
};

const getLowStockItems = async (): Promise<LowStockItem[]> => {
  const produkQuery = query(collection(db, "produk"));
  const produkSnap = await getDocs(produkQuery);
  const supplierProdukQuery = query(collection(db, "supplier_produk"));
  const supplierProdukSnap = await getDocs(supplierProdukQuery);

  const supplierProdukMap = new Map<string, any[]>();
  supplierProdukSnap.forEach((doc) => {
    const data = doc.data();
    const produkId = data.produkId;
    if (!supplierProdukMap.has(produkId)) {
      supplierProdukMap.set(produkId, []);
    }
    supplierProdukMap.get(produkId)!.push(data);
  });

  const lowStockItems: LowStockItem[] = [];
  produkSnap.forEach((doc) => {
    const data = doc.data() as Produk;
    const relatedSupplierProduk = supplierProdukMap.get(doc.id) || [];
    const currentStock = relatedSupplierProduk.reduce(
      (sum, sp) => sum + (sp.stok || 0),
      0,
    );
    const minStock = 10;

    if (currentStock < minStock) {
      lowStockItems.push({
        id: doc.id,
        nama: data.nama,
        kode: data.kode,
        currentStock,
        minStock,
      });
    }
  });

  return lowStockItems
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 5);
};

const getRecentSales = async (dateRange?: {
  startDate: Date;
  endDate: Date;
}): Promise<RecentTransaction[]> => {
  let q;
  if (dateRange) {
    q = query(
      collection(db, "penjualan"),
      where("createdAt", ">=", dateRange.startDate),
      where("createdAt", "<=", dateRange.endDate),
      orderBy("createdAt", "desc"),
    );
  } else {
    q = query(
      collection(db, "penjualan"),
      orderBy("createdAt", "desc"),
      limit(3),
    );
  }
  const snap = await getDocs(q);

  const recentSales: RecentTransaction[] = [];
  for (const saleDoc of snap.docs) {
    const data = saleDoc.data() as Penjualan;
    let pelangganName = "Unknown";

    if (data.pelangganId) {
      try {
        const pelangganDoc = await getDoc(
          doc(db, "pelanggan", data.pelangganId),
        );
        if (pelangganDoc.exists()) {
          const pelangganData = pelangganDoc.data() as Pelanggan;
          pelangganName = pelangganData.namaToko || pelangganData.namaPelanggan;
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      }
    }

    recentSales.push({
      id: saleDoc.id,
      kode: data.noInvoice || `SL-${saleDoc.id.slice(-6)}`,
      tanggal: data.createdAt.toDate(),
      total: data.total || 0,
      status: data.status || "Belum Lunas",
      pelanggan: pelangganName,
    });
  }
  return recentSales;
};

const getRecentPurchases = async (dateRange?: {
  startDate: Date;
  endDate: Date;
}): Promise<RecentTransaction[]> => {
  let q;
  if (dateRange) {
    q = query(
      collection(db, "pembelian"),
      where("createdAt", ">=", dateRange.startDate),
      where("createdAt", "<=", dateRange.endDate),
      orderBy("createdAt", "desc"),
    );
  } else {
    q = query(
      collection(db, "pembelian"),
      orderBy("createdAt", "desc"),
      limit(3),
    );
  }
  const snap = await getDocs(q);

  const recentPurchases: RecentTransaction[] = [];
  for (const purchaseDoc of snap.docs) {
    const data = purchaseDoc.data() as Pembelian;
    let supplierName = "Unknown";

    if (data.supplierId) {
      try {
        const supplierDoc = await getDoc(doc(db, "suppliers", data.supplierId));
        if (supplierDoc.exists()) {
          const supplierData = supplierDoc.data() as Supplier;
          supplierName = supplierData.nama;
        }
      } catch (error) {
        console.error("Error fetching supplier:", error);
      }
    }

    recentPurchases.push({
      id: purchaseDoc.id,
      kode: data.invoice || `PB-${purchaseDoc.id.slice(-6)}`,
      tanggal: data.createdAt.toDate(),
      total: data.total || 0,
      status: data.status || "Belum Lunas",
      supplier: supplierName,
    });
  }
  return recentPurchases;
};
