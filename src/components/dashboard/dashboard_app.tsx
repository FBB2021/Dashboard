"use client";

import React, { useMemo, useState } from "react";
import { X, Search, Filter, Calendar, LayoutDashboard } from "lucide-react";
import ProductCard from "./product_card";
import { useProductsList } from "@/hooks/use_products_list";
import { useDashboardData } from "@/hooks/use_dashboard_data";

// =====================
// UI helpers & types
// =====================
const cn = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");
const compact = (n: number) =>
  new Intl.NumberFormat("en-AU", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const currency = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);

type UiRange = "This Week" | "This Month" | "This Year";
const toApiRange = (r: UiRange) => (r === "This Week" ? "week" : r === "This Month" ? "month" : "year");
type TopBy = "amount" | "qty";

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

// =====================
// Small KPI cards
// =====================
function StatCard({
  title,
  primary,
  footer,
}: {
  title: string;
  primary: string;
  footer?: string;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <div className="text-2xl font-semibold text-slate-900 tracking-tight">{primary}</div>
      {footer ? <div className="mt-1 text-[11px] text-slate-500">{footer}</div> : null}
    </div>
  );
}

// =====================
// Top sellers (no progress bars)
// =====================
function TopSellersCard({
  rows,
  by,
  onChangeBy,
  topN,
  onChangeTopN,
  className,
}: {
  rows: { id: string; name: string; qty: number; amount: number }[];
  by: "amount" | "qty";
  onChangeBy: (v: "amount" | "qty") => void;
  topN: number;
  onChangeTopN: (v: number) => void;
  className?: string;
}) {
  const topRows = rows.slice(0, topN);

  return (
    <div className={cn("h-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-medium text-slate-900">Top Sellers</p>
        <div className="flex items-center gap-2">
          <select
            value={by}
            onChange={(e) => onChangeBy(e.target.value as "amount" | "qty")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
            title="Sort by"
          >
            <option value="amount">by Revenue</option>
            <option value="qty">by Quantity</option>
          </select>
          <select
            value={topN}
            onChange={(e) => onChangeTopN(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
            title="Top N"
          >
            {[3, 5, 10].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {topRows.map((r, i) => (
          <div key={r.id} className="py-1.5">
            <div className="flex items-center gap-3">
              <div className="text-xs w-6 text-slate-500">{i + 1}.</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-slate-900 truncate">{r.name}</div>
                <div className="text-[11px] text-slate-500">ID: {r.id}</div>
              </div>
              <div className="text-right min-w-[84px]">
                <div className="text-sm font-medium text-slate-900">
                  {by === "amount" ? currency(r.amount) : r.qty}
                </div>
                <div className="text-[11px] text-slate-500">
                  {by === "amount" ? `${r.qty} pcs` : currency(r.amount)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {topRows.length === 0 && (
          <div className="text-xs text-slate-500 py-6 text-center">No sales data.</div>
        )}
      </div>
    </div>
  );
}

// =====================
// Page
// =====================
export default function DashboardApp() {
  // Selected product ids
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [topBy, setTopBy] = useState<TopBy>("amount");
  const [topN, setTopN] = useState(5);
  const [range, setRange] = useState<UiRange>("This Week");

  // Products to pick from
  const { products: allProducts } = useProductsList();
  const idToName = useMemo(
    () => Object.fromEntries((allProducts ?? []).map((p) => [p.id, p.name])),
    [allProducts]
  );

  // Dashboard data (series/KPIs/Top sellers)
  const { kpis, topSelling, isLoading, isError, error } = useDashboardData({
    products: selected,
    range: toApiRange(range),
    top: String(topN),
    topBy,
  });

  // Add product by input (supports id / exact name / "Name (ID)" format)
  const addByInput = () => {
    if (!search.trim()) return;
    const byId = (allProducts ?? []).find((p) => p.id === search.trim());
    const byName = (allProducts ?? []).find(
      (p) => p.name.toLowerCase() === search.trim().toLowerCase()
    );
    const viaParen = /\(([\w-]+)\)\s*$/.exec(search)?.[1];
    const pid = byId?.id || byName?.id || viaParen;
    if (pid && !selected.includes(pid)) {
      setSelected((cur) => [...cur, pid]);
      setSearch("");
    }
  };

  const remove = (id: string) => setSelected((cur) => cur.filter((x) => x !== id));

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
                {(Array.isArray(allProducts) ? allProducts : []).map((p) => (
                  <option key={p.id} value={`${p.name} (${p.id})`} />
                ))}
              </datalist>
            </div>
            <button
              onClick={addByInput}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Add
            </button>

            {/* Range (simple dropdown) */}
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as UiRange)}
                className="bg-transparent outline-none"
              >
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>

            {/* Placeholder filter */}
            <button className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50">
              <Filter className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </header>

        {/* Selected products as closeable chips */}
        <section className="mt-4 -mx-1 overflow-x-auto">
          <div className="px-1 min-w-full flex items-center gap-2 pb-1">
            {selected.map((id) => (
              <ProductChip
                key={id}
                name={idToName[id] ? `${idToName[id]} (${id})` : id}
                active
                onClick={() => {}}
                onClose={() => remove(id)}
              />
            ))}
            {selected.length === 0 && (
              <div className="text-xs text-slate-500 pl-1">
                Select products from the search box to compare.
              </div>
            )}
          </div>
        </section>

        {/* Summary grid: KPI (left) + Top sellers (right) */}
        <section className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Left: KPIs */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            {isLoading ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[92px] rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[92px] rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse"
                    />
                  ))}
                </div>
              </>
            ) : (
              kpis && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                      title="Products"
                      primary={String(kpis.productCount ?? 0)}
                      footer="total products"
                    />
                    <StatCard
                      title="Inventory (last point)"
                      primary={compact(kpis.inventory ?? 0)}
                      footer="period end"
                    />
                    <StatCard
                      title="Procurement Amount"
                      primary={currency(kpis.procurementTotal ?? 0)}
                      footer="period total"
                    />
                    <StatCard
                      title="Sales"
                      primary={currency(kpis.salesTotal ?? 0)}
                      footer="period total"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                      title="Low stock (≤10)"
                      primary={String(kpis.lowStockCount ?? 0)}
                      footer="need replenishment"
                    />
                    <StatCard
                      title="Out of stock"
                      primary={String(kpis.outOfStockCount ?? 0)}
                      footer="need immediate action"
                    />
                  </div>
                </>
              )
            )}
          </div>

          {/* Right: Top Sellers */}
          <div className="xl:col-span-4 flex">
            <TopSellersCard
              className="flex-1"
              rows={Array.isArray(topSelling) ? topSelling : []}
              by={topBy}
              onChangeBy={setTopBy}
              topN={topN}
              onChangeTopN={setTopN}
            />
          </div>
        </section>

        {/* Error state */}
        {isError && (
          <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-rose-100">
            <div className="text-sm text-rose-600 font-medium">Failed to load data</div>
            <div className="text-xs text-rose-500 mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
            </div>
          </section>
        )}

        {/* Product cards list — Same width as the left column above (8/4 columns) */}
        <section className="mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8 space-y-4">
            {selected.map((id) => (
              <ProductCard key={id} productId={id} productName={idToName[id] ?? id} />
            ))}
            {selected.length === 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 text-sm text-slate-500">
                Select some products above to see their charts here.
              </div>
            )}
          </div>
          <div className="xl:col-span-4" />
        </section>

        <footer className="text-xs text-slate-400 text-center pt-6">
          © AIBuild – Demo dashboard UI
        </footer>
      </div>
    </div>
  );
}
