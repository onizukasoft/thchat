"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Payment = {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

type Partner = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bankAccount: string | null;
  bankName: string | null;
  sharePercent: number;
  totalPaid: number;
  notes: string | null;
  isActive: boolean;
  pin: string | null;
  createdAt: string;
  payments: Payment[];
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  bankAccount: "",
  bankName: "",
  sharePercent: "",
  notes: "",
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // add / edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // payment
  const [payPartner, setPayPartner] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // PIN
  const [pinPartnerId, setPinPartnerId] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/partners");
    setPartners(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: Partner) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      email: p.email ?? "",
      phone: p.phone ?? "",
      bankAccount: p.bankAccount ?? "",
      bankName: p.bankName ?? "",
      sharePercent: String(p.sharePercent),
      notes: p.notes ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      bankAccount: form.bankAccount,
      bankName: form.bankName,
      sharePercent: parseFloat(form.sharePercent) || 0,
      notes: form.notes,
    };
    if (editingId) {
      await fetch(`/api/admin/partners/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleToggleActive(p: Partner) {
    await fetch(`/api/admin/partners/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    load();
  }

  async function handleSavePin() {
    if (!pinPartnerId || pinValue.length < 4) return;
    setSavingPin(true);
    await fetch(`/api/admin/partners/${pinPartnerId}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinValue }),
    });
    setSavingPin(false);
    setPinPartnerId(null);
    setPinValue("");
    load();
  }

  async function handleRemovePin(id: string) {
    await fetch(`/api/admin/partners/${id}/pin`, { method: "DELETE" });
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/partners/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    load();
  }

  async function handlePay() {
    if (!payPartner || !payAmount) return;
    setPaying(true);
    await fetch("/api/admin/partners/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: payPartner, amount: parseFloat(payAmount), note: payNote }),
    });
    setPaying(false);
    setPayPartner(null);
    setPayAmount("");
    setPayNote("");
    load();
  }

  const totalShare = partners.filter((p) => p.isActive).reduce((s, p) => s + p.sharePercent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">หุ้นส่วน</h1>
          <p className="text-sm text-[#888] mt-0.5">จัดการหุ้นส่วนและการจ่ายเงิน</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-[#222] transition-colors"
        >
          + เพิ่มหุ้นส่วน
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#efefef] p-4">
          <p className="text-xs text-[#999] mb-1">หุ้นส่วนทั้งหมด</p>
          <p className="text-2xl font-bold text-black">{partners.length}</p>
          <p className="text-xs text-[#bbb] mt-1">{partners.filter((p) => p.isActive).length} คนที่ active</p>
        </div>
        <div className="bg-white rounded-xl border border-[#efefef] p-4">
          <p className="text-xs text-[#999] mb-1">สัดส่วนรวม (active)</p>
          <p className={`text-2xl font-bold ${totalShare > 100 ? "text-red-600" : totalShare === 100 ? "text-green-600" : "text-black"}`}>
            {totalShare.toFixed(1)}%
          </p>
          <p className="text-xs text-[#bbb] mt-1">{totalShare > 100 ? "เกิน 100%!" : totalShare < 100 ? `เหลือ ${(100 - totalShare).toFixed(1)}%` : "ครบ 100%"}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#efefef] p-4">
          <p className="text-xs text-[#999] mb-1">จ่ายออกรวม</p>
          <p className="text-2xl font-bold text-black">
            ฿{partners.reduce((s, p) => s + p.totalPaid, 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#bbb] mt-1">สะสมทุกหุ้นส่วน</p>
        </div>
      </div>

      {/* Partners list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#aaa] text-sm">กำลังโหลด...</div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#efefef] py-16 text-center text-[#aaa] text-sm">
          ยังไม่มีหุ้นส่วน กด <span className="font-semibold text-black">+ เพิ่มหุ้นส่วน</span> เพื่อเริ่ม
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border overflow-hidden transition-colors ${p.isActive ? "border-[#efefef]" : "border-[#f0f0f0] opacity-60"}`}>
              {/* Row */}
              <div className="flex items-center gap-4 px-4 py-3.5">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${p.isActive ? "bg-black text-white" : "bg-[#e0e0e0] text-[#999]"}`}>
                  {p.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-black truncate">{p.name}</p>
                    {!p.isActive && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#f0f0f0] text-[#999]">
                        ไม่ active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#999] truncate mt-0.5">
                    {[p.email, p.phone].filter(Boolean).join(" · ") || "ไม่มีข้อมูลติดต่อ"}
                  </p>
                </div>

                {/* Share */}
                <div className="text-center shrink-0 w-20">
                  <p className="text-lg font-bold text-black">{p.sharePercent}%</p>
                  <p className="text-[10px] text-[#bbb]">สัดส่วน</p>
                </div>

                {/* Total paid */}
                <div className="text-right shrink-0 w-28 hidden sm:block">
                  <p className="text-sm font-semibold text-black">
                    ฿{p.totalPaid.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-[#bbb]">จ่ายแล้ว</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { setPayPartner(p.id); setPayAmount(""); setPayNote(""); }}
                    className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    จ่ายเงิน
                  </button>
                  <button
                    onClick={() => { setPinPartnerId(p.id); setPinValue(""); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${p.pin ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" : "bg-[#f5f5f5] text-[#555] border-transparent hover:bg-[#ececec]"}`}
                    title={p.pin ? "มี PIN แล้ว (คลิกเปลี่ยน)" : "ตั้ง PIN เข้าดู report"}
                  >
                    {p.pin ? "🔐 PIN" : "ตั้ง PIN"}
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#f5f5f5] text-[#555] rounded-lg hover:bg-[#ececec] transition-colors"
                  >
                    {expanded === p.id ? "ยุบ" : "ประวัติ"}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#f5f5f5] text-[#555] rounded-lg hover:bg-[#ececec] transition-colors"
                  >
                    แก้ไข
                  </button>
                </div>
              </div>

              {/* Bank info bar */}
              {(p.bankAccount || p.bankName) && (
                <div className="px-4 pb-2.5 flex items-center gap-2 text-xs text-[#777]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                  <span>{[p.bankName, p.bankAccount].filter(Boolean).join(" · ")}</span>
                </div>
              )}

              {/* Payment history */}
              {expanded === p.id && (
                <div className="border-t border-[#f5f5f5]">
                  {p.payments.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-[#bbb] text-center">ยังไม่มีประวัติการจ่าย</p>
                  ) : (
                    <div className="divide-y divide-[#f8f8f8]">
                      {p.payments.map((pay) => (
                        <div key={pay.id} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-xs font-medium text-black">
                              ฿{pay.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            {pay.note && <p className="text-[11px] text-[#999] mt-0.5">{pay.note}</p>}
                          </div>
                          <p className="text-[11px] text-[#bbb]">
                            {format(new Date(pay.createdAt), "d MMM yy HH:mm", { locale: th })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 px-4 py-2.5 border-t border-[#f5f5f5]">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        p.isActive
                          ? "border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100"
                          : "border-green-200 text-green-600 bg-green-50 hover:bg-green-100"
                      }`}
                    >
                      {p.isActive ? "ระงับ" : "เปิดใช้งาน"}
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
              <h2 className="text-sm font-semibold text-black">{editingId ? "แก้ไขหุ้นส่วน" : "เพิ่มหุ้นส่วน"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#aaa] hover:text-black text-lg leading-none">×</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <Field label="ชื่อ *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="ชื่อหุ้นส่วน" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="อีเมล" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="email@example.com" />
                <Field label="เบอร์โทร" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="0812345678" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ธนาคาร" value={form.bankName} onChange={(v) => setForm((f) => ({ ...f, bankName: v }))} placeholder="กสิกร, SCB..." />
                <Field label="เลขบัญชี" value={form.bankAccount} onChange={(v) => setForm((f) => ({ ...f, bankAccount: v }))} placeholder="xxx-x-xxxxx-x" />
              </div>
              <Field
                label="สัดส่วน (%)"
                value={form.sharePercent}
                onChange={(v) => setForm((f) => ({ ...f, sharePercent: v }))}
                placeholder="25"
                type="number"
              />
              <Field label="หมายเหตุ" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="ข้อมูลเพิ่มเติม" />
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-[#f0f0f0]">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-[#555] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 text-sm font-semibold bg-black text-white rounded-lg hover:bg-[#222] disabled:opacity-40 transition-colors"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
              <h2 className="text-sm font-semibold text-black">บันทึกการจ่ายเงิน</h2>
              <button onClick={() => setPayPartner(null)} className="text-[#aaa] hover:text-black text-lg leading-none">×</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-[#999]">
                หุ้นส่วน: <span className="font-semibold text-black">{partners.find((p) => p.id === payPartner)?.name}</span>
              </p>
              <div>
                <label className="text-xs font-medium text-[#555] mb-1 block">จำนวนเงิน (บาท) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#555] mb-1 block">หมายเหตุ</label>
                <input
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="เช่น โอน PromptPay เดือน พ.ค. 2026"
                  className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-[#f0f0f0]">
              <button
                onClick={() => setPayPartner(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-[#555] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5] transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handlePay}
                disabled={paying || !payAmount || Number(payAmount) <= 0}
                className="flex-1 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                {paying ? "กำลังบันทึก..." : "บันทึกการจ่าย"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {pinPartnerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0]">
              <h2 className="text-sm font-semibold text-black">ตั้ง PIN เข้าดู Report</h2>
              <button onClick={() => setPinPartnerId(null)} className="text-[#aaa] hover:text-black text-lg leading-none">×</button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-[#888]">
                หุ้นส่วน: <span className="font-semibold text-black">{partners.find((p) => p.id === pinPartnerId)?.name}</span>
                {" "}จะใช้ <span className="font-semibold text-black">email + PIN</span> นี้เข้าดู report
              </p>
              <div>
                <label className="text-xs font-medium text-[#555] mb-1 block">PIN (อย่างน้อย 4 ตัว)</label>
                <input
                  type="password"
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                  placeholder="••••"
                  inputMode="numeric"
                  className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              {partners.find((p) => p.id === pinPartnerId)?.pin && (
                <button
                  onClick={() => { handleRemovePin(pinPartnerId); setPinPartnerId(null); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ลบ PIN (หุ้นส่วนจะเข้าไม่ได้จนกว่าจะตั้งใหม่)
                </button>
              )}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-[#f0f0f0]">
              <button
                onClick={() => setPinPartnerId(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-[#555] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5]"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSavePin}
                disabled={savingPin || pinValue.length < 4}
                className="flex-1 py-2.5 text-sm font-semibold bg-black text-white rounded-lg hover:bg-[#222] disabled:opacity-40"
              >
                {savingPin ? "กำลังบันทึก..." : "บันทึก PIN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-black mb-1">ลบหุ้นส่วน</p>
            <p className="text-xs text-[#888] mb-5">ข้อมูลและประวัติการจ่ายทั้งหมดจะถูกลบถาวร</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-[#555] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5]"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40"
              >
                {deleting ? "กำลังลบ..." : "ลบเลย"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[#555] mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
      />
    </div>
  );
}
