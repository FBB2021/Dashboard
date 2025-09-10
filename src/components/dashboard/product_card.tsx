"use client";

import React, { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useProductHistory } from "@/hooks/use_product_history";

// =====================
// Stat Card
// =====================
function StatCard({ title, primary, hint }: { title: string; primary: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-4">
      <p className="text-xs text-slate-500 mb-2">{title}</p>
      <div className="text-2xl font-semibold text-slate-900">{primary}</div>
      {hint ? <div className="mt-2 text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

const compact = (n: number) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
const currency = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const byKey = Object.fromEntries(payload.map((p: any) => [p.dataKey, p]));
  return (
    <div className="rounded-xl bg-white p-3 shadow-xl ring-1 ring-slate-100">
      <div className="text-xs text-slate-500 mb-1">Day {label}</div>
      <div className="text-[13px] space-y-1">
        {byKey.inventory && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: byKey.inventory.color }} />
            <span className="text-slate-600">Inventory</span>
            <span className="font-medium text-slate-900 ml-auto">{compact(byKey.inventory.value)}</span>
          </div>
        )}
        {byKey.procurementAmount && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: byKey.procurementAmount.color }} />
            <span className="text-slate-600">Procurement</span>
            <span className="font-medium text-slate-900 ml-auto">{currency(byKey.procurementAmount.value)}</span>
          </div>
        )}
        {byKey.salesAmount && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: byKey.salesAmount.color }} />
            <span className="text-slate-600">Sales</span>
            <span className="font-medium text-slate-900 ml-auto">{currency(byKey.salesAmount.value)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================
// Product Card
// =====================
export default function ProductCard({ productId, productName }: { productId: string; productName: string }) {
  const { data, isLoading, isError } = useProductHistory(productId);
  const series = useMemo(() => data?.history ?? [], [data?.history]);

  const kpis = useMemo(() => {
    const inv = series.at(-1)?.inventory ?? 0;
    const proc = series.reduce((s, r) => s + r.procurementAmount, 0);
    const sales = series.reduce((s, r) => s + r.salesAmount, 0);
    return { inv, proc, sales };
  }, [series]);

  return (
    <section className="mt-5 rounded-2xl bg-white p-4 md:p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">{productName}</h3>
      </div>

      {isLoading && <div className="h-80 bg-slate-100 rounded animate-pulse" />}
      {isError && <div className="text-sm text-rose-600">Failed to load product data.</div>}

      {!isLoading && !isError && (
        <>
          {/* KPI row (per product) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StatCard title="Inventory (last day)" primary={compact(kpis.inv)} />
            <StatCard title="Procurement Amount (period)" primary={currency(kpis.proc)} />
            <StatCard title="Sales (period)" primary={currency(kpis.sales)} />
          </div>

          {/* Line chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="inventory"         name="Inventory"   stroke="#0f172a" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="procurementAmount" name="Procurement" stroke="#94a3b8" strokeWidth={2.0} dot={false} />
                <Line type="monotone" dataKey="salesAmount"       name="Sales"       stroke="#cbd5e1" strokeWidth={2.0} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
