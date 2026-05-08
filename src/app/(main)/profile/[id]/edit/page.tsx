"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, Loader2, ImagePlus, Video, Check } from "lucide-react";
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
    nickname: "", bio: "", avatar: "", coverImage: "", gender: "other", age: "", province: "", relationship: "single",
  });
  const [followMode, setFollowMode] = useState<"free" | "paid">("free");
  const [followPrice, setFollowPrice] = useState("10");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState("");
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
        setFollowPrice(String(u.followPrice));
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
    setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(endpoint, { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setForm((prev) => ({ ...prev, [field]: data.url }));
      setMessage("อัปโหลดรูปสำเร็จ!");
    } else {
      setMessage(data.error || "อัปโหลดไม่สำเร็จ");
    }
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
        followPrice: followMode === "paid" ? Number(followPrice) || 10 : null,
      }),
    });
    if (res.ok) {
      setMessage("บันทึกสำเร็จ!");
      setTimeout(() => router.push(`/profile/${userId}`), 1000);
    } else {
      setMessage("เกิดข้อผิดพลาด");
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
    setMessage("บันทึกกรอบรูปสำเร็จ!");
    setTimeout(() => setMessage(""), 2000);
  }

  const displayName = form.nickname || session?.user?.name || "?";

  return (
    <div className="max-w-md mx-auto">
      <Link href={`/profile/${userId}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ArrowLeft className="w-4 h-4" />
        กลับโปรไฟล์
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>แก้ไขโปรไฟล์</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Cover image */}
            <div className="space-y-1">
              <Label>รูปปก</Label>
              <div
                onClick={() => coverInputRef.current?.click()}
                className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 cursor-pointer group border border-dashed border-gray-300 hover:border-blue-400 transition-colors"
              >
                {form.coverImage && (
                  <img src={form.coverImage} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingCover
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <><ImagePlus className="w-6 h-6 text-white" /><span className="text-white text-xs mt-1">เปลี่ยนรูปปก</span></>}
                </div>
                {!form.coverImage && !uploadingCover && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <ImagePlus className="w-7 h-7" />
                    <span className="text-xs mt-1">คลิกเพื่อเพิ่มรูปปก</span>
                  </div>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onCoverChange} />
              <p className="text-xs text-gray-400">JPG, PNG, WebP ≤ 10 MB</p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <Label>รูปโปรไฟล์ / วิดีโอโปรไฟล์</Label>
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="relative group">
                <UserAvatar src={form.avatar} fallback={displayName[0]} className="w-24 h-24 ring-4 ring-purple-100" />
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                </div>
              </button>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Camera className="w-3 h-3" /> รูป JPG/PNG ≤ 5 MB</span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1"><Video className="w-3 h-3" /> วิดีโอ MP4/WebM ≤ 30 MB</span>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" className="hidden" onChange={onAvatarChange} />
            </div>

            {/* Frame picker - VIP only */}
            {vipLevel && (
              <div className="space-y-2 border rounded-xl p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">กรอบโปรไฟล์ VIP</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showFrame;
                      setShowFrame(next);
                      saveFrame(selectedFrame, next);
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 select-none"
                  >
                    <div
                      className="relative w-10 h-6 rounded-full transition-colors duration-200"
                      style={{ backgroundColor: showFrame ? "#a855f7" : "#d1d5db" }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                        style={{
                          transition: "transform 0.2s",
                          transform: showFrame ? "translateX(16px)" : "translateX(0)",
                        }}
                      />
                    </div>
                    แสดงกรอบ
                  </button>
                </div>
                <p className="text-xs text-gray-500">เลือกกรอบที่ต้องการแสดงบนรูปโปรไฟล์</p>

                {/* No frame option */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedFrame(null); saveFrame(null, showFrame); }}
                    className={`relative flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all ${!selectedFrame ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-xs">ไม่มี</div>
                    {!selectedFrame && <Check className="absolute top-1 right-1 w-3 h-3 text-purple-600" />}
                  </button>

                  {FRAMES.filter((f) => canUseFrame(f, vipLevel)).map((frame) => (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => { setSelectedFrame(frame.id); saveFrame(frame.id, showFrame); }}
                      className={`relative flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all ${selectedFrame === frame.id ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}
                    >
                      <div className="relative w-14 h-14">
                        <UserAvatar
                          src={form.avatar}
                          fallback={displayName[0]}
                          className="w-14 h-14"
                          frameId={frame.id}
                        />
                      </div>
                      <span className="text-[10px] text-center leading-tight text-gray-600 truncate w-full">{frame.name}</span>
                      {selectedFrame === frame.id && <Check className="absolute top-1 right-1 w-3 h-3 text-purple-600" />}
                    </button>
                  ))}
                </div>

                {/* Locked frames preview */}
                {FRAMES.filter((f) => !canUseFrame(f, vipLevel)).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mt-2 mb-1">ต้องการ VIP ระดับสูงกว่า</p>
                    <div className="grid grid-cols-4 gap-2">
                      {FRAMES.filter((f) => !canUseFrame(f, vipLevel)).map((frame) => (
                        <div key={frame.id} className="flex flex-col items-center gap-1 p-1 rounded-lg border-2 border-gray-100 opacity-50">
                          <div className="relative w-14 h-14">
                            <UserAvatar src={form.avatar} fallback={displayName[0]} className="w-14 h-14" frameId={frame.id} />
                            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">{frame.minVip.toUpperCase()[0]}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-center leading-tight text-gray-400 truncate w-full">{frame.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {savingFrame && <p className="text-xs text-purple-500 text-center">กำลังบันทึก...</p>}
              </div>
            )}

            <div className="space-y-1">
              <Label>ชื่อที่แสดง</Label>
              <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="ชื่อเล่น" />
            </div>
            <div className="space-y-1">
              <Label>เกี่ยวกับฉัน</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="บอกเล่าเกี่ยวกับตัวเอง..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>เพศ</Label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800">
                  <option value="other">ไม่ระบุ</option>
                  <option value="male">ชาย ♂</option>
                  <option value="female">หญิง ♀</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>อายุ</Label>
                <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="อายุ" min={13} max={100} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>สถานะความสัมพันธ์</Label>
              <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800">
                <option value="single">โสด</option>
                <option value="taken">คบแล้ว</option>
                <option value="complicated">ซับซ้อน</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>จังหวัด</Label>
              <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800">
                <option value="">-- ไม่ระบุ --</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Friend Request Settings */}
            <div className="space-y-3 border rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
              <Label className="text-base font-semibold">การตั้งค่าการเพิ่มเพื่อน</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFollowMode("free")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    followMode === "free"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                >
                  <span className="text-2xl">🆓</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">ฟรี</span>
                  <span className="text-xs text-gray-400 text-center">ใครก็ส่งคำขอได้</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFollowMode("paid")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    followMode === "paid"
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-yellow-300"
                  }`}
                >
                  <span className="text-2xl">🪙</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">เสียเหรียญ</span>
                  <span className="text-xs text-gray-400 text-center">ต้องจ่ายเหรียญ</span>
                </button>
              </div>
              {followMode === "paid" && (
                <div className="space-y-1">
                  <Label className="text-sm">ราคา (เหรียญ)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={followPrice}
                      onChange={(e) => setFollowPrice(e.target.value)}
                      min={1}
                      max={9999}
                      placeholder="10"
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">เหรียญต่อคำขอ</span>
                  </div>
                  <p className="text-xs text-gray-400">ผู้ที่ส่งคำขอจะถูกหักเหรียญทันที</p>
                </div>
              )}
            </div>

            {message && (
              <p className={`text-sm text-center font-medium ${message.includes("สำเร็จ") ? "text-green-600" : "text-red-500"}`}>
                {message}
              </p>
            )}
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600" disabled={saving || uploadingAvatar || uploadingCover}>
              {saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
