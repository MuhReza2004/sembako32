"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "../auth/LogoutButton";
import { Button } from "../ui/button";
import {
  Home,
  Package,
  ShoppingCart,
  FileText,
  Truck,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

export default function Topbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/dashboard/admin",
      icon: Home,
    },
    {
      label: "Pengiriman",
      href: "/Distributor/Pengiriman",
      icon: Truck,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return pathname === "/dashboard/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-[linear-gradient(to_bottom,#088D8F_0%,#06797E_10%,#025964_50%,#014351_100%)] border-b px-6 py-4 relative">
      {/* Center Logo */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-center">
            <h1 className="text-[50px] font-bold text-white">RPK SEMBAKO 32</h1>
            <p className="text-xl text-white font-bold">Mitra BULOG</p>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "nav" : "remove"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>
        </div>

        <LogoutButton />
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg md:hidden z-50">
          <div className="px-6 py-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
