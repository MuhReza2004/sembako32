"use client";
import * as React from "react";
import { Check, ChevronsUpDown, Plus, UserCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Pelanggan } from "@/app/types/pelanggan";

interface ComboboxPelangganProps {
  pelangganList: Pelanggan[];
  value: string;
  onChange: (value: string) => void;
  onAddNew: () => void;
}

export function ComboboxPelanggan({
  pelangganList,
  value,
  onChange,
  onAddNew,
}: ComboboxPelangganProps) {
  const [open, setOpen] = React.useState(false);

  const selectedPelanggan = pelangganList.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 border-2"
        >
          {selectedPelanggan
            ? `${selectedPelanggan.namaPelanggan} (${selectedPelanggan.kodePelanggan})`
            : "Pilih Pelanggan"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
          filter={(value, search) => {
            const p = pelangganList.find((p) => p.id === value);
            if (
              p?.namaPelanggan.toLowerCase().includes(search.toLowerCase()) ||
              p?.kodePelanggan.toLowerCase().includes(search.toLowerCase()) ||
              p?.namaToko?.toLowerCase().includes(search.toLowerCase())
            ) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput placeholder="Cari pelanggan (nama, kode, atau toko)..." />
          <CommandList>
            <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {pelangganList.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id || ""}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === p.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-semibold">
                        {p.namaPelanggan} ({p.kodePelanggan})
                      </div>
                      <div className="text-xs text-gray-500">{p.namaToko}</div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAddNew();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pelanggan Baru
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
