"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Upload, Video, X, Loader2,
  Lock, Globe, Coins, ChevronDown,
} from "lucide-react";

const CATEGORIES = [
  { value: "general", label: "ทั่วไป" },
  { value: "funny", label: "ตลก" },
  { value: "music", label: "เพลง" },
  { value: "dance", label: "เต้น" },
  { value: "food", label: "อาหาร" },
  { value: "travel", label: "ท่องเที่ยว" },
  { value: "sport", label: "กีฬา" },
  { value: "knowledge", label: "ความรู้" },
];

export default function PostClipPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("กรุณาเลือกไฟล์วิดีโอเท่านั้น");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError("วิดีโอต้องมีขนาดไม่เกิน 200 MB");
      return;
    }
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setVideoFile(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function removeVideo() {
    if (preview) URL.revokeObjectURL(preview);
    setVideoFile(null);
    setPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoFile) { setError("กรุณาเลือกวิดีโอก่อน"); return; }
    if (!content.trim()) { setError("กรุณาใส่คำบรรยาย"); return; }
    setError("");

    // Upload video
    setUploading(true);
    setUploadProgress(0);
    const fd = new FormData();
    fd.append("files", videoFile);

    // Simulate progress via polling (XHR for real progress)
    const xhr = new XMLHttpRequest();
    const uploadUrl = await new Promise<string | null>((resolve) => {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200) resolve(data.files?.[0]?.url ?? null);
        else { setError(data.error ?? "อัปโหลดล้มเหลว"); resolve(null); }
      };
      xhr.onerror = () => { setError("อัปโหลดล้มเหลว"); resolve(null); };
      xhr.open("POST", "/api/upload/post");
      xhr.send(fd);
    });
    setUploading(false);

    if (!uploadUrl) { setSubmitting(false); return; }

    // Create post
    setSubmitting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || content.slice(0, 80),
        content,
        category,
        mediaUrls: [{ url: uploadUrl, type: "video" }],
        isPaid,
        price: isPaid ? price : 0,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "โพสต์ล้มเหลว");
      return;
    }
    router.push("/board");
  }

  const isLoading = uploading || submitting;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-white flex-1">โพสต์คลิป</h1>
        <button
          form="clip-form"
          type="submit"
          disabled={isLoading || !videoFile}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {uploading ? `อัปโหลด ${uploadProgress}%` : submitting ? "กำลังโพสต์..." : "โพสต์"}
        </button>
      </div>

      <form id="clip-form" onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Video upload area */}
        {!preview ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[9/16] max-h-[60vh] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4 transition-colors hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-900/10"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Video className="w-8 h-8 text-purple-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">แตะเพื่อเลือกวิดีโอ</p>
              <p className="text-xs text-gray-400 mt-1">MP4, MOV, WebM · สูงสุด 200 MB</p>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 text-white text-sm font-medium">
              <Upload className="w-4 h-4" />
              เลือกวิดีโอ
            </div>
          </button>
        ) : (
          <div className="relative w-full aspect-[9/16] max-h-[60vh] rounded-2xl overflow-hidden bg-black">
            <video
              src={preview}
              className="w-full h-full object-contain"
              controls
              playsInline
            />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-white text-sm font-medium">{uploadProgress}%</p>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/mov"
          className="hidden"
          onChange={onFileChange}
        />

        {/* Caption */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 space-y-3 border border-gray-100 dark:border-gray-800">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="หัวข้อ (ไม่บังคับ)"
            className="w-full text-sm bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-400 border-b border-gray-100 dark:border-gray-800 pb-3"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="เขียนคำบรรยาย... *"
            rows={3}
            required
            className="w-full text-sm bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-400 resize-none"
          />
        </div>

        {/* Category */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">หมวดหมู่</label>
          <div className="relative mt-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 outline-none pr-9"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Paywall settings */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? "bg-amber-100 dark:bg-amber-900/30" : "bg-green-100 dark:bg-green-900/30"}`}>
                {isPaid
                  ? <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  : <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {isPaid ? "คลิปแบบเสียเงิน" : "คลิปฟรี"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {isPaid ? "ผู้ดูต้องจ่ายเหรียญเพื่อดู" : "ทุกคนดูได้ฟรี"}
                </p>
              </div>
            </div>
            {/* Toggle */}
            <button
              type="button"
              onClick={() => setIsPaid((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isPaid ? "bg-amber-500" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPaid ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {isPaid && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-4">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ราคา (เหรียญ)</label>
              <div className="flex items-center gap-3 mt-2">
                <div className="relative flex-1">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="number"
                    min={5}
                    max={9999}
                    value={price}
                    onChange={(e) => setPrice(Math.max(5, Number(e.target.value)))}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-amber-400"
                  />
                </div>
                <span className="text-xs text-gray-400 shrink-0">คุณได้รับ 70%</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[20, 50, 100, 200].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPrice(v)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      price === v
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                คุณรับ <span className="text-amber-600 font-semibold">{Math.floor(price * 0.7)} เหรียญ</span> ต่อการซื้อ 1 ครั้ง
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </form>
    </div>
  );
}
