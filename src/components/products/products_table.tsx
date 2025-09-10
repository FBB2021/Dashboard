"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useProductsList } from "@/hooks/use_products_list";
import type { ProductBasic } from "@/dtos/response_dtos/product.response.dto";
import ImportModal from "@/components/products/products_import_modal";
import {
  Search, Upload, Calendar, Pencil, Trash, AlertCircle, ChevronDown, Plus
} from "lucide-react";

// =====================
// UI helpers
// =====================

/** Simple avatar using product initial */
function ProductAvatar({ name }: { name: string }) {
  const letter = name?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 grid place-items-center text-xs font-semibold">
      {letter}
    </div>
  );
}

/** Split button: left = Add New, right = dropdown trigger */
function SplitNewButton({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
      {/* Left: add new product */}
      <Link
        href="/products/new"
        className="px-3 py-2 text-sm bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add New
      </Link>

      {/* Right: dropdown trigger */}
      <button
        onClick={onOpenMenu}
        className="px-2 py-2 text-sm bg-slate-900/90 text-white hover:bg-slate-800 border-l border-slate-700 inline-flex items-center"
        aria-haspopup="menu"
        aria-label="More actions"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

// =====================
// Main table app
// =====================
export default function ProductsTable() {
  const { products, isLoading, isError, error, mutate } = useProductsList();

  // Split button dropdown & import modal
  const [menuOpen, setMenuOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Local UI state
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] =
    useState<"name-asc" | "name-desc" | "id-asc" | "id-desc">("name-asc");
  const [isPending, startTransition] = useTransition();

  // Filter + sort in-memory
  const rows = useMemo(() => {
    let list = products as ProductBasic[];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }
    const sorter: Record<typeof sortBy, (a: ProductBasic, b: ProductBasic) => number> = {
      "name-asc": (a, b) => a.name.localeCompare(b.name),
      "name-desc": (a, b) => b.name.localeCompare(a.name),
      "id-asc": (a, b) => a.id.localeCompare(b.id),
      "id-desc": (a, b) => b.id.localeCompare(a.id),
    };
    return [...list].sort(sorter[sortBy]);
  }, [products, query, sortBy]);

  // =====================
  // Delete action → call API then revalidate
  // =====================
  async function handleDelete(id: string) {
    const ok = confirm(
      `Delete product ${id}? This will remove its history as well.`
    );
    if (!ok) return;

    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      alert(msg || "Delete failed");
      return;
    }

    startTransition(() => {
      void mutate(); // SWR: refetch current key
    });
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold mr-auto">Product</h2>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or id…"
            className="outline-none text-sm w-56"
          />
        </div>

        {/* Split button: left add new / right dropdown */}
        <div className="relative">
          <SplitNewButton onOpenMenu={() => setMenuOpen((v) => !v)} />

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-lg z-10"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => {
                  setImportOpen(true); // 👉 open modal (parse → preview → commit)
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import from .xlsx (Preview & Confirm)
              </button>
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name-asc" | "name-desc" | "id-asc" | "id-desc")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            title="Sort"
          >
            <option value="name-asc">Sort: Name ↑</option>
            <option value="name-desc">Sort: Name ↓</option>
            <option value="id-asc">Sort: ID ↑</option>
            <option value="id-desc">Sort: ID ↓</option>
          </select>
        </div>

        {/* Date (placeholder) */}
        {/* <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> All time
        </button> */}
      </div>

      {/* Meta */}
      <div className="text-xs text-slate-500 mt-3">{rows.length} results found</div>

      {/* Error state */}
      {isError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-rose-700">
          <AlertCircle className="h-4 w-4" />
          <span>
            Failed to load products: {error instanceof Error ? error.message : "Unknown error"}
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-3">Name</th>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/40">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <ProductAvatar name={p.name} />
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">click edit to modify</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-500">{p.id}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {/* Edit */}
                      <a
                        href={`/products/${p.id}`}
                        className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </a>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="rounded-lg border border-rose-200 p-1.5 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash className="h-4 w-4 text-rose-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    No products. Try a different search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isPending && <div className="mt-2 text-xs text-slate-500">Refreshing…</div>}
        </div>
      )}

      {/* Import modal (parse → preview → commit) */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(sum) => {
          alert(`Imported: ${sum.imported}\nUpdated: ${sum.updated}\nFailed: ${sum.failed}`);
          startTransition(() => { void mutate(); });
        }}
      />
    </div>
  );
}
