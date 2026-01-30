"use client";

import React, { useEffect, useState } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { getDashboardData } from "@/app/services/dashboard.service";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";

interface DashboardData {
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalSales: number;
  totalPurchases: number;
  totalRevenue: number;
  totalExpenses: number;
  lowStockItems: any[];
  recentSales: any[];
  recentPurchases: any[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up real-time listeners for dashboard data
    const setupRealtimeListeners = async () => {
      try {
        setIsLoading(true);

        // Listen to products collection
        const productsQuery = query(collection(db, "produk"));
        const unsubProducts = onSnapshot(productsQuery, () => {
          updateDashboardData();
        });

        // Listen to customers collection
        const customersQuery = query(collection(db, "pelanggan"));
        const unsubCustomers = onSnapshot(customersQuery, () => {
          updateDashboardData();
        });

        // Listen to suppliers collection
        const suppliersQuery = query(collection(db, "suppliers"));
        const unsubSuppliers = onSnapshot(suppliersQuery, () => {
          updateDashboardData();
        });

        // Listen to sales collection
        const salesQuery = query(collection(db, "penjualan"));
        const unsubSales = onSnapshot(salesQuery, () => {
          updateDashboardData();
        });

        // Listen to purchases collection
        const purchasesQuery = query(collection(db, "pembelian"));
        const unsubPurchases = onSnapshot(purchasesQuery, () => {
          updateDashboardData();
        });

        // Listen to supplier products for stock changes
        const supplierProductsQuery = query(collection(db, "supplier_produk"));
        const unsubSupplierProducts = onSnapshot(supplierProductsQuery, () => {
          console.log(
            "Supplier products collection changed, updating dashboard",
          );
          updateDashboardData();
        });

        // Listen to purchase details for stock changes
        const purchaseDetailsQuery = query(collection(db, "pembelian_detail"));
        const unsubPurchaseDetails = onSnapshot(purchaseDetailsQuery, () => {
          console.log(
            "Purchase details collection changed, updating dashboard",
          );
          updateDashboardData();
        });

        // Listen to sales details for stock changes
        const salesDetailsQuery = query(collection(db, "penjualan_detail"));
        const unsubSalesDetails = onSnapshot(salesDetailsQuery, () => {
          console.log("Sales details collection changed, updating dashboard");
          updateDashboardData();
        });

        // Initial data load
        await updateDashboardData();

        // Cleanup function
        return () => {
          unsubProducts();
          unsubCustomers();
          unsubSuppliers();
          unsubSales();
          unsubPurchases();
          unsubSupplierProducts();
          unsubPurchaseDetails();
          unsubSalesDetails();
        };
      } catch (err: any) {
        console.error("Error setting up dashboard listeners:", err);
        setError("Gagal memuat data dashboard");
        setIsLoading(false);
      }
    };

    const updateDashboardData = async () => {
      try {
        console.log("Updating dashboard data...");
        const dashboardData = await getDashboardData();
        console.log("Dashboard data received:", dashboardData);
        console.log("Low stock items:", dashboardData.lowStockItems);
        setData(dashboardData);
        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        console.error("Error updating dashboard data:", err);
        setError("Gagal memperbarui data dashboard");
        setIsLoading(false);
      }
    };

    const cleanup = setupRealtimeListeners();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, []);

  const handleViewInventory = () => {
    router.push("/dashboard/admin/inventory");
  };

  const handleViewSales = () => {
    router.push("/dashboard/admin/transaksi/penjualan");
  };

  const handleViewPurchases = () => {
    router.push("/dashboard/admin/transaksi/pembelian");
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Dashboard Admin</h2>
          <p>Selamat datang, Admin Gudang 👋</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Dashboard Admin</h2>
          <p className="text-muted-foreground">
            Selamat datang, Admin Gudang 👋
          </p>
        </div>
        <button
          onClick={() => {
            console.log("Manual refresh clicked");
            setIsLoading(true);
            updateDashboardData();
          }}
          className="px-4 py-2 bg-[#099696] text-white rounded hover:bg-[#ff6a00]"
        >
          Refresh Data
        </button>
      </div>

      <SummaryCards data={data} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockAlerts
          items={data?.lowStockItems || []}
          isLoading={isLoading}
          onViewInventory={handleViewInventory}
        />

        <RecentTransactions
          sales={data?.recentSales || []}
          purchases={data?.recentPurchases || []}
          isLoading={isLoading}
          onViewSales={handleViewSales}
          onViewPurchases={handleViewPurchases}
        />
      </div>
    </div>
  );
}
