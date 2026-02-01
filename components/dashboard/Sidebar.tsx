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
      <aside className="w-64 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200">
        <div className="p-6">
          <div className="h-8 bg-slate-200 rounded-md animate-pulse"></div>
        </div>
        <nav className="space-y-2 px-3">
          <div className="px-3 py-2 text-sm text-slate-500">Memuat menu...</div>
        </nav>
      </aside>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        .menu-item-enter {
          animation: slideIn 0.3s ease-out;
        }

        .sidebar-gradient {
          background: linear-gradient(180deg, #ffffff 0%, #fefbf5 100%);
        }

        .menu-shadow {
          box-shadow: 0 2px 8px rgba(16, 40, 83, 0.1);
        }

        .menu-active-shadow {
          box-shadow: 0 4px 12px rgba(16, 40, 83, 0.15);
        }

        // .floating-logo {
        //   animation: float 3s ease-in-out infinite;
        // }

        .glow-pulse {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <aside className="w-64 sidebar-gradient border-r border-slate-200 flex flex-col">
        {/* Logo Section with Matching Navbar Style */}
        <div className="relative overflow-hidden border-b border-white/20">
          {/* Background Gradient matching navbar */}
          {/* <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(16, 40, 83, 0.98) 0%, rgba(254, 195, 53, 0.95) 100%)",
            }}
          /> */}

          {/* Decorative Blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 glow-pulse" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-900/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 glow-pulse" />

          {/* Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(254, 195, 53, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 80%, rgba(16, 40, 83, 0.3) 0%, transparent 50%)`,
            }}
          />

          {/* Content */}
          <div className="relative flex justify-center items-center py-3">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-48 h-48 bg-gradient-to-r from-yellow-400/30 to-blue-900/30 rounded-full blur-3xl glow-pulse" />
            </div>

            {/* Logo Container with Glass Effect */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl floating-logo hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={145}
                height={145}
                className="object-contain relative z-10"
              />

              {/* Shimmer Effect */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3s infinite",
                }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-3 mt-3 px-4 py-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto">
          {menusToShow.length > 0 ? (
            menusToShow.map((menu, index) => {
              // Handle nested menu structure (jika ada children)
              if ("children" in menu && (menu as any).children) {
                const isExpanded = expandedMenus.includes(menu.href);
                const isActive = pathname.startsWith(menu.href);

                return (
                  <div
                    key={menu.label}
                    className="menu-item-enter"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <button
                      onClick={() => handleMenuClick(menu.href)}
                      className={`
                        w-full flex justify-between items-center 
                        px-4 py-3 text-sm font-semibold rounded-xl
                        transition-all duration-300
                        ${
                          isActive
                            ? "bg-[#fec335] text-[#102853] menu-active-shadow"
                            : "bg-gradient-to-r from-[#fec335] to-[#ffd966] text-[#102853] menu-shadow hover:shadow-lg"
                        }
                        hover:scale-[1.02] active:scale-[0.98]
                      `}
                    >
                      <span className="font-bold tracking-wide">
                        {menu.label}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Children Menu with Smooth Transition */}
                    <div
                      className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${isExpanded ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"}
                      `}
                    >
                      <div className="space-y-1 pl-2">
                        {(menu as any).children.map(
                          (child: any, childIndex: number) => {
                            const isChildActive = pathname === child.href;

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`
                                block px-4 py-2.5 rounded-lg text-sm font-medium
                                transition-all duration-200
                                border-l-4
                                ${
                                  isChildActive
                                    ? "bg-[#102853] text-white border-[#fec335] menu-active-shadow"
                                    : "bg-white text-slate-700 border-transparent hover:border-[#fec335] hover:bg-slate-50 hover:text-[#102853] hover:translate-x-1"
                                }
                              `}
                                style={{
                                  animationDelay: `${index * 50 + childIndex * 30}ms`,
                                }}
                              >
                                {child.label}
                              </Link>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Handle menu biasa (tanpa children)
              const isActive = pathname === menu.href;

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className={`
                    block px-4 py-3 rounded-xl text-sm font-semibold
                    transition-all duration-300
                    border-l-4
                    menu-item-enter
                    ${
                      isActive
                        ? "bg-[#102853] text-white border-[#fec335] menu-active-shadow"
                        : "bg-white text-slate-700 border-transparent hover:border-[#fec335] hover:bg-gradient-to-r hover:from-slate-50 hover:to-amber-50 hover:text-[#102853] hover:translate-x-1"
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {menu.label}
                </Link>
              );
            })
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500 text-center bg-slate-50 rounded-lg border border-slate-200">
              Tidak ada menu tersedia
            </div>
          )}
        </nav>

        {/* Bottom Decoration */}
        <div className="p-3 border-t border-slate-200">
          <div
            className="h-1 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #102853 0%, #fec335 50%, #102853 100%)",
            }}
          />
        </div>
      </aside>
    </>
  );
}
