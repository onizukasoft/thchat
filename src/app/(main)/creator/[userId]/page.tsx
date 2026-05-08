"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import {
  Lock, Play, Eye, Coins, Users, Film, Settings,
  CheckCircle2, Loader2, Plus, Trash2, Globe,
  Banknote, ChevronDown, ChevronUp, Clock, XCircle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";

type Creator = {
  userId: string;
  bio: string | null;
  monthlyPrice: number;
  subscriberCount: number;
  clipCount: number;
  totalEarned?: number;
  withdrawable?: number;
  isOwn: boolean;
  isSubscribed: boolean;
  subscriptionExpiresAt: string | null;
  user: { id: string; username: string; nickname: string | null; avatar: string | null };
};

type WithdrawalRequest = {
  id: string;
  amount: number;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  createdAt: string;
};

type Clip = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  isSubscriberOnly: boolean;
  hasAccess: boolean;
  views: number;
  createdAt: string;
};

function ClipItem({ clip, isOwn, onDelete }: { clip: Clip; isOwn: boolean; onDelete: (id: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("ลบคลิปนี้?")) return;
    setDeleting(true);
    await fetch(`/api/clips/${clip.id}`, { method: "DELETE" });
    onDelete(clip.id);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group">
      <div className="aspect-video bg-gray-900 relative">
        {playing && clip.videoUrl ? (
          <video src={clip.videoUrl} controls autoPlay className="w-full h-full object-contain" />
        ) : (
          <>
            {clip.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <Play className="w-10 h-10 text-gray-600" />
              </div>
            )}
            {clip.hasAccess ? (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                </div>
              </button>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Lock className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex gap-1">
              {clip.isSubscriberOnly ? (
                <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> สมาชิก
                </span>
              ) : (
                <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" /> ฟรี
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">{clip.title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{clip.views}</span>
            <span>{formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true, locale: th })}</span>
          </div>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatorPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [editPrice, setEditPrice] = useState(99);
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawHistory, setWithdrawHistory] = useState<WithdrawalRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function fetchAll() {
    const [cRes, clRes] = await Promise.all([
      fetch(`/api/creator/${userId}`),
      fetch(`/api/clips?creatorId=${userId}`),
    ]);
    if (!cRes.ok) { router.push("/clips"); return; }
    const [c, cl] = await Promise.all([cRes.json(), clRes.json()]);
    setCreator(c);
    setClips(Array.isArray(cl) ? cl : []);
    setEditPrice(c.monthlyPrice);
    setEditBio(c.bio || "");
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, [userId]);

  async function subscribe() {
    setSubscribing(true);
    setSubError("");
    const res = await fetch(`/api/creator/${userId}/subscribe`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setSubError(data.error); setSubscribing(false); return; }
    await fetchAll();
    setSubscribing(false);
  }

  async function fetchWithdrawHistory() {
    setHistoryLoading(true);
    const r = await fetch(`/api/creator/${userId}/withdraw`);
    if (r.ok) setWithdrawHistory(await r.json());
    setHistoryLoading(false);
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    setWithdrawError("");
    const res = await fetch(`/api/creator/${userId}/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: withdrawAmount, note: withdrawNote }),
    });
    const data = await res.json();
    if (!res.ok) { setWithdrawError(data.error); setWithdrawing(false); return; }
    setWithdrawAmount("");
    setWithdrawNote("");
    setWithdrawing(false);
    fetchAll();
    fetchWithdrawHistory();
  }

  async function saveSettings() {
    setSaving(true);
    await fetch(`/api/creator/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: editBio, monthlyPrice: editPrice }),
    });
    setSaving(false);
    setShowSettings(false);
    fetchAll();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
    </div>
  );

  if (!creator) return null;

  const displayName = creator.user.nickname || creator.user.username;

  return (
    <div className="space-y-4">
      {/* Creator header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
        <div className="flex items-start gap-4">
          <UserAvatar
            src={creator.user.avatar}
            fallback={displayName[0]}
            className="w-16 h-16 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold">{displayName}</h1>
              <CheckCircle2 className="w-4 h-4 text-blue-300" />
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">Creator</span>
            </div>
            {creator.bio && <p className="text-sm text-white/80 mt-1">{creator.bio}</p>}
            <div className="flex gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{creator.subscriberCount} สมาชิก</span>
              <span className="flex items-center gap-1"><Film className="w-3.5 h-3.5" />{creator.clipCount} คลิป</span>
            </div>
          </div>
          {creator.isOwn && (
            <button onClick={() => setShowSettings((v) => !v)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Subscribe / own stats */}
        {!creator.isOwn && (
          <div className="mt-4">
            {creator.isSubscribed ? (
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-300" />
                <div>
                  <p className="text-sm font-semibold">สมาชิกอยู่แล้ว</p>
                  {creator.subscriptionExpiresAt && (
                    <p className="text-xs text-white/70">
                      หมดอายุ {format(new Date(creator.subscriptionExpiresAt), "d MMM yyyy", { locale: th })}
                    </p>
                  )}
                </div>
                <button
                  onClick={subscribe}
                  disabled={subscribing}
                  className="ml-auto text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                >
                  ต่ออายุ
                </button>
              </div>
            ) : (
              <button
                onClick={subscribe}
                disabled={subscribing || !session?.user?.id}
                className="w-full py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                สมัครสมาชิก {creator.monthlyPrice} เหรียญ/เดือน
              </button>
            )}
            {subError && <p className="text-red-300 text-xs mt-2 text-center">{subError}</p>}
          </div>
        )}

        {creator.isOwn && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{creator.withdrawable ?? 0}</p>
                <p className="text-xs text-white/70">เหรียญถอนได้</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{creator.totalEarned ?? 0}</p>
                <p className="text-xs text-white/70">รายได้ทั้งหมด</p>
              </div>
            </div>
            <button
              onClick={() => { setShowWithdraw((v) => !v); if (!showWithdraw) fetchWithdrawHistory(); }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl transition-colors text-sm font-medium"
            >
              <span className="flex items-center gap-2"><Banknote className="w-4 h-4" />ขอถอนเงิน</span>
              {showWithdraw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Withdrawal panel */}
      {showWithdraw && creator.isOwn && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Banknote className="w-4 h-4 text-green-500" />ขอถอนเงิน
          </h2>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">จำนวนเหรียญที่ต้องการถอน (ขั้นต่ำ 100)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={100}
                  max={creator.withdrawable ?? 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="เช่น 500"
                  className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-300 dark:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(creator.withdrawable ?? 0)}
                  className="text-xs text-green-600 border border-green-200 px-3 py-2 rounded-xl hover:bg-green-50 transition-colors shrink-0"
                >
                  ทั้งหมด
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">ช่องทางรับเงิน / หมายเหตุ</label>
              <input
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                placeholder="เช่น PromptPay 0812345678, SCB 1234567890"
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-300 dark:bg-gray-800"
              />
            </div>
            {withdrawError && <p className="text-red-500 text-xs">{withdrawError}</p>}
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || (withdrawAmount as number) < 100 || (withdrawAmount as number) > (creator.withdrawable ?? 0)}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              ส่งคำขอถอน
            </button>
          </div>

          {/* History */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ประวัติคำขอ</p>
            {historyLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
            ) : withdrawHistory.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีประวัติ</p>
            ) : (
              <div className="space-y-2">
                {withdrawHistory.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                    <div className="shrink-0">
                      {req.status === "pending" && <Clock className="w-4 h-4 text-yellow-500" />}
                      {req.status === "approved" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {req.status === "rejected" && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                        {req.amount.toLocaleString()} เหรียญ
                        <span className={`ml-2 text-[10px] font-normal ${req.status === "pending" ? "text-yellow-600" : req.status === "approved" ? "text-green-600" : "text-red-600"}`}>
                          {req.status === "pending" ? "รอดำเนินการ" : req.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                        </span>
                      </p>
                      {req.note && <p className="text-[10px] text-gray-400 truncate">{req.note}</p>}
                      {req.adminNote && <p className="text-[10px] text-blue-500 truncate">Admin: {req.adminNote}</p>}
                    </div>
                    <p className="text-[10px] text-gray-400 shrink-0">
                      {format(new Date(req.createdAt), "d MMM", { locale: th })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && creator.isOwn && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="font-semibold text-sm">ตั้งค่า Creator</h2>
          <div>
            <label className="text-xs font-medium text-gray-500">แนะนำตัว</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={2}
              className="w-full mt-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 resize-none dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Coins className="w-3 h-3 text-yellow-500" /> ราคา (เหรียญ/เดือน)
            </label>
            <input
              type="number" min={1} max={9999}
              value={editPrice}
              onChange={(e) => setEditPrice(Number(e.target.value))}
              className="w-full mt-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-400 mt-1">คุณได้รับ {Math.floor(editPrice * 0.8)} เหรียญต่อสมาชิก</p>
          </div>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      )}

      {/* Clips */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">คลิปทั้งหมด ({clips.length})</h2>
        {creator.isOwn && (
          <Link href="/clips/upload" className="flex items-center gap-1 text-sm text-indigo-600 hover:underline">
            <Plus className="w-4 h-4" /> อัปโหลดใหม่
          </Link>
        )}
      </div>

      {clips.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Film className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">ยังไม่มีคลิป</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {clips.map((clip) => (
            <ClipItem
              key={clip.id}
              clip={clip}
              isOwn={creator.isOwn}
              onDelete={(id) => setClips((prev) => prev.filter((c) => c.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
