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
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return pathname === "/dashboard/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }


          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }

        .fade-in-down {
          animation: fadeInDown 0.5s ease-out;
        }

        .pattern-bg {
          background-image:
            radial-gradient(
              circle at 20% 50%,
              rgba(254, 195, 53, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 80%,
              rgba(16, 40, 83, 0.1) 0%,
              transparent 50%
            );
        }

        .glass-effect {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .nav-glow {
          box-shadow: 0 0 20px rgba(254, 195, 53, 0.3);
        }
      `}</style>

      <header className="relative overflow-hidden">
        {/* Background with Gradient */}
        <div
          className="absolute inset-0 pattern-bg"
          style={{
            background:
              "linear-gradient(135deg, rgba(16, 40, 83, 0.98) 0%, rgba(254, 195, 53, 0.95) 100%)",
          }}
        />

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative border-b border-white/20 px-6 py-6">
          {/* Center Logo */}
          <div className="flex justify-center mb-6">
            <div className="text-center floating">
              <div className="inline-block relative">
                {/* Glow effect behind text */}
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-yellow-400/50 to-blue-900/50 rounded-lg" />

                <div className="relative">
                  <h1
                    className="text-5xl md:text-6xl font-black tracking-tight mb-1"
                    style={{
                      background:
                        "linear-gradient(135deg, #fec335 0%, #fff9e6 50%, #fec335 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      textShadow: "0 0 30px rgba(254, 195, 53, 0.5)",
                    }}
                  >
                    SEMBAKO 32
                  </h1>
                  <div className="shimmer-effect absolute inset-0 pointer-events-none" />
                </div>
              </div>

              <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-effect">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <p className="text-sm md:text-lg font-bold text-white tracking-wide">
                  Mitra BULOG
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className="group relative"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Button
                        variant={isActive(item.href) ? "nav" : "remove"}
                        size="sm"
                        className={`
                          flex items-center gap-2 px-6 py-2 rounded-xl
                          transition-all duration-300 transform
                          hover:scale-105 hover:-translate-y-1
                          ${
                            isActive(item.href)
                              ? "bg-white text-[#102853] shadow-lg shadow-yellow-400/30 font-semibold"
                              : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20"
                          }
                        `}
                      >
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:rotate-12`}
                        />
                        {item.label}
                      </Button>

                      {/* Hover glow effect */}
                      {!isActive(item.href) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/20 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-xl -z-10" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Logout Button */}
            <div className="ml-auto">
              <LogoutButton />
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 fade-in-down">
              <div className="glass-effect rounded-2xl p-4 space-y-2">
                {navigationItems.map((item, index) => {
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
                        className={`
                          w-full justify-start flex items-center gap-3 px-4 py-3 rounded-xl
                          transition-all duration-300
                          ${
                            isActive(item.href)
                              ? "bg-white text-[#102853] shadow-lg font-semibold"
                              : "text-white hover:bg-white/10"
                          }
                        `}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
