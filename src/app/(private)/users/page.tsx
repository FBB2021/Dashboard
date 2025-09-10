"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateShort } from "@/utils/date";
import type { SVGProps } from "react";

/** Server DTOs */
type Role = { id: number; name: string };
type User = {
  id: number;
  username: string;
  email: string;
  createdAt: string; // ISO
  role: Role;
};

type CreateForm = { username: string; email: string; password: string; roleId?: number | "" };
type EditForm = { username: string; email: string; password?: string; roleId?: number | "" };

/** API helper (unwraps {data}, includes cookies) */
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      (payload as { message?: string })?.message ||
      (res.status === 401 || res.status === 403
        ? "Unauthorized"
        : `Request failed: ${res.status}`);
    throw new Error(msg);
  }

  return ((payload as { data?: T }).data ?? payload) as T;
}

/** Pretty status (purely visual) */
function computeStatus(createdAtIso: string): {
  label: string;
  color: "green" | "blue" | "red" | "amber";
} {
  const days = Math.floor((Date.now() - new Date(createdAtIso).getTime()) / 86400000);
  if (days <= 7) return { label: "Busy", color: "red" };
  if (days <= 30) return { label: "Working", color: "blue" };
  if (days <= 90) return { label: "Free", color: "green" };
  return { label: "On Vacation", color: "amber" };
}

const Badge = ({
  color,
  children,
}: {
  color: "green" | "blue" | "red" | "amber";
  children: React.ReactNode;
}) => {
  const cls =
    color === "green"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : color === "blue"
      ? "bg-sky-50 text-sky-700 ring-sky-200"
      : color === "red"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${cls}`}>
      {children}
    </span>
  );
};

/** Icons */
const IconSearch = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400" {...props}>
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-4.3-4.3m1.8-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
    />
  </svg>
);

const IconSort = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" {...props}>
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7h8M6 11h12M10 15h4"
    />
  </svg>
);

const IconCalendar = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" {...props}>
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 2v4m8-4v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
    />
  </svg>
);

const IconEdit = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" {...props}>
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
    />
  </svg>
);

const IconTrash = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" {...props}>
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"
    />
  </svg>
);

export default function UsersPage() {
  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[] | null>(null);

  // Controls
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(""); // yyyy-MM
  const [sortAsc, setSortAsc] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    username: "",
    email: "",
    password: "",
    roleId: "",
  });

  // Edit
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    username: "",
    email: "",
    password: "",
    roleId: "",
  });

  useEffect(() => {
    void reload();
    void tryLoadRoles();
  }, []);

  async function reload() {
    setLoading(true);
    setErr(null);
    try {
      const list = await api<User[]>("/api/users");
      setUsers(list);
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
      else setErr("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  async function tryLoadRoles() {
    try {
      const r = await api<Role[]>("/api/roles");
      setRoles(r);
    } catch {
      setRoles([]); // roles API not present
    }
  }

  /** Derived */
  const filtered = useMemo(() => {
    let out = [...users];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (month) {
      const [y, m] = month.split("-").map(Number);
      out = out.filter((u) => {
        const d = new Date(u.createdAt);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
    }
    out.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? diff : -diff;
    });
    return out;
  }, [users, search, month, sortAsc]);

  /** Create */
  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password?.trim()) {
      alert("Please fill username, email and password.");
      return;
    }
    setCreating(true);
    try {
      const payload: CreateForm = {
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        roleId: createForm.roleId !== "" ? Number(createForm.roleId) : undefined,
      };

      const u = await api<User>("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUsers((prev) => [u, ...prev]);
      setCreateForm({ username: "", email: "", password: "", roleId: "" });
      setCreateOpen(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  /** Edit */
  function openEdit(u: User) {
    setEditing(u);
    setEditForm({
      username: u.username,
      email: u.email,
      password: "",
      roleId: u.role?.id ?? "",
    });
  }
  function closeEdit() {
    setEditing(null);
    setEditForm({ username: "", email: "", password: "", roleId: "" });
  }
  async function saveEdit() {
    if (!editing) return;
    if (!editForm.username.trim() || !editForm.email.trim()) {
      alert("Please fill username and email.");
      return;
    }
    try {
      const payload: EditForm = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        password: editForm.password?.trim() || undefined,
        roleId: editForm.roleId !== "" ? Number(editForm.roleId) : undefined,
      };

      const updated = await api<User>(`/api/users/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      closeEdit();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed.");
    }
  }

  /** Delete */
  async function removeUser(id: number) {
    if (!confirm(`Delete user #${id}?`)) return;
    const prev = users;
    setUsers((u) => u.filter((x) => x.id !== id));
    try {
      await api<void>(`/api/users/${id}`, { method: "DELETE" });
    } catch (e: unknown) {
      setUsers(prev); // rollback
      alert(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  /** Number input helper */
  const onNumChange =
    <T extends Record<string, unknown>>(
      setter: React.Dispatch<React.SetStateAction<T>>,
      key: keyof T
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = e.target.value;
      setter((s) => ({ ...s, [key]: v === "" ? "" : Number(v) } as T));
    };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">Data Table</h1>
      </div>

      {/* Search bar */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <IconSearch />
          </span>
          <input
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Employee"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* <button
          onClick={() => {}}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Search
        </button> */}
      </div>

      {/* Subheader: results + controls */}
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="text-sm">
          <div className="font-medium text-slate-900">Users</div>
          <div className="text-slate-500">{filtered.length} results found</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSortAsc((s) => !s)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            title="Toggle chronological order"
          >
            <IconSort />
            <span>Sort: {sortAsc ? "Chronological" : "Reverse"}</span>
          </button>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <IconCalendar />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-sm outline-none"
              title="Filter by created month"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur">
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 pl-4 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Created At</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : err ? (
                <tr>
                  <td className="p-4 text-rose-600" colSpan={5}>
                    Failed to load: {err}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>
                    No results.
                  </td>
                </tr>
              ) : (
                filtered.map((u, idx) => {
                  const status = computeStatus(u.createdAt);
                  const initials = (u.username || "?")
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr key={u.id} className={idx % 2 ? "bg-slate-50/40" : "bg-white"}>
                      <td className="py-3 pl-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                            {initials}
                          </div>
                          <div className="font-medium text-slate-900">{u.username}</div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{u.email}</td>
                      <td className="py-3 pr-4">
                        <Badge color={status.color}>{status.label}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-slate-700">{u.role?.name ?? "-"}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatDateShort(u.createdAt)} 
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                            title="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() => removeUser(u.id)}
                            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                            title="Delete"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer: new user */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + New User
        </button>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="mb-4 text-base font-semibold">Create User</h3>
            <form onSubmit={createUser} className="space-y-3">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Username"
                value={createForm.username}
                onChange={(e) => setCreateForm((s) => ({ ...s, username: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
              />
              {roles && roles.length > 0 ? (
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={createForm.roleId === "" ? "" : Number(createForm.roleId)}
                  onChange={onNumChange(setCreateForm, "roleId")}
                >
                  <option value="">Default role (USER)</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (#{r.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Role ID (optional)"
                  inputMode="numeric"
                  value={createForm.roleId}
                  onChange={onNumChange(setCreateForm, "roleId")}
                />
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 className="mb-4 text-base font-semibold">Edit User #{editing.id}</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Username"
                value={editForm.username}
                onChange={(e) => setEditForm((s) => ({ ...s, username: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="New password (optional)"
                type="password"
                value={editForm.password || ""}
                onChange={(e) => setEditForm((s) => ({ ...s, password: e.target.value }))}
              />
              {roles && roles.length > 0 ? (
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  value={editForm.roleId === "" ? "" : Number(editForm.roleId)}
                  onChange={onNumChange(setEditForm, "roleId")}
                >
                  <option value="">Keep current role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (#{r.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Role ID (leave blank to keep)"
                  inputMode="numeric"
                  value={editForm.roleId}
                  onChange={onNumChange(setEditForm, "roleId")}
                />
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={closeEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
                  Cancel
                </button>
                <button onClick={saveEdit} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
