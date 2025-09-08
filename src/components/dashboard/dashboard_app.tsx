"use client";

import React, { useMemo, useState } from "react";
import { Search, Filter, Calendar, LayoutDashboard } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useDashboardData } from "@/hooks/use_dashboard_data";

// UI helpers
const cn = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");
const compact = (n: number) => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
const currency = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// 简单的产品选项（先固定，等你有产品接口再替换）
const ALL_PRODUCTS = ["Product A", "Product B", "Product C"] as const;
type UiRange = "This Week" | "This Month" | "This Year";
const toApiRange = (r: UiRange) => (r === "This Week" ? "week" : r === "This Month" ? "month" : "year");

function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-xl text-xs border transition",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function StatCard({ title, primary, delta, footer }: { title: string; primary: string; delta?: number; footer?: string; }) {
  const positive = delta != null ? delta >= 0 : undefined;
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
      <p className="text-xs text-slate-500 mb-2">{title}</p>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-semibold text-slate-900">{primary}</div>
        {delta != null && (
          <div className={cn("text-xs font-medium", positive ? "text-emerald-600" : "text-rose-600")}>{delta}%</div>
        )}
      </div>
      {footer ? <div className="mt-2 text-[11px] text-slate-500">{footer}</div> : null}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p: any) => [p.dataKey, p]));
  return (
    <div className="rounded-xl bg-white p-3 shadow-xl ring-1 ring-slate-100">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-[13px] space-y-1">
        {byKey.inventory && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: byKey.inventory.color }} />
            <span className="text-slate-600">Inventory:</span>
            <span className="font-medium text-slate-900 ml-auto">{compact(byKey.inventory.value)}</span>
          </div>
        )}
        {byKey.procurementAmount && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: byKey.procurementAmount.color }} />
            <span className="text-slate-600">Procurement:</span>
            <span className="font-medium text-slate-900 ml-auto">{currency(byKey.procurementAmount.value)}</span>
          </div>
        )}
        {byKey.salesAmount && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: byKey.salesAmount.color }} />
            <span className="text-slate-600">Sales:</span>
            <span className="font-medium text-slate-900 ml-auto">{currency(byKey.salesAmount.value)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardApp() {
  const [selected, setSelected] = useState<string[]>([ALL_PRODUCTS[0]]);
  const [range, setRange] = useState<UiRange>("This Week");

  const { series, kpis, isLoading, isError, error, mutate } = useDashboardData({
    products: selected,
    range: toApiRange(range) as any, // hook 里 RangeKey: "week" | "month" | "year"
  });

  // KPI 回退：若后端没算 kpi，就从 series 兜底
  const totals = useMemo(() => {
    if (kpis) {
      return {
        inv: kpis.inventory,
        procSum: kpis.procurementTotal,
        salesSum: kpis.salesTotal,
        users: kpis.activeUsers,
      };
    }
    const inv = series.at(-1)?.inventory ?? 0;
    const procSum = series.reduce((s, r) => s + r.procurementAmount, 0);
    const salesSum = series.reduce((s, r) => s + r.salesAmount, 0);
    const users = Math.max(1000, Math.round((salesSum / 100) * 1.2));
    return { inv, procSum, salesSum, users };
  }, [series, kpis]);

  const toggleProduct = (p: string) =>
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[120rem] p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input className="outline-none text-sm w-52" placeholder="Search product…" />
            </div>
            <button className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50">
              <Filter className="h-4 w-4 text-slate-600" />
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> August, 2025
            </button>
          </div>
        </header>

        {/* Product chips & range */}
        <section className="mt-4 flex flex-wrap items-center gap-2">
          {ALL_PRODUCTS.map((p) => (
            <Chip key={p} active={selected.includes(p)} onClick={() => toggleProduct(p)}>
              {p}
            </Chip>
          ))}
          <div className="ml-auto flex gap-2">
            {(["This Week", "This Month", "This Year"] as const).map((r) => (
              <Chip key={r} active={range === r} onClick={() => setRange(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </section>

        {/* Loading / Error / Empty */}
        {isLoading && (
          <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="animate-pulse h-6 w-40 bg-slate-200 rounded mb-4" />
            <div className="h-80 bg-slate-100 rounded" />
          </section>
        )}

        {isError && (
          <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-rose-100">
            <div className="text-sm text-rose-600 font-medium">Failed to load data</div>
            <div className="text-xs text-rose-500 mt-1">{String((error as any)?.message || "Unknown error")}</div>
            <button onClick={() => mutate()} className="mt-3 text-xs px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">
              Retry
            </button>
          </section>
        )}

        {!isLoading && !isError && series.length === 0 && (
          <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 text-sm text-slate-500">
            No data for current filter.
          </section>
        )}

        {/* KPI cards */}
        {!isLoading && !isError && series.length > 0 && (
          <>
            <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Inventory for each day" primary={compact(totals.inv)} delta={1.07} footer="vs. last period" />
              <StatCard title="Procurement Amount" primary={currency(totals.procSum)} delta={-0.03} footer="period total" />
              <StatCard title="Sales" primary={currency(totals.salesSum)} delta={15.03} footer="period total" />
              <StatCard title="Active Users" primary={compact(totals.users)} delta={6.08} footer="platform" />
            </section>

            {/* Chart */}
            <section className="mt-4 rounded-2xl bg-white p-4 md:p-6 shadow-sm ring-1 ring-slate-100">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="inventory"          name="Inventory"   stroke="#0f172a" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="procurementAmount"  name="Procurement" stroke="#94a3b8" strokeWidth={2.0} dot={false} />
                    <Line type="monotone" dataKey="salesAmount"        name="Sales"       stroke="#cbd5e1" strokeWidth={2.0} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        <footer className="text-xs text-slate-400 text-center pt-6">© AIBuild – Demo dashboard UI</footer>
      </div>
    </div>
  );
}
