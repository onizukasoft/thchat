"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Coins, CheckCircle2, Lock, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";

type TaskStatus = {
  claimable: boolean;
  hasAvatar?: boolean;
  hasBio?: boolean;
  claimedToday?: number;
};
type Tasks = Record<string, TaskStatus>;

const TASK_META = [
  {
    key: "daily_login",
    icon: "📅",
    label: "เข้าสู่ระบบประจำวัน",
    desc: "เข้าสู่ระบบทุกวันเพื่อรับเหรียญ (รีเซ็ตทุกเที่ยงคืน)",
    coins: 10,
    repeat: "ทุกวัน",
    action: null,
  },
  {
    key: "complete_profile",
    icon: "✏️",
    label: "ทำโปรไฟล์ให้สมบูรณ์",
    desc: "ใส่รูปโปรไฟล์ + เขียน bio (รับได้ครั้งเดียว)",
    coins: 50,
    repeat: "ครั้งเดียว",
    action: { href: "/profile/[id]/edit", label: "ไปแก้โปรไฟล์" },
  },
  {
    key: "post_board",
    icon: "📝",
    label: "โพสต์บนกระดาน",
    desc: "โพสต์อย่างน้อย 1 ข้อความบนกระดานสนทนาวันนี้",
    coins: 5,
    repeat: "ทุกวัน",
    action: { href: "/board", label: "ไปกระดาน" },
  },
  {
    key: "send_message",
    icon: "💬",
    label: "ส่งข้อความหาเพื่อน",
    desc: "ส่งข้อความส่วนตัวให้ใครสักคนวันนี้",
    coins: 5,
    repeat: "ทุกวัน",
    action: { href: "/", label: "หาเพื่อนคุย" },
  },
  {
    key: "watch_ad",
    icon: "📺",
    label: "ดูโฆษณา",
    desc: "รอชมโฆษณา 30 วินาที (สูงสุด 3 ครั้ง/วัน)",
    coins: 3,
    repeat: "3×/วัน",
    action: null,
  },
];

function AdTimer({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(30);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(ref.current!); onComplete(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [onComplete]);

  const pct = ((30 - seconds) / 30) * 100;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <circle
            cx="40" cy="40" r="34"
            stroke="#f59e0b" strokeWidth="6" fill="none"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-yellow-600">
          {seconds}
        </span>
      </div>
      <p className="text-sm text-gray-500">กำลังดูโฆษณา… กรุณารอสักครู่</p>
      <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm border-2 border-dashed">
        📺 พื้นที่โฆษณา
      </div>
    </div>
  );
}

export default function EarnPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<Tasks>({});
  const [taskLoading, setTaskLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; earned?: number } | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adReady, setAdReady] = useState(false);

  const fetchStatus = useCallback(async () => {
    const [coinsRes, earnRes] = await Promise.all([
      fetch("/api/coins"),
      fetch("/api/coins/earn"),
    ]);
    if (coinsRes.ok) { const d = await coinsRes.json(); setBalance(d.balance ?? 0); }
    if (earnRes.ok) { const d = await earnRes.json(); setBalance((prev) => d.balance ?? prev); setTasks(d.tasks ?? {}); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function claimTask(key: string) {
    setTaskLoading(key);
    setMsg(null);
    const res = await fetch("/api/coins/earn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: key }),
    });
    const data = await res.json();
    if (res.ok) {
      setBalance(data.balance);
      setMsg({ text: "รับเหรียญสำเร็จ!", earned: data.earned });
      await fetchStatus();
    } else {
      setMsg({ text: data.error || "เกิดข้อผิดพลาด" });
    }
    setTaskLoading(null);
  }

  function startAd() { setWatchingAd(true); setAdReady(false); }
  const onAdComplete = useCallback(() => setAdReady(true), []);
  async function claimAd() { setWatchingAd(false); setAdReady(false); await claimTask("watch_ad"); }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Balance bar */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl px-5 py-4 text-white flex items-center justify-between shadow">
        <div>
          <p className="text-xs opacity-80">ยอดเหรียญของคุณ</p>
          <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
        </div>
        <span className="text-4xl">🪙</span>
      </div>

      {/* Daily tasks */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="font-bold">รับเหรียญฟรี · กิจกรรมประจำวัน</h2>
          <p className="text-xs text-gray-400 mt-0.5">ทำกิจกรรมด้านล่างเพื่อรับเหรียญโดยไม่ต้องเสียเงิน</p>
        </div>

        {msg && (
          <div className={`mx-4 mt-3 rounded-xl px-4 py-2 text-center text-sm font-semibold ${
            msg.earned ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {msg.earned ? `🎉 ${msg.text} (+${msg.earned} เหรียญ)` : `❌ ${msg.text}`}
          </div>
        )}

        <div className="divide-y">
          {TASK_META.map((task) => {
            const status = tasks[task.key];
            const isLoading = taskLoading === task.key;
            const claimed = status && !status.claimable;
            const profileIncomplete =
              task.key === "complete_profile" && status && !status.claimable && (!status.hasAvatar || !status.hasBio);

            return (
              <div key={task.key} className={`p-4 ${claimed ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{task.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{task.label}</p>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{task.repeat}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{task.desc}</p>
                    {profileIncomplete && (
                      <div className="mt-1.5 text-xs text-orange-500 space-y-0.5">
                        {!status.hasAvatar && <p>• ยังไม่มีรูปโปรไฟล์</p>}
                        {!status.hasBio && <p>• ยังไม่มี bio</p>}
                      </div>
                    )}
                    {task.key === "watch_ad" && status && (
                      <p className="text-xs text-gray-400 mt-1">วันนี้ดูแล้ว {status.claimedToday ?? 0}/3 ครั้ง</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <p className="text-sm font-bold text-yellow-600">+{task.coins} <Coins className="w-3 h-3 inline" /></p>
                    {renderAction(task, status, isLoading, claimed, profileIncomplete, session, startAd, claimTask)}
                  </div>
                </div>
                {task.key === "watch_ad" && watchingAd && (
                  <div className="mt-3 border-t pt-3">
                    <AdTimer onComplete={onAdComplete} />
                    {adReady && (
                      <Button
                        onClick={claimAd}
                        disabled={!!taskLoading}
                        className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        {taskLoading === "watch_ad" ? <Loader2 className="w-4 h-4 animate-spin" /> : "รับ 3 เหรียญ"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">
        ต้องการซื้อเหรียญเพิ่ม?{" "}
        <Link href="/coins" className="text-blue-500 hover:underline">ไปที่บัญชีเหรียญ →</Link>
      </p>
    </div>
  );
}

function renderAction(
  task: (typeof TASK_META)[number],
  status: TaskStatus | undefined,
  isLoading: boolean,
  claimed: boolean,
  profileIncomplete: boolean | undefined,
  session: ReturnType<typeof useSession>["data"],
  startAd: () => void,
  claimTask: (key: string) => void,
) {
  if (!status) return null;
  if (claimed && task.key !== "watch_ad") {
    return <div className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> รับแล้ว</div>;
  }
  if (task.key === "watch_ad" && claimed) {
    return <div className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> ครบแล้ว</div>;
  }
  if (task.key === "complete_profile" && profileIncomplete) {
    const href = `/profile/${session?.user?.id ?? ""}/edit`;
    return (
      <Link href={href}>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <ExternalLink className="w-3 h-3" /> ไปแก้โปรไฟล์
        </Button>
      </Link>
    );
  }
  if (!status.claimable && task.action) {
    return (
      <Link href={task.action.href.replace("[id]", session?.user?.id ?? "")}>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-purple-600 border-purple-300">
          <ExternalLink className="w-3 h-3" /> {task.action.label}
        </Button>
      </Link>
    );
  }
  if (!status.claimable) {
    return <div className="flex items-center gap-1 text-gray-400 text-xs"><Lock className="w-3 h-3" /> ยังทำไม่ครบ</div>;
  }
  if (task.key === "watch_ad") {
    return (
      <Button size="sm" className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-white" onClick={startAd} disabled={isLoading}>
        ดูโฆษณา
      </Button>
    );
  }
  return (
    <Button size="sm" className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => claimTask(task.key)} disabled={isLoading}>
      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "รับเหรียญ"}
    </Button>
  );
}
