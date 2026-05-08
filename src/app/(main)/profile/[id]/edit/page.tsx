"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, ImagePlus, Check, Video } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { PROVINCES } from "@/lib/provinces";
import { FRAMES, canUseFrame } from "@/lib/frames";

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nickname: "", bio: "", avatar: "", coverImage: "",
    gender: "other", age: "", province: "", relationship: "single",
  });
  const [followMode, setFollowMode] = useState<"free" | "paid">("free");
  const [followPrice, setFollowPrice] = useState("99");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState("");
  const [msgOk, setMsgOk] = useState(true);
  const [vipLevel, setVipLevel] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [showFrame, setShowFrame] = useState(false);
  const [savingFrame, setSavingFrame] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) { router.push("/"); return; }
    if (session.user.id !== userId) { router.push("/"); return; }
    fetch(`/api/users/${userId}`).then((r) => r.json()).then((u) => {
      setForm({
        nickname: u.nickname || "",
        bio: u.bio || "",
        avatar: u.avatar || "",
        coverImage: u.coverImage || "",
        gender: u.gender || "other",
        age: u.age ? String(u.age) : "",
        province: u.province || "",
        relationship: u.relationship || "single",
      });
      setVipLevel(u.vipLevel ?? null);
      if (u.followPrice && u.followPrice > 0) {
        setFollowMode("paid");
        setFollowPrice(String(Math.round(u.followPrice / 100)));
      } else {
        setFollowMode("free");
      }
    });
    fetch(`/api/users/${userId}/frame`).then((r) => r.json()).then((d) => {
      setSelectedFrame(d.frameId ?? null);
      setShowFrame(d.showProfileFrame ?? false);
    });
  }, [session, status, userId, router]);

  async function uploadFile(file: File, endpoint: string, field: "avatar" | "coverImage", setLoading: (v: boolean) => void) {
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(endpoint, { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setForm((prev) => ({ ...prev, [field]: data.url }));
      toast("อัปโหลดรูปสำเร็จ!", true);
    } else {
      toast(data.error || "อัปโหลดไม่สำเร็จ", false);
    }
  }

  function toast(msg: string, ok: boolean) {
    setMessage(msg); setMsgOk(ok);
    setTimeout(() => setMessage(""), 3000);
  }

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "/api/upload/avatar", "avatar", setUploadingAvatar);
    e.target.value = "";
  }

  function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, "/api/upload/cover", "coverImage", setUploadingCover);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: form.age ? Number(form.age) : null,
        followPrice: followMode === "paid" ? Math.floor((Number(followPrice) || 99) * 100) : null,
      }),
    });
    if (res.ok) {
      toast("บันทึกสำเร็จ!", true);
      setTimeout(() => router.push(`/profile/${userId}`), 1000);
    } else {
      toast("เกิดข้อผิดพลาด", false);
    }
    setSaving(false);
  }

  async function saveFrame(frameId: string | null, show: boolean) {
    setSavingFrame(true);
    await fetch(`/api/users/${userId}/frame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameId, showProfileFrame: show }),
    });
    setSavingFrame(false);
    toast("บันทึกกรอบรูปสำเร็จ!", true);
  }

  const displayName = form.nickname || session?.user?.name || "?";
  const paidThb = Number(followPrice) || 0;
  const earns = Math.floor(paidThb * 0.8);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onCoverChange} />
      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="hidden" onChange={onAvatarChange} />

      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur border-b border-gray-100">
        <Link href={`/profile/${userId}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Link>
        <h1 className="text-sm font-semibold text-gray-900">แก้ไขโปรไฟล์</h1>
        <button
          form="edit-form"
          type="submit"
          disabled={saving || uploadingAvatar || uploadingCover}
          className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          บันทึก
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg ${msgOk ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {message}
        </div>
      )}

      <form id="edit-form" onSubmit={handleSubmit} className="max-w-lg mx-auto pb-20">

        {/* ─── Photos ─── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div
            onClick={() => coverInputRef.current?.click()}
            className="relative h-32 bg-gray-100 cursor-pointer group"
          >
            {form.coverImage
              ? <img src={form.coverImage} alt="" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 flex flex-col items-center justify-center gap-1">
                  <ImagePlus className="w-6 h-6 text-violet-300" />
                  <span className="text-xs text-violet-300">เพิ่มรูปปก</span>
                </div>
              )
            }
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingCover ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </div>
          </div>

          <div className="flex items-end gap-4 px-4 -mt-8 pb-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative w-20 h-20 rounded-2xl border-4 border-white shadow-md shrink-0 group"
            >
              <UserAvatar src={form.avatar} fallback={displayName[0]} className="w-full h-full" />
              <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
            </button>
            <div className="pb-1">
              <p className="text-xs font-semibold text-gray-700">{displayName}</p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5"><Camera className="w-3 h-3" /> รูป JPG/PNG</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Video className="w-3 h-3" /> วิดีโอ MP4</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── VIP Frame picker ─── */}
        {vipLevel && (
          <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">กรอบโปรไฟล์ VIP</p>
                <p className="text-xs text-gray-400 mt-0.5">เลือกกรอบที่ต้องการแสดง</p>
              </div>
              <button
                type="button"
                onClick={() => { const next = !showFrame; setShowFrame(next); saveFrame(selectedFrame, next); }}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <div className="relative w-9 h-5 rounded-full transition-colors duration-200" style={{ backgroundColor: showFrame ? "#7c3aed" : "#d1d5db" }}>
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" style={{ transform: showFrame ? "translateX(16px)" : "translateX(0)" }} />
                </div>
                แสดงกรอบ
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedFrame(null); saveFrame(null, showFrame); }}
                  className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all ${!selectedFrame ? "border-violet-500 bg-violet-50" : "border-gray-100 hover:border-violet-200"}`}
                >
                  <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 text-xs">ไม่มี</div>
                  {!selectedFrame && <Check className="absolute top-1 right-1 w-3 h-3 text-violet-600" />}
                </button>
                {FRAMES.filter((f) => canUseFrame(f, vipLevel)).map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => { setSelectedFrame(frame.id); saveFrame(frame.id, showFrame); }}
                    className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all ${selectedFrame === frame.id ? "border-violet-500 bg-violet-50" : "border-gray-100 hover:border-violet-200"}`}
                  >
                    <UserAvatar src={form.avatar} fallback={displayName[0]} className="w-14 h-14" frameId={frame.id} />
                    <span className="text-[10px] text-gray-500 truncate w-full text-center">{frame.name}</span>
                    {selectedFrame === frame.id && <Check className="absolute top-1 right-1 w-3 h-3 text-violet-600" />}
                  </button>
                ))}
              </div>
              {FRAMES.filter((f) => !canUseFrame(f, vipLevel)).length > 0 && (
                <>
                  <p className="text-xs text-gray-400 mt-3 mb-2">ต้องการ VIP ระดับสูงกว่า</p>
                  <div className="grid grid-cols-4 gap-2">
                    {FRAMES.filter((f) => !canUseFrame(f, vipLevel)).map((frame) => (
                      <div key={frame.id} className="flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 border-gray-100 opacity-40">
                        <div className="relative w-14 h-14">
                          <UserAvatar src={form.avatar} fallback={displayName[0]} className="w-14 h-14" frameId={frame.id} />
                          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">{frame.minVip.toUpperCase()[0]}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 truncate w-full text-center">{frame.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {savingFrame && <p className="text-xs text-violet-500 text-center mt-2">กำลังบันทึก...</p>}
            </div>
          </div>
        )}

        {/* ─── Basic info ─── */}
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">ข้อมูลพื้นฐาน</p>
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">ชื่อที่แสดง</label>
              <input
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="ชื่อเล่น"
                maxLength={30}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-300 bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">เกี่ยวกับฉัน</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="บอกเล่าเกี่ยวกับตัวเอง..."
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-300 bg-white transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* ─── Personal details ─── */}
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">ข้อมูลส่วนตัว</p>
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">เพศ</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-300 bg-white transition appearance-none"
                >
                  <option value="other">ไม่ระบุ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">อายุ</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="อายุ"
                  min={13}
                  max={100}
                  className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-300 bg-white transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">สถานะความสัมพันธ์</label>
              <select
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-300 bg-white transition appearance-none"
              >
                <option value="single">โสด</option>
                <option value="taken">คบแล้ว</option>
                <option value="complicated">ซับซ้อน</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">จังหวัด</label>
              <select
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-300 bg-white transition appearance-none"
              >
                <option value="">-- ไม่ระบุ --</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ─── Friend request settings ─── */}
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">การตั้งค่าคำขอเพิ่มเพื่อน</p>
          <div className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFollowMode("free")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${followMode === "free" ? "border-violet-500 bg-violet-50" : "border-gray-100 hover:border-violet-200"}`}
              >
                <span className="text-2xl">🆓</span>
                <span className="text-sm font-semibold text-gray-700">ฟรี</span>
                <span className="text-xs text-gray-400 text-center">ใครก็ส่งคำขอได้</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowMode("paid")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${followMode === "paid" ? "border-amber-500 bg-amber-50" : "border-gray-100 hover:border-amber-200"}`}
              >
                <span className="text-2xl">💳</span>
                <span className="text-sm font-semibold text-gray-700">ชำระเงิน</span>
                <span className="text-xs text-gray-400 text-center">ต้องจ่ายเงิน (Stripe)</span>
              </button>
            </div>

            {followMode === "paid" && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-gray-600">ราคา (บาท)</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">฿</span>
                    <input
                      type="number"
                      value={followPrice}
                      onChange={(e) => setFollowPrice(e.target.value)}
                      min={1}
                      max={9999}
                      placeholder="99"
                      className="w-full h-10 pl-7 pr-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-300 bg-white transition"
                    />
                  </div>
                  <span className="text-sm text-gray-400 shrink-0">บาท / คำขอ</span>
                </div>
                {paidThb > 0 && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                    <span className="text-xs text-amber-700">คุณจะได้รับ 80%</span>
                    <span className="text-sm font-bold text-amber-700">฿{earns}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400">ผู้ส่งคำขอชำระผ่าน Stripe — ระบบหัก 20% ค่าธรรมเนียม</p>
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
