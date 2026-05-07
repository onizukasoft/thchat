"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Pencil, X, Check } from "lucide-react";

type Ann = { id: string; title: string; content: string; isActive: boolean; createdAt: string };

export default function AdminAnnouncementsPage() {
  const [list, setList] = useState<Ann[]>([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ann | null>(null);

  async function fetchList() {
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setList(Array.isArray(data) ? data : []);
  }

  useEffect(() => { fetchList(); }, []);

  async function create() {
    if (!form.title.trim()) return;
    await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ title: "", content: "" });
    setShowForm(false);
    fetchList();
  }

  async function save() {
    if (!editing) return;
    await fetch(`/api/admin/announcements/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editing.title, content: editing.content }) });
    setEditing(null);
    fetchList();
  }

  async function toggleActive(a: Ann) {
    await fetch(`/api/admin/announcements/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !a.isActive }) });
    fetchList();
  }

  async function del(id: string) {
    if (!confirm("ลบประกาศนี้ไหม?")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    fetchList();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ประกาศ</h1>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
          <Plus className="w-4 h-4" />เพิ่มประกาศ
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">ประกาศใหม่</h2>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="หัวข้อ"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="เนื้อหา..." rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">บันทึก</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {list.map(a => (
          <div key={a.id} className={`bg-white rounded-xl border p-5 ${a.isActive ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
            {editing?.id === a.id ? (
              <div className="space-y-3">
                <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                <textarea value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none" />
                <div className="flex gap-2">
                  <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm"><Check className="w-3.5 h-3.5" />บันทึก</button>
                  <button onClick={() => setEditing(null)} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm"><X className="w-3.5 h-3.5" />ยกเลิก</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{a.title}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${a.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {a.isActive ? "แสดงอยู่" : "ซ่อน"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{a.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditing(a)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => toggleActive(a)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      {a.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => del(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-gray-400 py-10">ยังไม่มีประกาศ</p>}
      </div>
    </div>
  );
}
