"use client";

import React, { useEffect, useState, useRef } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { getDashboardData } from "@/app/services/dashboard.service";
import { useRouter } from "next/navigation";
import { collection, query, onSnapshot } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

const getDateRange = (
  filter: string,
): { startDate: Date | null; endDate: Date | null } => {
  const now = new Date();
  let startDate: Date | null = new Date(now);
  let endDate: Date | null = new Date(now);

  switch (filter) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      const firstDayOfWeek =
        now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
      startDate = new Date(now.setDate(firstDayOfWeek));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default: // "all" or "custom"
      startDate = null;
      endDate = null;
      break;
  }
  return { startDate, endDate };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filterConfigRef = useRef({ dateFilter, startDate, endDate });
  filterConfigRef.current = { dateFilter, startDate, endDate };

  const updateDashboardData = async () => {
    try {
      const { dateFilter, startDate, endDate } = filterConfigRef.current;
      let dateRange;

      if (dateFilter === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateRange = { startDate: start, endDate: end };
      } else {
        dateRange = getDateRange(dateFilter);
      }

      const dashboardData = await getDashboardData(dateRange);
      setData(dashboardData);
      setError(null);
    } catch (err: any) {
      console.error("Error updating dashboard data:", err);
      setError("Gagal memperbarui data dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    updateDashboardData();
  }, [dateFilter, startDate, endDate]);

  useEffect(() => {
    const listeners = [
      onSnapshot(query(collection(db, "penjualan")), updateDashboardData),
      onSnapshot(query(collection(db, "pembelian")), updateDashboardData),
      onSnapshot(query(collection(db, "produk")), updateDashboardData),
      onSnapshot(query(collection(db, "pelanggan")), updateDashboardData),
      onSnapshot(query(collection(db, "suppliers")), updateDashboardData),
      onSnapshot(query(collection(db, "supplier_produk")), updateDashboardData),
    ];
    return () => listeners.forEach((unsub) => unsub());
  }, []);

  const handleViewInventory = () => router.push("/dashboard/admin/inventory");
  const handleViewSales = () =>
    router.push("/dashboard/admin/transaksi/penjualan");
  const handleViewPurchases = () =>
    router.push("/dashboard/admin/transaksi/pembelian");

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
        <div className="flex items-center gap-4">
          <Select onValueChange={setDateFilter} value={dateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu </SelectItem>
              <SelectItem value="month">Bulan </SelectItem>
              <SelectItem value="year">Tahun</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => {
              setIsLoading(true);
              updateDashboardData();
            }}
            className="px-4 py-2 bg-[#099696] text-white rounded hover:bg-[#ff6a00]"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {dateFilter === "custom" && (
        <Card>
          <CardContent className="pt-6">
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
      )}

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
