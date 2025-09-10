"use client";

import React, { useCallback, useRef, useState, useTransition } from "react";
import { X, Upload, FileUp, AlertCircle, Trash, Pencil, Plus } from "lucide-react";
import type { CreateProductDto } from "@/dtos/request_dtos/product.dto";

// =====================
// Helpers
// =====================
const cn = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");
const num = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

type DayRow = { day: number; pQty: number; pPrice: number; sQty: number; sPrice: number };

/** Normalize one parsed product to ensure arrays / numbers exist */
function normalizeItem(d: CreateProductDto): CreateProductDto {
  return {
    ...d,
    id: d.id ?? "",
    name: d.name ?? "",
    openingInventory: Number(d.openingInventory ?? 0),
    procurements: (d.procurements ?? []).map((x) => ({
      day: Number(x.day) || 0,
      qty: Number(x.qty) || 0,
      price: Number(x.price) || 0,
    })),
    sales: (d.sales ?? []).map((x) => ({
      day: Number(x.day) || 0,
      qty: Number(x.qty) || 0,
      price: Number(x.price) || 0,
    })),
  };
}

/** Merge procurement / sales into editable "by-day" rows */
function toDayRows(it: CreateProductDto): DayRow[] {
  const procs = it.procurements ?? [];
  const sales = it.sales ?? [];
  const daySet = new Set<number>([
    ...procs.map((d) => Number(d.day) || 0),
    ...sales.map((d) => Number(d.day) || 0),
  ]);
  const days = [...daySet].filter((d) => d > 0).sort((a, b) => a - b);

  return days.map((d) => {
    const pr = procs.find((x) => x.day === d);
    const sr = sales.find((x) => x.day === d);
    return {
      day: d,
      pQty: Number(pr?.qty ?? 0),
      pPrice: Number(pr?.price ?? 0),
      sQty: Number(sr?.qty ?? 0),
      sPrice: Number(sr?.price ?? 0),
    };
  });
}

// =====================
// Day rows editor (expandable per product)
// =====================
function DayRowsEditor({
  rows,
  onChange,
}: {
  rows: DayRow[];
  onChange: (rows: DayRow[]) => void;
}) {
  const add = () => {
    const next = rows.length ? Math.max(...rows.map((r) => r.day)) + 1 : 1;
    onChange([...rows, { day: next, pQty: 0, pPrice: 0, sQty: 0, sPrice: 0 }]);
  };

  const patch = (i: number, p: Partial<DayRow>) =>
    onChange(rows.map((r, idx) => (i === idx ? { ...r, ...p } : r)));

  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-100">
            <th className="py-2 pr-2">Day</th>
            <th className="py-2 px-2">Proc Qty</th>
            <th className="py-2 px-2">Proc Price</th>
            <th className="py-2 px-2">Sales Qty</th>
            <th className="py-2 px-2">Sales Price</th>
            <th className="py-2 pl-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1.5 pr-2 w-[70px]">
                <input
                  type="number"
                  className="w-full rounded border border-slate-200 px-2 py-1"
                  value={r.day}
                  onChange={(e) => patch(i, { day: num(e.target.value, r.day) })}
                />
              </td>
              <td className="py-1.5 px-2">
                <input
                  type="number"
                  className="w-full rounded border border-slate-200 px-2 py-1"
                  value={r.pQty}
                  onChange={(e) => patch(i, { pQty: num(e.target.value) })}
                />
              </td>
              <td className="py-1.5 px-2">
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded border border-slate-200 px-2 py-1"
                  value={r.pPrice}
                  onChange={(e) => patch(i, { pPrice: num(e.target.value) })}
                />
              </td>
              <td className="py-1.5 px-2">
                <input
                  type="number"
                  className="w-full rounded border border-slate-200 px-2 py-1"
                  value={r.sQty}
                  onChange={(e) => patch(i, { sQty: num(e.target.value) })}
                />
              </td>
              <td className="py-1.5 px-2">
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded border border-slate-200 px-2 py-1"
                  value={r.sPrice}
                  onChange={(e) => patch(i, { sPrice: num(e.target.value) })}
                />
              </td>
              <td className="py-1.5 pl-2">
                <button onClick={() => remove(i)} className="text-rose-600 hover:underline">
                  Remove
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-slate-500">
                No rows. Click &quot;Add day&quot;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <button
        onClick={add}
        className="mt-2 inline-flex items-center gap-2 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
      >
        <Plus className="h-3.5 w-3.5" /> Add day
      </button>
    </div>
  );
}

// =====================
// Import Modal (Upload → Preview → Confirm)
// =====================
export default function ImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported?: (summary: { imported: number; updated: number; failed: number }) => void;
}) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Parsed (but not yet committed) items
  const [items, setItems] = useState<CreateProductDto[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fileRef = useRef<HTMLInputElement>(null);
  const onBrowse = () => fileRef.current?.click();

  // ---------- Upload & Parse ----------
  const handleDrop = useCallback(async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setError(null);

    const fd = new FormData();
    fd.append("file", f);

    startTransition(async () => {
      const res = await fetch("/api/products/import/parse", { method: "POST", body: fd });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setError(txt || "Parse failed");
        return;
      }
      const json = await res.json() as { data: CreateProductDto[] };
      setItems((json.data || []).map(normalizeItem));
      setStep("preview");
    });
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleDrop(e.target.files);
    if (fileRef.current) fileRef.current.value = ""; // allow picking same file again
  };

  // Drag-n-drop UX
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    void handleDrop(dt?.files ?? null);
  };

  // ---------- Edit helpers ----------
  const toggleExpand = (id: string) => setExpanded((m) => ({ ...m, [id]: !m[id] }));

  const updateItem = (id: string, patch: Partial<CreateProductDto>) =>
    setItems((cur) => cur.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const updateRows = (id: string, rows: DayRow[]) => {
    const procurements = rows.map((r) => ({ day: r.day, qty: r.pQty, price: r.pPrice }));
    const sales = rows.map((r) => ({ day: r.day, qty: r.sQty, price: r.sPrice }));
    updateItem(id, { procurements, sales } as any);
  };

  const removeItem = (id: string) => setItems((cur) => cur.filter((it) => it.id !== id));

  // ---------- Commit import ----------
  const handleImport = async () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/products/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setError(txt || "Import failed");
        return;
      }
      const { data: sum } = await res.json();
      onImported?.(sum);
      onClose();
    });
  };

  // ---------- Step 1: Upload ----------
  const UploadView = (
    <div className="space-y-4">
      <div
        className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="mx-auto h-12 w-12 rounded-full bg-white grid place-items-center shadow">
          <FileUp className="h-6 w-6 text-slate-600" />
        </div>
        <div className="mt-3 text-sm text-slate-700">Choose a file or drag & drop it here</div>
        <div className="mt-1 text-xs text-slate-500">.xlsx / .xls formats, up to 10MB</div>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={onBrowse}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" /> Browse File
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-rose-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );

  // ---------- Step 2: Preview ----------
  const PreviewView = (
    <>
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{items.length} results found</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("upload")}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Re-upload
          </button>
          <button
            onClick={handleImport}
            disabled={isPending || items.length === 0}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-60"
          >
            Import {items.length} items
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-rose-700 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Opening</th>
              <th className="py-2 px-3">Days</th>
              <th className="py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const rows = toDayRows(it);
              const expandedRow = expanded[it.id] ?? false;

              return (
                <React.Fragment key={it.id}>
                  <tr className="border-t border-slate-100">
                    <td className="py-2 px-3">
                      <input
                        value={it.name}
                        onChange={(e) => updateItem(it.id, { name: e.target.value })}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        value={it.id}
                        onChange={(e) => updateItem(it.id, { id: e.target.value })}
                        className="w-40 rounded border border-slate-200 px-2 py-1 text-sm font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={it.openingInventory}
                        onChange={(e) => updateItem(it.id, { openingInventory: num(e.target.value) } as any)}
                        className="w-28 rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 px-3">{rows.length}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpand(it.id)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 inline-flex items-center gap-1"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit days
                        </button>
                        <button
                          onClick={() => removeItem(it.id)}
                          className="rounded border border-rose-200 px-2 py-1 text-xs hover:bg-rose-50 inline-flex items-center gap-1 text-rose-600"
                        >
                          <Trash className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow && (
                    <tr>
                      <td colSpan={5} className="p-3 bg-slate-50">
                        <DayRowsEditor rows={rows} onChange={(rows) => updateRows(it.id, rows)} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-500">
                  No items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed inset-0 z-[70] grid place-items-center px-4",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Upload files</div>
              <div className="text-xs text-slate-500">Select and upload the files of your choice</div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-50">
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Steps */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={cn("px-2 py-0.5 rounded", step === "upload" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600")}>
              1. Upload
            </span>
            <span className="text-slate-400">→</span>
            <span className={cn("px-2 py-0.5 rounded", step === "preview" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600")}>
              2. Preview & Confirm
            </span>
          </div>

          {/* Body */}
          <div className="mt-4">{step === "upload" ? UploadView : PreviewView}</div>
        </div>
      </div>
    </>
  );
}
