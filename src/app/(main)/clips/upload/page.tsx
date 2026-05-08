"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, X, Lock, Globe, Loader2, Film, Image as ImageIcon, Coins, ShoppingBag } from "lucide-react";

export default function ClipUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [isCreator, setIsCreator] = useState<boolean | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState(99);
  const [bio, setBio] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accessMode, setAccessMode] = useState<"free" | "subscriber" | "ppv">("free");
  const [lockedPrice, setLockedPrice] = useState<number | "">(50);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/creator/${session.user.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setIsCreator(!!d))
      .catch(() => setIsCreator(false));
  }, [session?.user?.id]);

  async function setupCreator() {
    if (!session?.user?.id) return;
    setSettingUp(true);
    setError("");
    const res = await fetch(`/api/creator/${session.user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, monthlyPrice }),
    });
    setSettingUp(false);
    if (res.ok) setIsCreator(true);
    else setError("เกิดข้อผิดพลาด");
  }

  function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function onThumbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoFile || !title.trim()) return;
    setUploading(true);
    setError("");

    try {
      setProgress("กำลังอัปโหลดวิดีโอ...");
      const vfd = new FormData();
      vfd.append("file", videoFile);
      vfd.append("type", "video");
      const vRes = await fetch("/api/clips/upload", { method: "POST", body: vfd });
      if (!vRes.ok) throw new Error("อัปโหลดวิดีโอไม่สำเร็จ");
      const { url: videoUrl } = await vRes.json();

      let thumbnailUrl: string | null = null;
      if (thumbFile) {
        setProgress("กำลังอัปโหลด thumbnail...");
        const tfd = new FormData();
        tfd.append("file", thumbFile);
        tfd.append("type", "thumbnail");
        const tRes = await fetch("/api/clips/upload", { method: "POST", body: tfd });
        if (tRes.ok) ({ url: thumbnailUrl } = await tRes.json());
      }

      setProgress("กำลังบันทึก...");
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        videoUrl,
        thumbnailUrl,
        isSubscriberOnly: accessMode === "subscriber",
        lockedPrice: accessMode === "ppv" && lockedPrice ? lockedPrice : null,
      }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");

      router.push(`/creator/${session?.user?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setUploading(false);
      setProgress("");
    }
  }

  if (!session?.user?.id) return (
    <div className="text-center py-20 text-gray-400 text-sm">กรุณาเข้าสู่ระบบ</div>
  );

  if (isCreator === null) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
  );

  // Creator setup flow
  if (!isCreator) return (
    <div className="max-w-md mx-auto py-8 space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
          <Film className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold">เปิด Creator Mode</h1>
        <p className="text-sm text-gray-400 mt-1">ตั้งค่าช่องของคุณเพื่อเริ่มอัปโหลดคลิป</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">แนะนำตัว</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="บอกผู้ติดตามว่าคุณทำคอนเทนต์อะไร..."
            rows={3}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 resize-none dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-500" />
            ราคาสมาชิก (เหรียญ/เดือน)
          </label>
          <input
            type="number"
            min={1}
            max={9999}
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(Number(e.target.value))}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-800"
          />
          <p className="text-xs text-gray-400 mt-1">คุณจะได้รับ {Math.floor(monthlyPrice * 0.8)} เหรียญ (หัก 20% ค่าแพลตฟอร์ม)</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={setupCreator}
          disabled={settingUp}
          className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {settingUp && <Loader2 className="w-4 h-4 animate-spin" />}
          เปิด Creator Mode
        </button>
      </div>
    </div>
  );

  // Upload form
  return (
    <div className="max-w-lg mx-auto py-4 space-y-4">
      <h1 className="text-lg font-bold">อัปโหลดคลิปใหม่</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Video picker */}
        <div
          onClick={() => videoInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden aspect-video flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:border-indigo-400 transition-colors"
        >
          {videoPreview ? (
            <video src={videoPreview} className="w-full h-full object-contain" controls />
          ) : (
            <div className="text-center p-6">
              <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">คลิกเพื่อเลือกวิดีโอ</p>
              <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV สูงสุด 500 MB</p>
            </div>
          )}
        </div>
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={onVideoChange} />

        {/* Thumbnail */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => thumbInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-gray-400" />
            {thumbPreview ? "เปลี่ยน Thumbnail" : "เพิ่ม Thumbnail"}
          </button>
          {thumbPreview && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbPreview} alt="" className="w-16 h-10 rounded-lg object-cover border" />
              <button type="button" onClick={() => { setThumbPreview(null); setThumbFile(null); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-600 text-white rounded-full flex items-center justify-center">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
        <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={onThumbChange} />

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อคลิป *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ใส่ชื่อคลิป..."
            maxLength={100}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-800"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">คำอธิบาย</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายเนื้อหาคลิป..."
            rows={3}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300 resize-none dark:bg-gray-800"
          />
        </div>

        {/* Access toggle */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold">การเข้าถึง</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAccessMode("free")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${accessMode === "free" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-gray-200 dark:border-gray-700"}`}
            >
              <Globe className={`w-5 h-5 ${accessMode === "free" ? "text-indigo-500" : "text-gray-400"}`} />
              <span className={`text-xs font-medium ${accessMode === "free" ? "text-indigo-600" : "text-gray-500"}`}>ฟรี</span>
              <span className="text-[10px] text-gray-400">ทุกคนดูได้</span>
            </button>
            <button
              type="button"
              onClick={() => setAccessMode("subscriber")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${accessMode === "subscriber" ? "border-purple-500 bg-purple-50 dark:bg-purple-950" : "border-gray-200 dark:border-gray-700"}`}
            >
              <Lock className={`w-5 h-5 ${accessMode === "subscriber" ? "text-purple-500" : "text-gray-400"}`} />
              <span className={`text-xs font-medium ${accessMode === "subscriber" ? "text-purple-600" : "text-gray-500"}`}>สมาชิก</span>
              <span className="text-[10px] text-gray-400">ต้องสมัครดู</span>
            </button>
            <button
              type="button"
              onClick={() => setAccessMode("ppv")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${accessMode === "ppv" ? "border-amber-500 bg-amber-50 dark:bg-amber-950" : "border-gray-200 dark:border-gray-700"}`}
            >
              <ShoppingBag className={`w-5 h-5 ${accessMode === "ppv" ? "text-amber-500" : "text-gray-400"}`} />
              <span className={`text-xs font-medium ${accessMode === "ppv" ? "text-amber-600" : "text-gray-500"}`}>PPV</span>
              <span className="text-[10px] text-gray-400">ซื้อรายคลิป</span>
            </button>
          </div>

          {accessMode === "ppv" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                ราคาปลดล็อค (เหรียญ)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={lockedPrice}
                  onChange={(e) => setLockedPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="เช่น 50"
                  className="flex-1 text-sm border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300 dark:bg-gray-900"
                />
                <div className="text-xs text-gray-400 shrink-0">
                  คุณได้รับ{" "}
                  <span className="font-semibold text-amber-600">
                    {lockedPrice ? Math.floor(Number(lockedPrice) * 0.8) : 0}
                  </span>{" "}
                  เหรียญ
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={!videoFile || !title.trim() || uploading || (accessMode === "ppv" && !lockedPrice)}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{progress}</>
          ) : (
            <><Upload className="w-4 h-4" />เผยแพร่คลิป</>
          )}
        </button>
      </form>
    </div>
  );
}
