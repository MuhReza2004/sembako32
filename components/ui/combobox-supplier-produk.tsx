"use client";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { SupplierProduk } from "@/app/types/suplyer";
import { Produk } from "@/app/types/produk";

interface ComboboxSupplierProdukProps {
  supplierProdukList: SupplierProduk[];
  produkList: Produk[];
  value: string;
  onChange: (value: string) => void;
}

export function ComboboxSupplierProduk({
  supplierProdukList,
  produkList,
  value,
  onChange,
}: ComboboxSupplierProdukProps) {
  const [open, setOpen] = React.useState(false);

  const selectedSupplierProduk = supplierProdukList.find(
    (sp) => sp.id === value,
  );
  const selectedProduk = produkList.find(
    (p) => p.id === selectedSupplierProduk?.produkId,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 border-2"
        >
          {value && selectedProduk ? selectedProduk.nama : "Pilih Produk"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
          filter={(value, search) => {
            const sp = supplierProdukList.find((sp) => sp.id === value);
            const p = produkList.find((p) => p.id === sp?.produkId);
            if (p?.nama.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Cari produk..." />
          <CommandList>
            <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {supplierProdukList.map((sp) => {
                const produk = produkList.find((p) => p.id === sp.produkId);
                return (
                  <CommandItem
                    key={sp.id}
                    value={sp.id}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                    disabled={sp.stok === 0}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === sp.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex justify-between items-center w-full">
                      <span>{produk?.nama || "Produk tidak ditemukan"}</span>
                      <Badge
                        variant={
                          sp.stok > 10
                            ? "default"
                            : sp.stok > 0
                              ? "outline"
                              : "destructive"
                        }
                        className="ml-2"
                      >
                        Stok: {sp.stok}
                      </Badge>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
