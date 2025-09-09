"use client";

import React, { useMemo, useState } from "react";
import { X, Search, Filter, Calendar, LayoutDashboard } from "lucide-react";
import ProductCard from "./product_card";
import { useProductsList } from "@/hooks/use_products_list";

// =====================
// UI helpers
// =====================
const cn = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

// =====================
// Closeable Chip
// =====================
function ProductChip({
  name,
  onClose,
  active,
  onClick,
}: {
  name: string;
  onClose: () => void;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative px-3 py-1.5 rounded-xl text-xs border transition cursor-pointer select-none",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      )}
      onClick={onClick}
    >
      {name}
      <button
        aria-label="Remove"
        className={cn(
          "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border text-[10px]",
          active ? "bg-white/90 text-slate-700 border-white/90" : "bg-white text-slate-500 border-slate-200",
          "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function DashboardApp() {
  // Selected product ids
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const { products: allProducts } = useProductsList();
  const idToName = useMemo(() => Object.fromEntries(allProducts.map(p => [p.id, p.name])), [allProducts]);

  const addByInput = () => {
    if (!search.trim()) return;
    // match by id or by name, also supports "Name (0000001)" format
    const byId = allProducts.find(p => p.id === search.trim());
    const byName = allProducts.find(p => p.name.toLowerCase() === search.trim().toLowerCase());
    const viaParen = /\((\w+)\)\s*$/.exec(search)?.[1];
    const pid = byId?.id || byName?.id || viaParen;
    if (pid && !selected.includes(pid)) {
      setSelected(cur => [...cur, pid]);
      setSearch("");
    }
  };

  const remove = (id: string) => setSelected(cur => cur.filter(x => x !== id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[120rem] p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {/* Search with datalist */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                list="product-options"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addByInput()}
                className="outline-none text-sm w-64"
                placeholder="Search product (name or id)…"
              />
            <datalist id="product-options">
              {(Array.isArray(allProducts) ? allProducts : []).map(p => (
                <option key={p.id} value={`${p.name} (${p.id})`} />
              ))}
            </datalist>
            </div>
            <button onClick={addByInput} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
              Add
            </button>
            <button className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50">
              <Filter className="h-4 w-4 text-slate-600" />
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> This Period
            </button>
          </div>
        </header>

        {/* Selected products as closeable chips */}
        <section className="mt-4 flex flex-wrap items-center gap-2">
          {selected.map((id) => (
            <ProductChip
              key={id}
              name={idToName[id] ? `${idToName[id]} (${id})` : id}
              active
              onClick={() => {}}
              onClose={() => remove(id)}
            />
          ))}
        </section>

        {/* One card per selected product */}
        <section className="mt-2">
          {selected.length === 0 && (
            <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 text-sm text-slate-500">
              Select products from the search box to compare.
            </div>
          )}

          {selected.map((id) => (
            <ProductCard key={id} productId={id} productName={idToName[id] ?? id} />
          ))}
        </section>

        <footer className="text-xs text-slate-400 text-center pt-6">© AIBuild – Demo dashboard UI</footer>
      </div>
    </div>
  );
}
