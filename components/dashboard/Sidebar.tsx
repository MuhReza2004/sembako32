"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardMenus } from "@/constants/menu";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { role, loading, error } = useUserRole();
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleMenuClick = (href: string) => {
    setExpandedMenus((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href],
    );
  };

  // Timeout fallback jika loading terlalu lama
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 3000); // 3 detik timeout

      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Tentukan menu yang akan ditampilkan
  const menusToShow = useMemo(() => {
    if (role && !timeoutReached && !error) {
      // Filter menu berdasarkan role
      return dashboardMenus.filter((menu) => {
        if ("children" in menu && (menu as any).children) {
          return (menu as any).children.some((child: any) =>
            child.roles.includes(role),
          );
        }
        return menu.roles.includes(role);
      });
    } else {
      // Fallback: tampilkan menu admin jika role tidak ditemukan
      return dashboardMenus.filter((menu) => {
        if ("children" in menu && (menu as any).children) {
          return (menu as any).children.some((child: any) =>
            child.roles.includes("admin"),
          );
        }
        return menu.roles.includes("admin");
      });
    }
  }, [role, timeoutReached, error]);

  useEffect(() => {
    const parentMenu = menusToShow.find(
      (menu) => "children" in menu && pathname.startsWith(menu.href),
    );
    if (parentMenu) {
      setExpandedMenus([parentMenu.href]);
    }
  }, [pathname, menusToShow]);

  // Jika loading dan belum timeout, tampilkan loading state
  if (loading && !timeoutReached) {
    return (
      <aside className="w-64 bg-white border-r">
        <div className="p-4 font-bold text-lg">PT. Sumber Alam Pasangkayu</div>
        <nav className="space-y-1 px-2">
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Memuat menu...
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      {/* Centered Logo Section */}
      <div className="flex justify-center items-center py-8 border-b">
        <Image
          src="/logo.svg"
          alt="Logo"
          width={130}
          height={135}
          className="object-contain"
        />
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-yellow-600 bg-yellow-50 border-b">
          {error}
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 px-2 py-2 overflow-y-auto">
        {menusToShow.length > 0 ? (
          menusToShow.map((menu) => {
            // Handle nested menu structure (jika ada children)
            if ("children" in menu && (menu as any).children) {
              const isExpanded = expandedMenus.includes(menu.href);
              return (
                <div key={menu.label}>
                  <button
                    onClick={() => handleMenuClick(menu.href)}
                    className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium text-left bg-[#ffd9a1] rounded-md"
                  >
                    <span
                      className={
                        pathname.startsWith(menu.href)
                          ? "text-black "
                          : "bg-blue-600text-gray-700"
                      }
                    >
                      {menu.label}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 mt-1">
                      {(menu as any).children.map((child: any) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-3 py-2 rounded-md text-sm ml-4 ${
                            pathname === child.href
                              ? " bg-[#099696] text-white"
                              : "hover:bg-[#ff6a00] hover:text-white"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Handle menu biasa (tanpa children)
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`block px-3 py-2 rounded-md text-sm ${
                  pathname === menu.href
                    ? "bg-[#099696] text-white"
                    : "hover:bg-[#ff6a00] hover:text-white"
                }`}
              >
                {menu.label}
              </Link>
            );
          })
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Tidak ada menu tersedia
          </div>
        )}
      </nav>
    </aside>
  );
}
