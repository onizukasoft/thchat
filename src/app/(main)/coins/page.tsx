"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, CheckCircle2, Lock, ExternalLink, Coins as CoinsIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { COIN_PACKAGES, ADDON_PACKAGES } from "@/lib/packages";

type VipPkg = {
  id: string; name: string; icon: string; level: string;
  price: number; coins: number; days: number; features: string[];
};
import { format } from "date-fns";
import { th } from "date-fns/locale";

type Tab = "coins" | "monthly" | "addon" | "earn" | "wallet";

type TxType = { id: string; amount: number; type: string; description: string; createdAt: string };
type WalletData = {
  balance: number;
  earned: number;
  purchased: number;
  groups: Record<string, TxType[]>;
  expiring: TxType[];
};

const TX_ICON: Record<string, string> = {
  earn: "🪙",
  purchase: "💳",
  gift_send: "🎁",
  gift_receive: "🎁",
  heart_redeem: "❤️",
  spend: "💸",
};

function WalletTab({ walletMode }: { walletMode: "list" | "expiring" }) {
  const [data, setData] = useState<WalletData | null>(null);
  const [period, setPeriod] = useState<"day" | "month">("day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/coins/wallet?mode=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [period]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (!data) return null;

  if (walletMode === "expiring") {
    return (
      <div className="divide-y">
        {data.expiring.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">ไม่มีเหรียญที่กำลังจะหมดอายุ</div>
        ) : (
          data.expiring.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{TX_ICON[tx.type] ?? "🪙"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{tx.description}</p>
                <p className="text-xs text-gray-400">{format(new Date(tx.createdAt), "d MMM yyyy HH:mm", { locale: th })}</p>
              </div>
              <span className="text-sm font-bold text-yellow-600">+{tx.amount.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  const sortedDays = Object.keys(data.groups).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div className="flex justify-end px-4 py-2 border-b gap-2">
        {(["day", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              period === p ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {period === p && <span className="text-blue-500">✓</span>}
            {p === "day" ? "วัน" : "เดือน"}
          </button>
        ))}
      </div>
      <div>
        {sortedDays.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีรายการ</div>
        ) : (
          sortedDays.map((day) => {
            const txs = data.groups[day];
            const dayDate = new Date(day);
            const label = period === "month"
              ? format(dayDate, "MMMM yyyy", { locale: th })
              : format(dayDate, "d MMMM yyyy", { locale: th });
            const dayTotal = txs.reduce((s, t) => s + t.amount, 0);
            return (
              <div key={day}>
                <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b">
                  <span className="text-sm font-medium text-blue-800">{label}</span>
                  <button className="w-6 h-6 flex items-center justify-center rounded-full border border-blue-200 text-blue-400 text-xs">i</button>
                </div>
                {txs.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50">
                    <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-lg shrink-0">
                      {TX_ICON[tx.type] ?? "🪙"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      {period === "day" && (
                        <p className="text-xs text-gray-400">{format(new Date(tx.createdAt), "HH:mm", { locale: th })}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-sm font-bold">
                        <span className={tx.amount >= 0 ? "text-green-600" : "text-red-500"}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function WalletPage() {
  const [inner, setInner] = useState<"list" | "expiring" | "payouts">("list");
  const [data, setData] = useState<WalletData | null>(null);

  useEffect(() => {
    fetch("/api/coins/wallet?mode=day")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const balance = data?.balance ?? 0;
  const earned = data?.earned ?? 0;
  const purchased = data?.purchased ?? 0;

  return (
    <div>
      {/* Header summary */}
      <div className="px-5 py-5 bg-white border-b space-y-3">
        <p className="text-sm text-gray-500 text-center">จำนวนเหรียญทั้งหมด</p>
        <p className="text-4xl font-bold text-center text-gray-900">{balance.toLocaleString()}</p>
        <div className="flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white text-sm font-bold">$</div>
            <span className="text-lg font-semibold text-gray-800">{earned.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">$</div>
            <span className="text-lg font-semibold text-gray-800">{purchased.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Inner tabs */}
      <div className="flex border-b bg-white">
        {([
          { key: "list", label: "รายการ" },
          { key: "expiring", label: `จะหมดอายุ (${data?.expiring.length ?? 0})` },
          { key: "payouts", label: "payouts (0)" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setInner(t.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              inner === t.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {inner === "list" && <WalletTab walletMode="list" />}
      {inner === "expiring" && <WalletTab walletMode="expiring" />}
      {inner === "payouts" && (
        <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีรายการถอนเหรียญ</div>
      )}
    </div>
  );
}

type TaskStatus = { claimable: boolean; hasAvatar?: boolean; hasBio?: boolean; claimedToday?: number };
type Tasks = Record<string, TaskStatus>;

const TASK_META = [
  { key: "daily_login", icon: "📅", label: "เข้าสู่ระบบประจำวัน", desc: "เข้าสู่ระบบทุกวันเพื่อรับเหรียญ (รีเซ็ตทุกเที่ยงคืน)", coins: 10, repeat: "ทุกวัน", action: null },
  { key: "complete_profile", icon: "✏️", label: "ทำโปรไฟล์ให้สมบูรณ์", desc: "ใส่รูปโปรไฟล์ + เขียน bio (รับได้ครั้งเดียว)", coins: 50, repeat: "ครั้งเดียว", action: { href: "/profile/[id]/edit", label: "ไปแก้โปรไฟล์" } },
  { key: "post_board", icon: "📝", label: "โพสต์บนกระดาน", desc: "โพสต์อย่างน้อย 1 ข้อความบนกระดานสนทนาวันนี้", coins: 5, repeat: "ทุกวัน", action: { href: "/board", label: "ไปกระดาน" } },
  { key: "send_message", icon: "💬", label: "ส่งข้อความหาเพื่อน", desc: "ส่งข้อความส่วนตัวให้ใครสักคนวันนี้", coins: 5, repeat: "ทุกวัน", action: { href: "/", label: "หาเพื่อนคุย" } },
  { key: "watch_ad", icon: "📺", label: "ดูโฆษณา", desc: "รอชมโฆษณา 30 วินาที (สูงสุด 3 ครั้ง/วัน)", coins: 3, repeat: "3×/วัน", action: null },
];

function AdTimer({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(30);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    ref.current = setInterval(() => {
      setSeconds((s) => { if (s <= 1) { clearInterval(ref.current!); onComplete(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [onComplete]);
  const pct = ((30 - seconds) / 30) * 100;
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="34" stroke="#f59e0b" strokeWidth="6" fill="none"
            strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-yellow-600">{seconds}</span>
      </div>
      <p className="text-sm text-gray-500">กำลังดูโฆษณา… กรุณารอสักครู่</p>
      <div className="w-full h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm border-2 border-dashed">📺 พื้นที่โฆษณา</div>
    </div>
  );
}

const PAYMENT_LOGOS = [
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/PromptPay_logo.svg/200px-PromptPay_logo.svg.png", alt: "Thai QR" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/TrueMoney_Wallet_Logo.png/200px-TrueMoney_Wallet_Logo.png", alt: "TrueMoney" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png", alt: "PayPal" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png", alt: "Visa" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png", alt: "Mastercard" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/JCB_logo.svg/200px-JCB_logo.svg.png", alt: "JCB" },
];

export default function CoinsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("wallet");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Tasks>({});
  const [taskLoading, setTaskLoading] = useState<string | null>(null);
  const [taskMsg, setTaskMsg] = useState<{ text: string; earned?: number } | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [vipPackages, setVipPackages] = useState<VipPkg[]>([]);

  const fetchEarn = useCallback(async () => {
    const [coinsRes, earnRes] = await Promise.all([fetch("/api/coins"), fetch("/api/coins/earn")]);
    if (coinsRes.ok) { const d = await coinsRes.json(); setBalance(d.balance ?? 0); }
    if (earnRes.ok) { const d = await earnRes.json(); setBalance((p) => d.balance ?? p); setTasks(d.tasks ?? {}); }
  }, []);

  useEffect(() => {
    if (tab === "earn") fetchEarn();
    else if (tab !== "wallet") fetch("/api/coins").then((r) => r.json()).then((d) => setBalance(d.balance ?? 0));
    if (tab === "monthly" && vipPackages.length === 0) {
      fetch("/api/vip/packages").then((r) => r.json()).then(setVipPackages);
    }
  }, [tab, fetchEarn, vipPackages.length]);

  async function checkout(endpoint: string, packageId: string) {
    if (!session?.user?.id) { router.push("/login"); return; }
    setLoading(packageId);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "เกิดข้อผิดพลาด");
    } catch { alert("เกิดข้อผิดพลาด กรุณาลองใหม่"); }
    finally { setLoading(null); }
  }

  async function claimTask(key: string) {
    setTaskLoading(key); setTaskMsg(null);
    const res = await fetch("/api/coins/earn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: key }) });
    const data = await res.json();
    if (res.ok) { setBalance(data.balance); setTaskMsg({ text: "รับเหรียญสำเร็จ!", earned: data.earned }); await fetchEarn(); }
    else setTaskMsg({ text: data.error || "เกิดข้อผิดพลาด" });
    setTaskLoading(null);
  }

  const onAdComplete = useCallback(() => setAdReady(true), []);
  async function claimAd() { setWatchingAd(false); setAdReady(false); await claimTask("watch_ad"); }

  const TABS: { key: Tab; label: string }[] = [
    { key: "wallet", label: "บัญชีเหรียญ" },
    { key: "coins", label: "เติมเหรียญ" },
    { key: "monthly", label: "แพ็คเกจเดือน" },
    { key: "addon", label: "แพ็คเกจเสริม" },
    { key: "earn", label: "รับเหรียญฟรี" },
  ];

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

      {/* Tabs */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* === บัญชีเหรียญ === */}
        {tab === "wallet" && <WalletPage />}

        {/* === เติมเหรียญ === */}
        {tab === "coins" && (
          <div>
            <div className="px-5 py-4 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-center">ซื้อเหรียญบูคอยน์</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b bg-gray-50">
                  <th className="text-left px-5 py-2 font-medium">จำนวนเหรียญ</th>
                  <th className="text-left px-3 py-2 font-medium">แถมโบนัส</th>
                  <th className="text-right px-5 py-2 font-medium">ราคา</th>
                </tr>
              </thead>
              <tbody>
                {COIN_PACKAGES.map((pkg, i) => (
                  <tr
                    key={pkg.id}
                    className={`border-b last:border-0 hover:bg-blue-50/50 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 text-xl">🪙</span>
                        <span className="font-bold text-lg">{pkg.coins.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {pkg.bonus > 0 ? (
                        <div className="flex items-center gap-1 text-yellow-600 font-medium">
                          <span className="text-base">🪙</span>
                          <span>+{pkg.bonus.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => checkout("/api/coins/checkout", pkg.id)}
                        disabled={loading !== null}
                        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-sm transition-all active:scale-95 min-w-[90px] inline-flex items-center justify-center gap-1"
                      >
                        {loading === pkg.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : `${(pkg.price / 100).toLocaleString("th-TH")} บาท`}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Payment logos */}
            <div className="px-5 py-4 border-t bg-white">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {PAYMENT_LOGOS.map((logo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={logo.alt}
                    src={logo.src}
                    alt={logo.alt}
                    className="h-7 object-contain grayscale hover:grayscale-0 transition-all"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">ชำระเงินผ่าน Stripe · ปลอดภัย 100% 🔒</p>
            </div>
          </div>
        )}

        {/* === แพ็คเกจเดือน === */}
        {tab === "monthly" && (
          <div className="p-5 space-y-4">
            <h2 className="text-lg font-bold text-center">แพ็คเกจ VIP รายเดือน</h2>
            {vipPackages.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                {vipPackages.map((plan) => {
                  const colorMap: Record<string, string> = {
                    silver: "from-gray-400 to-gray-500",
                    gold: "from-yellow-400 to-orange-500",
                    diamond: "from-blue-400 to-purple-600",
                  };
                  const color = colorMap[plan.level] ?? "from-indigo-400 to-purple-500";
                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border-2 overflow-hidden ${
                        plan.level === "gold" ? "border-yellow-400 shadow-lg" : "border-gray-200"
                      }`}
                    >
                      {plan.level === "gold" && (
                        <div className="bg-yellow-400 text-white text-xs font-bold text-center py-1">
                          ⭐ ยอดนิยม
                        </div>
                      )}
                      <div className={`bg-gradient-to-br ${color} p-4 text-white text-center`}>
                        <div className="text-2xl mb-1">{plan.icon}</div>
                        <div className="font-bold">{plan.name}</div>
                        <div className="text-xl font-bold mt-1">
                          ฿{(plan.price / 100).toLocaleString("th-TH")}
                        </div>
                        <div className="text-xs opacity-80">/ {plan.days} วัน</div>
                      </div>
                      <div className="p-3 space-y-1.5 bg-white">
                        {plan.features.map((f) => (
                          <p key={f} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-green-500 mt-0.5">✓</span> {f}
                          </p>
                        ))}
                        <button
                          onClick={() => checkout("/api/vip/checkout", plan.id)}
                          disabled={loading !== null}
                          className={`w-full mt-2 py-2 rounded-lg text-white text-sm font-bold bg-gradient-to-r ${color} hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center`}
                        >
                          {loading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "ซื้อเลย"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* === แพ็คเกจเสริม === */}
        {tab === "addon" && (
          <div className="p-5 space-y-3">
            <h2 className="text-lg font-bold text-center">แพ็คเกจเสริมพิเศษ</h2>
            {ADDON_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="flex items-center gap-4 border rounded-xl p-4 bg-white hover:bg-gray-50">
                <span className="text-3xl">{pkg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{pkg.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{pkg.desc}</p>
                </div>
                <div className="shrink-0">
                  <p className="text-right font-bold text-sm mb-1">
                    ฿{(pkg.price / 100).toLocaleString("th-TH")}
                  </p>
                  <button
                    onClick={() => checkout("/api/addon/checkout", pkg.id)}
                    disabled={loading !== null}
                    className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1"
                  >
                    {loading === pkg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "ซื้อ"}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-gray-400 pt-2">
              แพ็คเกจเสริมจะเริ่มต้นทันทีหลังชำระเงิน
            </p>
          </div>
        )}

        {/* === รับเหรียญฟรี === */}
        {tab === "earn" && (
          <div>
            {taskMsg && (
              <div className={`mx-4 mt-3 rounded-xl px-4 py-2 text-center text-sm font-semibold ${
                taskMsg.earned ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
              }`}>
                {taskMsg.earned ? `🎉 ${taskMsg.text} (+${taskMsg.earned} เหรียญ)` : `❌ ${taskMsg.text}`}
              </div>
            )}
            <div className="divide-y">
              {TASK_META.map((task) => {
                const status = tasks[task.key];
                const isLoading = taskLoading === task.key;
                const claimed = status && !status.claimable;
                const profileIncomplete = task.key === "complete_profile" && status && !status.claimable && (!status.hasAvatar || !status.hasBio);
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
                        <p className="text-sm font-bold text-yellow-600">+{task.coins} <CoinsIcon className="w-3 h-3 inline" /></p>
                        {!status ? null
                          : claimed && task.key !== "watch_ad" ? (
                            <div className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> รับแล้ว</div>
                          ) : task.key === "watch_ad" && claimed ? (
                            <div className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> ครบแล้ว</div>
                          ) : task.key === "complete_profile" && profileIncomplete ? (
                            <Link href={`/profile/${session?.user?.id ?? ""}/edit`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><ExternalLink className="w-3 h-3" /> ไปแก้โปรไฟล์</Button>
                            </Link>
                          ) : !status.claimable && task.action ? (
                            <Link href={task.action.href.replace("[id]", session?.user?.id ?? "")}>
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-purple-600 border-purple-300"><ExternalLink className="w-3 h-3" /> {task.action.label}</Button>
                            </Link>
                          ) : !status.claimable ? (
                            <div className="flex items-center gap-1 text-gray-400 text-xs"><Lock className="w-3 h-3" /> ยังทำไม่ครบ</div>
                          ) : task.key === "watch_ad" ? (
                            <Button size="sm" className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => setWatchingAd(true)} disabled={isLoading}>ดูโฆษณา</Button>
                          ) : (
                            <Button size="sm" className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => claimTask(task.key)} disabled={isLoading}>
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "รับเหรียญ"}
                            </Button>
                          )
                        }
                      </div>
                    </div>
                    {task.key === "watch_ad" && watchingAd && (
                      <div className="mt-3 border-t pt-3">
                        <AdTimer onComplete={onAdComplete} />
                        {adReady && (
                          <Button onClick={claimAd} disabled={!!taskLoading} className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white">
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
        )}
      </div>
    </div>
  );
}
