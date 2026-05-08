"use client";
import { useEffect, useState } from "react";

interface Announcement {
  id: string; title: string; content: string; isActive: boolean; createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/announcements")
      .then(r => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function toggleActive(item: Announcement) {
    setActionLoading(item.id);
    await fetch(`/api/admin/announcements/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    load();
    setActionLoading(null);
  }

  async function deleteItem(item: Announcement) {
    if (!confirm(`ลบประกาศ "${item.title}"?`)) return;
    setActionLoading(item.id + "_del");
    await fetch(`/api/admin/announcements/${item.id}`, { method: "DELETE" });
    load();
    setActionLoading(null);
  }

  async function createAnnouncement() {
    setFormError("");
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("กรุณากรอกหัวข้อและเนื้อหา");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ title: "", content: "" });
      setShowForm(false);
      load();
    } else {
      const d = await res.json();
      setFormError(d.error ?? "เกิดข้อผิดพลาด");
    }
    setSubmitting(false);
  }

  const active = items.filter(i => i.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          <p className="mt-0.5 text-sm text-gray-500">{items.length} รายการ · {active} active</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 bg-black"
        >
          <PlusIcon /> New Announcement
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl bg-white p-5 border border-[#e9e9e9]">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">สร้างประกาศใหม่</h3>
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-black"
              placeholder="หัวข้อประกาศ"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-black resize-none"
              placeholder="เนื้อหาประกาศ..."
              rows={3}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            />
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <div className="flex gap-2">
              <button onClick={createAnnouncement} disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 bg-black">
                {submitting ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button onClick={() => { setShowForm(false); setFormError(""); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-5 border border-[#e9e9e9] transition-shadow hover:shadow-sm">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: item.isActive ? "#111111" : "#d1d5db" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={item.isActive
                        ? { background: "#111111", color: "#ffffff" }
                        : { background: "#f3f4f6", color: "#9ca3af" }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: item.isActive ? "#ffffff" : "#d1d5db" }} />
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.content}</p>
                  <p className="mt-2 text-xs text-gray-400">{new Date(item.createdAt).toLocaleString("th-TH")}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 items-end">
                  <button
                    onClick={() => toggleActive(item)}
                    disabled={actionLoading === item.id}
                    className="rounded border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    style={item.isActive
                      ? { borderColor: "#111111", color: "#111111" }
                      : { borderColor: "#e1e1e1", color: "#555555" }}
                  >
                    {item.isActive ? "Hide" : "Publish"}
                  </button>
                  <button
                    onClick={() => deleteItem(item)}
                    disabled={actionLoading === item.id + "_del"}
                    className="rounded border border-[#e1e1e1] px-3 py-1.5 text-xs font-medium text-[#555] hover:bg-[#f6f6f6] transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
              ยังไม่มีประกาศ
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
