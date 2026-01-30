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

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Get total counts
    const [products, customers, suppliers, sales, purchases] =
      await Promise.all([
        getTotalProducts(),
        getTotalCustomers(),
        getTotalSuppliers(),
        getTotalSales(),
        getTotalPurchases(),
      ]);

    // Get financial data
    const [revenue, expenses] = await Promise.all([
      getTotalRevenue(),
      getTotalExpenses(),
    ]);

    // Get low stock items
    const lowStockItems = await getLowStockItems();

    // Get recent transactions
    const [recentSales, recentPurchases] = await Promise.all([
      getRecentSales(),
      getRecentPurchases(),
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

const getTotalSales = async (): Promise<number> => {
  const q = query(collection(db, "penjualan"));
  const snap = await getDocs(q);
  return snap.size;
};

const getTotalPurchases = async (): Promise<number> => {
  const q = query(collection(db, "pembelian"));
  const snap = await getDocs(q);
  return snap.size;
};

const getTotalRevenue = async (): Promise<number> => {
  const q = query(collection(db, "penjualan"));
  const snap = await getDocs(q);

  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data() as Penjualan;
    total += data.total || 0;
  });

  return total;
};

const getTotalExpenses = async (): Promise<number> => {
  const q = query(collection(db, "pembelian"));
  const snap = await getDocs(q);

  let total = 0;
  snap.forEach((doc) => {
    const data = doc.data() as Pembelian;
    total += data.total || 0;
  });

  return total;
};

const getLowStockItems = async (): Promise<LowStockItem[]> => {
  // Get all products
  const produkQuery = query(collection(db, "produk"));
  const produkSnap = await getDocs(produkQuery);

  // Get all supplier products to calculate current stock
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

    // Calculate current stock as sum of all supplier product stocks for this product
    const relatedSupplierProduk = supplierProdukMap.get(doc.id) || [];
    const currentStock = relatedSupplierProduk.reduce(
      (sum, sp) => sum + (sp.stok || 0),
      0,
    );

    // Assume minimum stock is 10 (this could be configurable per product)
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

  // Sort by current stock (lowest first) and return top 5
  return lowStockItems
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 5);
};

const getRecentSales = async (): Promise<RecentTransaction[]> => {
  const q = query(
    collection(db, "penjualan"),
    orderBy("createdAt", "desc"),
    limit(3),
  );
  const snap = await getDocs(q);

  const recentSales: RecentTransaction[] = [];
  for (const saleDoc of snap.docs) {
    const data = saleDoc.data() as Penjualan;
    console.log("Sales data createdAt:", data.createdAt, typeof data.createdAt);
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

    let parsedDate: Date;
    try {
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          parsedDate = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          parsedDate = data.createdAt;
        } else {
          parsedDate = new Date(data.createdAt);
        }
      } else {
        parsedDate = new Date();
      }
      console.log("Parsed date:", parsedDate);
    } catch (error) {
      console.error("Date parsing error:", error);
      parsedDate = new Date();
    }

    recentSales.push({
      id: saleDoc.id,
      kode: data.noInvoice || `SL-${saleDoc.id.slice(-6)}`,
      tanggal: parsedDate,
      total: data.total || 0,
      status: data.status || "Belum Lunas",
      pelanggan: pelangganName,
    });
  }

  return recentSales;
};

const getRecentPurchases = async (): Promise<RecentTransaction[]> => {
  const q = query(
    collection(db, "pembelian"),
    orderBy("createdAt", "desc"),
    limit(3),
  );
  const snap = await getDocs(q);

  const recentPurchases: RecentTransaction[] = [];
  for (const purchaseDoc of snap.docs) {
    const data = purchaseDoc.data() as Pembelian;
    console.log(
      "Purchase data createdAt:",
      data.createdAt,
      typeof data.createdAt,
    );
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

    let parsedDate: Date;
    try {
      if (
        data.createdAt &&
        typeof data.createdAt === "object" &&
        !Array.isArray(data.createdAt) &&
        Object.keys(data.createdAt).length === 0
      ) {
        // Handle empty object case
        console.warn(
          "Empty object found for createdAt in purchase:",
          data.createdAt,
        );
        parsedDate = new Date();
      } else if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          parsedDate = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          parsedDate = data.createdAt;
        } else {
          parsedDate = new Date(data.createdAt);
        }
      } else {
        parsedDate = new Date();
      }

      // Validate the parsed date
      if (isNaN(parsedDate.getTime())) {
        console.warn("Invalid date parsed for purchase, using current date");
        parsedDate = new Date();
      }

      console.log("Parsed purchase date:", parsedDate);
    } catch (error) {
      console.error("Date parsing error for purchase:", error);
      parsedDate = new Date();
    }

    recentPurchases.push({
      id: purchaseDoc.id,
      kode: data.invoice || `PB-${purchaseDoc.id.slice(-6)}`,
      tanggal: parsedDate,
      total: data.total || 0,
      status: data.status || "Belum Lunas",
      supplier: supplierName,
    });
  }

  return recentPurchases;
};
