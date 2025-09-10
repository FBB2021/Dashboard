"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useProductEdit } from "@/hooks/use_product_edit";
import { useRouter } from "next/navigation";
import { Save, Plus, ArrowLeft, AlertCircle } from "lucide-react";

type DayRow = { day: number; pQty: number; pPrice: number; sQty: number; sPrice: number; };
const num = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

function makeRows(
  proc: { day: number; qty: number; price: number }[],
  sales: { day: number; qty: number; price: number }[]
): DayRow[] {
  const set = new Set<number>([...proc.map(x => x.day), ...sales.map(x => x.day)]);
  const days = [...set].sort((a, b) => a - b);
  return days.map(d => {
    const pr = proc.find(x => x.day === d);
    const sr = sales.find(x => x.day === d);
    return { day: d, pQty: pr?.qty ?? 0, pPrice: pr?.price ?? 0, sQty: sr?.qty ?? 0, sPrice: sr?.price ?? 0 };
  });
}

export default function ProductEditForm({
  mode,               // "create" | "edit"
  productId,          // required for edit; ignored for create
}: { mode: "create" | "edit"; productId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ===== Basic fields =====
  const [id, setId] = useState(productId ?? "");
  const [name, setName] = useState("");
  const [openingInventory, setOpeningInventory] = useState<number>(0);

  // ===== Day rows (one row = same day for procurement & sales) =====
  const [rows, setRows] = useState<DayRow[]>(mode === "create" ? [{ day: 1, pQty: 0, pPrice: 0, sQty: 0, sPrice: 0 }] : []);

  // ===== Load existing data when editing =====
  const { data, isLoading, isError, error } = useProductEdit(mode === "edit" ? (productId as string) : "");
  useEffect(() => {
    if (mode !== "edit" || !data) return;
    setName(data.name);
    setOpeningInventory(data.openingInventory);
    setRows(makeRows(data.procurements, data.sales));
  }, [mode, data]);

  const nextDay = useMemo(() => (rows.length ? Math.max(...rows.map(r => r.day)) + 1 : 1), [rows]);
  const addRow = () => setRows(cur => [...cur, { day: nextDay, pQty: 0, pPrice: 0, sQty: 0, sPrice: 0 }]);
  const updateRow = (i: number, patch: Partial<DayRow>) => setRows(cur => cur.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRows(cur => cur.filter((_, idx) => idx !== i));

  // Build payload -> matches your PUT/POST body contract
  const payload = useMemo(() => ({
    name,
    openingInventory: num(openingInventory),
    procurements: rows.map(r => ({ day: num(r.day), qty: num(r.pQty), price: num(r.pPrice) })),
    sales:        rows.map(r => ({ day: num(r.day), qty: num(r.sQty), price: num(r.sPrice) })),
  }), [name, openingInventory, rows]);

  async function handleSave() {
    // Basic validation
    const daySet = new Set(rows.map(r => r.day));
    if (daySet.size !== rows.length || [...daySet].some(d => d <= 0)) {
      alert("Days must be unique positive integers."); return;
    }
    if (mode === "create" && !id.trim()) {
      alert("Product ID is required."); return;
    }

    // Call API
    if (mode === "create") {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) { alert((await res.text().catch(()=> "")) || "Create failed"); return; }
    } else {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { alert((await res.text().catch(()=> "")) || "Save failed"); return; }
    }

    // Navigate back to list
    startTransition(() => { router.push("/products"); });
  }

  const pageTitle = mode === "create" ? "Create product" : "Update product";
  const saveText  = mode === "create" ? "Create product" : "Save changes";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{pageTitle}</h2>
        <button onClick={() => router.push("/products")} className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {mode === "edit" && isError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-rose-700 text-sm">
          <AlertCircle className="h-4 w-4" /> 
          Failed to load product: {error instanceof Error ? error.message : "Unknown"}
        </div>
      )}

      {mode === "edit" && isLoading ? (
        <div className="mt-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
      ) : (
        <>
          {/* Basic fields */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-600">Product ID</label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={mode === "edit"}
                className={cnBase("w-full mt-1", mode === "edit" ? "bg-slate-50" : "")}
                placeholder="0000021"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-600">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={cnBase("w-full mt-1")} placeholder="SOY SAUCE NEW 500ML" />
            </div>
            <div>
              <label className="text-xs text-slate-600">Opening Inventory</label>
              <input type="number" value={openingInventory} onChange={(e) => setOpeningInventory(num(e.target.value))} className={cnBase("w-full mt-1")} />
            </div>
          </div>

          {/* Day rows */}
          <DayRowsTable rows={rows} updateRow={updateRow} removeRow={removeRow} addRow={addRow} />

          {/* Actions */}
          <div className="mt-6 flex items-center gap-2">
            <button onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-60">
              <Save className="h-4 w-4" /> {saveText}
            </button>
            <button onClick={() => router.push("/products")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- small presentational bits ----------
const cnBase = (extra = "", add = "") =>
  `rounded-lg border border-slate-200 px-3 py-2 text-sm ${extra} ${add}`;

function DayRowsTable({
  rows, updateRow, removeRow, addRow,
}: {
  rows: DayRow[];
  updateRow: (idx: number, patch: Partial<DayRow>) => void;
  removeRow: (idx: number) => void;
  addRow: () => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Daily lines</h3>
        <button onClick={addRow} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
          <Plus className="h-4 w-4" /> Add day
        </button>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="py-2 pr-3">Day</th>
              <th className="py-2 px-3">Proc. Qty</th>
              <th className="py-2 px-3">Proc. Price</th>
              <th className="py-2 px-3">Sales Qty</th>
              <th className="py-2 px-3">Sales Price</th>
              <th className="py-2 pl-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2 pr-3 w-[80px]"><input type="number" value={r.day} onChange={(e)=>updateRow(idx,{day:num(e.target.value,r.day)})} className={cnBase("w-full")} /></td>
                <td className="py-2 px-3"><input type="number" value={r.pQty}  onChange={(e)=>updateRow(idx,{pQty:num(e.target.value)})}   className={cnBase("w-full")} /></td>
                <td className="py-2 px-3"><input type="number" step="0.01" value={r.pPrice} onChange={(e)=>updateRow(idx,{pPrice:num(e.target.value)})} className={cnBase("w-full")} /></td>
                <td className="py-2 px-3"><input type="number" value={r.sQty}  onChange={(e)=>updateRow(idx,{sQty:num(e.target.value)})}   className={cnBase("w-full")} /></td>
                <td className="py-2 px-3"><input type="number" step="0.01" value={r.sPrice} onChange={(e)=>updateRow(idx,{sPrice:num(e.target.value)})} className={cnBase("w-full")} /></td>
                <td className="py-2 pl-3"><button onClick={()=>removeRow(idx)} className="text-xs text-rose-600 hover:underline">Remove</button></td>
              </tr>
            ))}
            {rows.length===0 && (<tr><td colSpan={6} className="py-8 text-center text-slate-500">No rows. Click &quot;Add day&quot; to start.</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
