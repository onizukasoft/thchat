"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

const FRAMES_PER_PAGE = 30;

const FRAMES = Array.from({ length: 30 }, (_, i) => {
  const id = `f${String(i + 1).padStart(2, "0")}`;
  return { id, src: `/frames/${id}.svg` };
});

type VipSettings = {
  vipLevel: string | null;
  vipUntil: string | null;
  showOnlineStatus: boolean;
  showProfileFrame: boolean;
  profileFrameId: string | null;
  allowCalls: boolean;
  avatar: string | null;
  lastSeen: string;
};

export default function PackagesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<VipSettings | null>(null);
  const [packageExpanded, setPackageExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [framePage, setFramePage] = useState(1);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/vip/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, [session?.user?.id]);

  async function patch(updates: Partial<VipSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...updates } : prev));
    setSaving(true);
    try {
      const res = await fetch("/api/vip/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings((prev) => (prev ? { ...prev, ...saved } : prev));
      } else {
        // rollback
        fetch("/api/vip/settings").then((r) => r.json()).then(setSettings);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!session?.user?.id) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <p className="text-gray-500">กรุณาเข้าสู่ระบบก่อน</p>
        <Button onClick={() => router.push("/login")}>เข้าสู่ระบบ</Button>
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;
  }

  const hasVip = settings.vipLevel && settings.vipUntil && new Date(settings.vipUntil) > new Date();

  if (!hasVip) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-bold">แพ็กเกจของฉัน</h1>
        <div className="bg-white rounded-2xl border p-6 text-center space-y-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="font-semibold text-gray-700">ยังไม่มีแพ็กเกจ</h2>
          <p className="text-sm text-gray-400">ซื้อแพ็กเกจ VIP เพื่อปลดล็อคฟีเจอร์พิเศษ</p>
          <Link href="/vip">
            <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 gap-2">
              <Crown className="w-4 h-4" />
              ดูแพ็กเกจ VIP
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const vipExpiry = new Date(settings.vipUntil!);
  const expiryLabel =
    vipExpiry.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    vipExpiry.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  const offlineTime = formatDistanceToNow(new Date(settings.lastSeen), { locale: th });

  const vipName =
    settings.vipLevel === "silver" ? "VIP Silver"
    : settings.vipLevel === "gold" ? "VIP Gold"
    : settings.vipLevel === "diamond" ? "VIP Diamond"
    : "VIP BASIC";

  const totalPages = Math.ceil(FRAMES.length / FRAMES_PER_PAGE);
  const pagedFrames = FRAMES.slice((framePage - 1) * FRAMES_PER_PAGE, framePage * FRAMES_PER_PAGE);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-1 py-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">ตั้งค่า VIP</h1>
        {saving && <span className="ml-auto text-xs text-gray-400">กำลังบันทึก...</span>}
      </div>

      <div className="space-y-4">
        {/* Package info */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <button
            onClick={() => setPackageExpanded(!packageExpanded)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="font-semibold">{vipName}</span>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>จะใช้ได้ถึง {expiryLabel}</span>
              {packageExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {packageExpanded && (
            <div className="px-5 pb-4 border-t bg-gray-50 pt-3">
              <Link href="/vip">
                <Button size="sm" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs">
                  ต่ออายุ / อัพเกรด
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Online status settings */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <h2 className="font-bold">ตั้งค่าสถานะออนไลน์</h2>
          <div className="flex items-center gap-8">
            <button
              onClick={() => patch({ showOnlineStatus: true })}
              className="flex items-center gap-2"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings.showOnlineStatus ? "border-pink-500" : "border-gray-300"}`}>
                {settings.showOnlineStatus && <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />}
              </div>
              <span className="text-sm">เปิดสถานะออนไลน์</span>
            </button>
            <button
              onClick={() => patch({ showOnlineStatus: false })}
              className="flex items-center gap-2"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!settings.showOnlineStatus ? "border-pink-500" : "border-gray-300"}`}>
                {!settings.showOnlineStatus && <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />}
              </div>
              <span className="text-sm">ปิดสถานะออนไลน์</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-full bg-orange-400 shrink-0" />
            <span>สถานะออฟไลน์ {offlineTime}</span>
          </div>
        </div>

        {/* Call settings */}
        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <h2 className="font-bold">ตั้งค่าการโทร</h2>
          <p className="text-xs text-gray-400">เฉพาะเพื่อนที่ยอมรับแล้วเท่านั้นที่โทรหาคุณได้</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">รับสายโทร / วิดีโอคอล</span>
            <button
              onClick={() => patch({ allowCalls: !settings.allowCalls })}
              className="flex items-center gap-2"
            >
              <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.allowCalls ? "bg-pink-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.allowCalls ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-500">{settings.allowCalls ? "เปิด" : "ปิด"}</span>
            </button>
          </div>
        </div>

        {/* Online page settings */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <h2 className="font-bold">ตั้งค่าหน้าออนไลน์</h2>

          {/* Avatar preview + frame toggle */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <Avatar className="w-16 h-16 rounded-lg">
                <AvatarImage src={session?.user?.image || ""} className="object-cover rounded-lg" />
                <AvatarFallback className="rounded-lg bg-purple-100 text-purple-600 text-xl">
                  {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              {settings.showProfileFrame && settings.profileFrameId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/frames/${settings.profileFrameId}.svg`}
                  alt=""
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}
            </div>

            <button
              onClick={() => patch({ showProfileFrame: !settings.showProfileFrame })}
              className="flex items-center gap-2"
            >
              <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.showProfileFrame ? "bg-pink-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.showProfileFrame ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm">แสดงกรอบรูปหน้าออนไลน์</span>
            </button>
          </div>

          {/* Frame grid */}
          <div className="grid grid-cols-5 gap-2">
            {pagedFrames.map((frame) => (
              <button
                key={frame.id}
                onClick={() => patch({ profileFrameId: frame.id, showProfileFrame: true })}
                className={`relative aspect-square rounded-md overflow-hidden bg-gray-100 transition-all ${
                  settings.profileFrameId === frame.id
                    ? "ring-2 ring-pink-500 ring-offset-1"
                    : "hover:opacity-80"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.src}
                  alt={frame.id}
                  className="absolute inset-0 w-full h-full"
                />
              </button>
            ))}
          </div>

          {/* Frame pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setFramePage((p) => Math.max(1, p - 1))}
                disabled={framePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded border bg-white disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setFramePage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-medium transition-colors ${
                    framePage === p
                      ? "bg-gray-700 text-white border-gray-700"
                      : "bg-white hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setFramePage((p) => Math.min(totalPages, p + 1))}
                disabled={framePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border bg-white disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
