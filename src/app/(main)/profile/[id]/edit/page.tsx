"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Loader2, ImagePlus } from "lucide-react";
import Link from "next/link";
import { PROVINCES } from "@/lib/provinces";

export default function EditProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nickname: "", bio: "", avatar: "", coverImage: "", gender: "other", age: "", province: "", relationship: "single",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session?.user?.id !== userId) { router.push("/"); return; }
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
    });
  }, [session, userId, router]);

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
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("บันทึกสำเร็จ!");
      setTimeout(() => router.push(`/profile/${userId}`), 1000);
    } else {
      setMessage("เกิดข้อผิดพลาด");
    }
    setSaving(false);
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
              <Label>รูปโปรไฟล์</Label>
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="relative group">
                <Avatar key={form.avatar} className="w-24 h-24 ring-4 ring-purple-100">
                  <AvatarImage src={form.avatar || ""} />
                  <AvatarFallback className="bg-purple-200 text-purple-700 text-3xl">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                </div>
              </button>
              <p className="text-xs text-gray-400">คลิกเพื่อเปลี่ยนรูปโปรไฟล์ (JPG, PNG, WebP ≤ 5 MB)</p>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onAvatarChange} />
            </div>

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
