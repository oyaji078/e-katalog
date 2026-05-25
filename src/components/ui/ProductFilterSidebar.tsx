"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function ProductFilterSidebar() {
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    priceRange: "",
    stockStatus: "",
    promo: false,
    voucher: false,
    retailPrice: false,
  });

  // Mock data for demonstration
  const categories = [
    { label: "All Categories", value: "" },
    { label: "Laptop", value: "laptop" },
    { label: "Monitor", value: "monitor" },
    { label: "Keyboard", value: "keyboard" },
    { label: "Mouse", value: "mouse" },
    { label: "Aksesoris", value: "aksesoris" },
  ];

  const brands = [
    { label: "All Brands", value: "" },
    { label: "ASUS", value: "asus" },
    { label: "Logitech", value: "logitech" },
    { label: "LG", value: "lg" },
    { label: "Dell", value: "dell" },
    { label: "Samsung", value: "samsung" },
    { label: "Lenovo", value: "lenovo" },
  ];

  const priceRanges = [
    { label: "All Price Ranges", value: "" },
    { label: "Under 1 Juta", value: "0-1000000" },
    { label: "1 Juta - 5 Juta", value: "1000000-5000000" },
    { label: "5 Juta - 10 Juta", value: "5000000-10000000" },
    { label: "Above 10 Juta", value: "10000000-100000000" },
  ];

  const stockStatuses = [
    { label: "All Stock Status", value: "" },
    { label: "Ready Stock", value: "READY" },
    { label: "Low Stock", value: "LOW_STOCK" },
    { label: "Out of Stock", value: "OUT_OF_STOCK" },
    { label: "Preorder", value: "PREORDER" },
  ];

  const applyFilters = () => {
    // In a real implementation, this would update the product grid based on filters
    alert("Filters applied: " + JSON.stringify(filters));
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      brand: "",
      priceRange: "",
      stockStatus: "",
      promo: false,
      voucher: false,
      retailPrice: false,
    });
    // In a real implementation, this would reset the product grid
    alert("Filters reset");
  };

  return (
    <aside className="space-y-6">
      <div className="space-y-4">
        <h2 className="font-semibold text-brand-text">Filter Produk</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold">Kategori</label>
            <div className="relative">
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-brand-border bg-white text-sm"
                onClick={() => {
                  // In a real implementation, this would toggle a dropdown
                  alert("Category dropdown would open");
                }}
              >
                <span>{categories.find(cat => cat.value === filters.category)?.label || "All Categories"}</span>
                <ChevronDown className="size-4" />
              </button>
              {/* Dropdown would go here in real implementation */}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold">Brand</label>
            <div className="relative">
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-brand-border bg-white text-sm"
                onClick={() => {
                  // In a real implementation, this would toggle a dropdown
                  alert("Brand dropdown would open");
                }}
              >
                <span>{brands.find(b => b.value === filters.brand)?.label || "All Brands"}</span>
                <ChevronDown className="size-4" />
              </button>
              {/* Dropdown would go here in real implementation */}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold">Harga</label>
            <div className="relative">
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-brand-border bg-white text-sm"
                onClick={() => {
                  // In a real implementation, this would toggle a dropdown
                  alert("Price range dropdown would open");
                }}
              >
                <span>{priceRanges.find(p => p.value === filters.priceRange)?.label || "All Price Ranges"}</span>
                <ChevronDown className="size-4" />
              </button>
              {/* Dropdown would go here in real implementation */}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold">Stok</label>
            <div className="relative">
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-brand-border bg-white text-sm"
                onClick={() => {
                  // In a real implementation, this would toggle a dropdown
                  alert("Stock status dropdown would open");
                }}
              >
                <span>{stockStatuses.find(s => s.value === filters.stockStatus)?.label || "All Stock Status"}</span>
                <ChevronDown className="size-4" />
              </button>
              {/* Dropdown would go here in real implementation */}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h2 className="font-semibold text-brand-text">Opsi Tambahan</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.promo}
              onChange={(e) => setFilters(prev => ({ ...prev, promo: e.target.checked }))}
              className="h-4 w-4 text-brand-primary"
            />
            <span className="text-sm">Produk Promo</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.voucher}
              onChange={(e) => setFilters(prev => ({ ...prev, voucher: e.target.checked }))}
              className="h-4 w-4 text-brand-accent"
            />
            <span className="text-sm">Memiliki Voucher</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.retailPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, retailPrice: e.target.checked }))}
              className="h-4 w-4 text-brand-secondary"
            />
            <span className="text-sm">Harga Retail Tersedia</span>
          </label>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={applyFilters}
          className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white flex items-center justify-center"
        >
          Terapkan Filter
        </button>
        <button
          onClick={resetFilters}
          className="mt-2 w-full rounded-xl border border-brand-primary px-4 py-3 text-sm font-semibold text-brand-primary"
        >
          Reset Filter
        </button>
      </div>
    </aside>
  );
}