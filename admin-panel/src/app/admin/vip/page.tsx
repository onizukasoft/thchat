"use client";
import { useEffect, useState, useCallback } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

/* ─── Types ─── */
type VipPkg = {
  id: string; name: string; icon: string; level: string;
  price: number; coins: number; days: number;
  features: string; isActive: boolean; sortOrder: number;
};

type VipUser = {
  id: string; username: string; nickname: string | null;
  avatar: string | null; vipLevel: string | null;
  vipUntil: string | null; coins: number;
};

const LEVEL_STYLE: Record<string, string> = {
  silver:  "bg-gray-100 text-gray-700 border border-gray-300",
  gold:    "bg-yellow-50 text-yellow-700 border border-yellow-300",
  diamond: "bg-blue-50 text-blue-700 border border-blue-300",
};
const LEVEL_ICON: Record<string, string> = { silver: "🥈", gold: "🥇", diamond: "💎" };

/* ─── Main Page ─── */
export default function VipPage() {
  const [tab, setTab] = useState<"packages" | "users">("users");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-black">VIP Management</h1>
        <p className="text-sm text-[#888] mt-0.5">จัดการ VIP ผู้ใช้และตั้งค่าแพ็กเกจ</p>
      </div>

      <div className="flex gap-1 border-b border-[#efefef]">
        {(["users", "packages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-black text-black" : "border-transparent text-[#888] hover:text-black"
            }`}
          >
            {t === "users" ? "จัดการ User VIP" : "ตั้งค่าแพ็กเกจ"}
          </button>
        ))}
      </div>

      {tab === "users" ? <UsersTab /> : <PackagesTab />}
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [users, setUsers] = useState<VipUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("active");
  const [grantId, setGrantId] = useState<string | null>(null);
  const [grantLevel, setGrantLevel] = useState("gold");
  const [grantDays, setGrantDays] = useState(30);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback((q: string, f: string) => {
    setLoading(true);
    fetch(`/api/admin/vip/users?search=${encodeURIComponent(q)}&filter=${f}`)
      .then((r) => r.json()).then(setUsers).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(query, filter); }, [query, filter, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
  }

  async function handleGrant(userId: string) {
    setProcessing(userId);
    await fetch(`/api/admin/vip/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant", level: grantLevel, days: grantDays }),
    });
    setProcessing(null);
    setGrantId(null);
    load(query, filter);
  }

  async function handleRevoke(userId: string) {
    if (!confirm("ถอน VIP user นี้?")) return;
    setProcessing(userId);
    await fetch(`/api/admin/vip/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    setProcessing(null);
    load(query, filter);
  }

  return (
    <div className="space-y-4">
      {/* Filter + Search */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1">
          {[["active", "Active"], ["expired", "หมดอายุ"], ["all", "ทั้งหมด"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => { setFilter(v); setQuery(""); setSearch(""); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === v ? "bg-black text-white" : "bg-[#f5f5f5] text-[#555] hover:bg-[#eee]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา username / ชื่อ..."
            className="text-sm border border-[#e5e5e5] rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-black/10 w-48"
          />
          <button type="submit" className="px-3 py-1.5 bg-black text-white text-sm font-semibold rounded-lg">ค้นหา</button>
        </form>
      </div>

      {/* User list */}
      <div className="bg-white rounded-xl border border-[#efefef] divide-y divide-[#f8f8f8]">
        {loading ? (
          <div className="py-10 text-center text-sm text-[#bbb]">กำลังโหลด...</div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#bbb]">ไม่พบข้อมูล</div>
        ) : (
          users.map((u) => {
            const displayName = u.nickname || u.username;
            const isExpanded = grantId === u.id;
            const expired = u.vipUntil ? new Date(u.vipUntil) < new Date() : true;
            return (
              <div key={u.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center text-sm font-bold text-[#555] shrink-0">
                    {displayName[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black">
                      {displayName}
                      <span className="text-[#aaa] font-normal ml-1 text-xs">@{u.username}</span>
                    </p>
                    {u.vipLevel && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_STYLE[u.vipLevel] ?? "bg-gray-100 text-gray-600"}`}>
                        {LEVEL_ICON[u.vipLevel]} {u.vipLevel.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs text-[#aaa] shrink-0 hidden sm:block">
                    {u.vipUntil ? (
                      <span className={expired ? "text-red-400" : "text-green-600"}>
                        {expired ? "หมดอายุ" : "หมด"} {formatDistanceToNow(new Date(u.vipUntil), { addSuffix: true, locale: th })}
                      </span>
                    ) : (
                      <span className="text-[#ccc]">ไม่มี VIP</span>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => { setGrantId(isExpanded ? null : u.id); setGrantLevel("gold"); setGrantDays(30); }}
                      className="text-xs px-2.5 py-1 bg-black text-white rounded-lg hover:bg-[#222]"
                    >
                      {u.vipLevel && !expired ? "ต่ออายุ/เปลี่ยน" : "มอบ VIP"}
                    </button>
                    {u.vipLevel && !expired && (
                      <button
                        onClick={() => handleRevoke(u.id)}
                        disabled={processing === u.id}
                        className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40"
                      >
                        ถอน
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-[#fafafa] border-t border-[#f0f0f0] px-4 py-3 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="text-xs text-[#888] block mb-1">ระดับ</label>
                      <select
                        value={grantLevel}
                        onChange={(e) => setGrantLevel(e.target.value)}
                        className="text-sm border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none bg-white"
                      >
                        <option value="silver">🥈 Silver</option>
                        <option value="gold">🥇 Gold</option>
                        <option value="diamond">💎 Diamond</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#888] block mb-1">จำนวนวัน</label>
                      <div className="flex gap-1">
                        {[7, 30, 90, 365].map((d) => (
                          <button
                            key={d}
                            onClick={() => setGrantDays(d)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                              grantDays === d ? "bg-black text-white border-black" : "border-[#e5e5e5] text-[#555] hover:bg-[#f0f0f0]"
                            }`}
                          >
                            {d}วัน
                          </button>
                        ))}
                        <input
                          type="number"
                          min={1}
                          value={grantDays}
                          onChange={(e) => setGrantDays(Number(e.target.value))}
                          className="text-sm border border-[#e5e5e5] rounded-lg px-2 py-1.5 w-16 outline-none text-center"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleGrant(u.id)}
                      disabled={processing === u.id}
                      className="px-4 py-1.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-[#222] disabled:opacity-40"
                    >
                      {processing === u.id ? "กำลังบันทึก..." : "ยืนยัน"}
                    </button>
                    <p className="text-xs text-[#aaa]">
                      จะหมดอายุ {format(new Date(Date.now() + grantDays * 86400000), "d MMM yyyy", { locale: th })}
                      {u.vipUntil && !expired && " (ต่อจากที่มีอยู่)"}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Packages Tab ─── */
function PackagesTab() {
  const [packages, setPackages] = useState<VipPkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<VipPkg>>({});
  const [saving, setSaving] = useState(false);

  async function loadPkgs() {
    setLoading(true);
    const r = await fetch("/api/admin/vip/packages");
    setPackages(await r.json());
    setLoading(false);
  }

  useEffect(() => { loadPkgs(); }, []);

  function startEdit(pkg: VipPkg) {
    setEditId(pkg.id);
    setForm({
      name: pkg.name,
      icon: pkg.icon,
      price: pkg.price,
      coins: pkg.coins,
      days: pkg.days,
      isActive: pkg.isActive,
      features: pkg.features,
    });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const payload = { ...form };
    if (typeof form.features === "string") {
      try { payload.features = JSON.parse(form.features as string); } catch { /* ignore */ }
    }
    await fetch(`/api/admin/vip/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setEditId(null);
    loadPkgs();
  }

  if (loading) return <div className="py-10 text-center text-sm text-[#bbb]">กำลังโหลด...</div>;

  return (
    <div className="space-y-3">
      {packages.map((pkg) => {
        const features: string[] = (() => {
          try { return JSON.parse(pkg.features); } catch { return []; }
        })();
        const isEditing = editId === pkg.id;

        return (
          <div key={pkg.id} className="bg-white rounded-xl border border-[#efefef] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-2xl">{pkg.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-black">{pkg.name}</p>
                <p className="text-xs text-[#888]">
                  {(pkg.price / 100).toLocaleString()} บาท · {pkg.coins.toLocaleString()} เหรียญ · {pkg.days} วัน
                </p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pkg.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                {pkg.isActive ? "เปิดใช้" : "ปิดใช้"}
              </span>
              <button
                onClick={() => isEditing ? setEditId(null) : startEdit(pkg)}
                className="text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5]"
              >
                {isEditing ? "ยกเลิก" : "แก้ไข"}
              </button>
            </div>

            {/* Features */}
            {!isEditing && features.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1">
                {features.map((f, i) => (
                  <span key={i} className="text-[11px] bg-[#f5f5f5] text-[#555] px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            )}

            {/* Edit form */}
            {isEditing && (
              <div className="border-t border-[#f0f0f0] bg-[#fafafa] px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-xs text-[#888] block mb-1">ชื่อ</label>
                    <input value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full text-sm border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none bg-white" />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] block mb-1">ไอคอน</label>
                    <input value={form.icon ?? ""} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                      className="w-full text-sm border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] block mb-1">ราคา (สตางค์) เช่น 9900 = 99฿</label>
                    <input type="number" value={form.price ?? 0} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                      className="w-full text-sm border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none bg-white" />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] block mb-1">เหรียญ</label>
                    <input type="number" value={form.coins ?? 0} onChange={(e) => setForm((f) => ({ ...f, coins: Number(e.target.value) }))}
                      className="w-full text-sm border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none bg-white" />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] block mb-1">จำนวนวัน</label>
                    <input type="number" value={form.days ?? 30} onChange={(e) => setForm((f) => ({ ...f, days: Number(e.target.value) }))}
                      className="w-full text-sm border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none bg-white" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isActive ?? true}
                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                        className="w-4 h-4 rounded" />
                      <span className="text-sm font-medium">เปิดใช้งาน</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#888] block mb-1">สิทธิ์ (JSON array) เช่น ["สิทธิ์ 1","สิทธิ์ 2"]</label>
                  <textarea
                    value={typeof form.features === "string" ? form.features : JSON.stringify(form.features ?? [], null, 2)}
                    onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                    rows={3}
                    className="w-full text-xs font-mono border border-[#e5e5e5] rounded-lg px-2.5 py-1.5 outline-none bg-white resize-none"
                  />
                </div>
                <button
                  onClick={() => saveEdit(pkg.id)}
                  disabled={saving}
                  className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-[#222] disabled:opacity-40"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
