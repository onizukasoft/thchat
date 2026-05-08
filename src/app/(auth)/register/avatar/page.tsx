"use client";
import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";

function AvatarSetup() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? session?.user?.id ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");

  const displayName = session?.user?.name ?? "?";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setAvatarUrl(data.url);
      setUploaded(true);
    } else {
      setError(data.error || "อัปโหลดไม่สำเร็จ");
    }
    e.target.value = "";
  }

  function handleDone() {
    router.push(uid ? `/profile/${uid}` : "/");
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
      <div>
        <div className="text-4xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold text-purple-700">ยินดีต้อนรับ!</h1>
        <p className="text-gray-500 text-sm mt-1">ใส่รูปโปรไฟล์เพื่อให้คนอื่นรู้จักคุณ</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative group"
        >
          <Avatar className="w-28 h-28 ring-4 ring-purple-100">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-purple-200 text-purple-700 text-4xl">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading
              ? <Loader2 className="w-7 h-7 text-white animate-spin" />
              : <Camera className="w-7 h-7 text-white" />}
          </div>
          {uploaded && !uploading && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          )}
        </button>

        <p className="text-xs text-gray-400">คลิกเพื่อเลือกรูปจากเครื่อง (JPG, PNG, WebP ≤ 5 MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="space-y-2">
        <Button
          onClick={handleDone}
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={uploading}
        >
          {uploaded ? "เริ่มใช้งาน ThChat!" : "เริ่มใช้งานเลย"}
        </Button>
        {!uploaded && (
          <button
            type="button"
            onClick={handleDone}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
          >
            ข้ามขั้นตอนนี้
          </button>
        )}
      </div>
    </div>
  );
}

export default function AvatarSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-400">กำลังโหลด...</div>}>
        <AvatarSetup />
      </Suspense>
    </div>
  );
}
