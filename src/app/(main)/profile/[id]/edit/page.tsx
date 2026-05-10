"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2, Video, ChevronDown } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { PROVINCES } from "@/lib/provinces";

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
      if (u.followPrice && u.followPrice > 0) {
        setFollowMode("paid");
        setFollowPrice(String(Math.round(u.followPrice / 100)));
      } else {
        setFollowMode("free");
      }
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
      toast("อัปโหลดสำเร็จ!", true);
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

const displayName = form.nickname || session?.user?.name || "?";
  const paidThb = Number(followPrice) || 0;
  const earns = Math.floor(paidThb * 0.8);

  return (
    <div className="min-h-screen bg-gray-50">
      <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onCoverChange} />
      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="hidden" onChange={onAvatarChange} />

      {/* Toast */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl transition-all ${msgOk ? "bg-gray-900 text-white" : "bg-red-500 text-white"}`}>
          {message}
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100">
        <Link href={`/profile/${userId}`} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-[15px] font-semibold text-gray-900">แก้ไขโปรไฟล์</span>
        <button
          form="edit-form"
          type="submit"
          disabled={saving || uploadingAvatar || uploadingCover}
          className="h-8 px-4 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-[13px] font-semibold rounded-full transition-colors flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          บันทึก
        </button>
      </div>

      <form id="edit-form" onSubmit={handleSubmit} className="max-w-lg mx-auto pb-24">

        {/* ─── Hero photo section ─── */}
        <div className="relative mb-16">
          {/* Cover */}
          <div
            onClick={() => coverInputRef.current?.click()}
            className="relative h-44 cursor-pointer group overflow-hidden"
          >
            {form.coverImage ? (
              <img src={form.coverImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-200 via-gray-200 to-zinc-300" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full">
                {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                เปลี่ยนรูปปก
              </div>
            </div>
          </div>

          {/* Avatar — floating over cover */}
          <div className="absolute -bottom-12 left-5">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="relative w-24 h-24 rounded-2xl border-4 border-white shadow-lg group"
            >
              <UserAvatar src={form.avatar} fallback={displayName[0]} className="w-full h-full rounded-xl" />
              <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />}
                </div>
              </div>
            </button>
          </div>

          {/* Hint beside avatar */}
          <div className="absolute -bottom-10 left-36 flex flex-col gap-0.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Camera className="w-3 h-3" /> รูปโปรไฟล์ JPG/PNG/GIF
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Video className="w-3 h-3" /> วิดีโอ MP4 ได้เลย
            </span>
          </div>
        </div>

        {/* ─── Fields ─── */}
        <div className="px-4 space-y-3">

          {/* Nickname */}
          <Field label="ชื่อที่แสดง">
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              placeholder="ชื่อเล่น"
              maxLength={30}
              className={inputCls}
            />
          </Field>

          {/* Bio */}
          <Field label="เกี่ยวกับฉัน">
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="บอกเล่าเกี่ยวกับตัวเอง..."
              rows={3}
              maxLength={200}
              className={`${inputCls} resize-none py-2.5 h-auto`}
            />
            <span className="absolute bottom-3 right-3 text-[11px] text-gray-300">{form.bio.length}/200</span>
          </Field>

          {/* Gender + Age */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="เพศ">
              <div className="relative">
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className={`${inputCls} appearance-none pr-8`}
                >
                  <option value="other">ไม่ระบุ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>
            <Field label="อายุ">
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="เช่น 22"
                min={13} max={100}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Relationship */}
          <Field label="สถานะ">
            <div className="relative">
              <select
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                className={`${inputCls} appearance-none pr-8`}
              >
                <option value="single">โสด 💫</option>
                <option value="taken">คบแล้ว ❤️</option>
                <option value="complicated">ซับซ้อน 🌀</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* Province */}
          <Field label="จังหวัด">
            <div className="relative">
              <select
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className={`${inputCls} appearance-none pr-8`}
              >
                <option value="">-- ไม่ระบุ --</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          {/* ─── Friend request ─── */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">คำขอเพิ่มเพื่อน</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFollowMode("free")}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${followMode === "free" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
              >
                <span className="text-2xl">🆓</span>
                <div>
                  <p className="text-sm font-semibold">ฟรี</p>
                  <p className={`text-[11px] ${followMode === "free" ? "text-gray-300" : "text-gray-400"}`}>ใครก็ส่งได้</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFollowMode("paid")}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${followMode === "paid" ? "border-amber-500 bg-amber-500 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-amber-200"}`}
              >
                <span className="text-2xl">💳</span>
                <div>
                  <p className="text-sm font-semibold">ชำระเงิน</p>
                  <p className={`text-[11px] ${followMode === "paid" ? "text-amber-100" : "text-gray-400"}`}>ต้องจ่าย</p>
                </div>
              </button>
            </div>

            {followMode === "paid" && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">฿</span>
                  <input
                    type="number"
                    value={followPrice}
                    onChange={(e) => setFollowPrice(e.target.value)}
                    min={1} max={9999}
                    placeholder="99"
                    className={`${inputCls} pl-7`}
                  />
                </div>
                {paidThb > 0 && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                    <span className="text-xs text-amber-600">คุณได้รับ 80%</span>
                    <span className="text-sm font-bold text-amber-600">฿{earns} / คำขอ</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}

const inputCls = "relative w-full h-11 px-3 text-[14px] bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all placeholder-gray-300 text-gray-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
