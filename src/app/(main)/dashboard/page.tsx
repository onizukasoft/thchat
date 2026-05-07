"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Coins, Users, MessageCircle, Gift, Bell, TrendingUp,
  Gamepad2, Star, Headphones, Trophy, ChevronRight, Wifi,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type DashData = {
  me: { coins: number; nickname: string | null; username: string; avatar: string | null; createdAt: string };
  stats: {
    coins: number; followers: number; following: number; messagesSent: number;
    giftsReceived: number; giftsValue: number; unreadNotifications: number;
  };
  recentTx: { id: string; amount: number; type: string; description: string; createdAt: string }[];
  topUsers: { id: string; nickname: string | null; username: string; avatar: string | null; coins: number }[];
  onlineCount: number;
  totalUsers: number;
  recentMessages: {
    id: string; content: string; createdAt: string;
    sender: { id: string; nickname: string | null; username: string; avatar: string | null };
    receiver: { id: string; nickname: string | null; username: string; avatar: string | null };
  }[];
};

function StatCard({ icon, label, value, sub, color, href }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; href?: string;
}) {
  const inner = (
    <div className={`bg-white rounded-xl border p-4 flex items-center gap-3 hover:shadow-md transition-shadow ${href ? "cursor-pointer" : ""}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const QUICK_LINKS = [
  { icon: "🎰", label: "โชคดีวันนี้", href: "/games/spin", color: "bg-green-100" },
  { icon: "🎣", label: "ตกปลา", href: "/games/fish", color: "bg-blue-100" },
  { icon: "❓", label: "ถาม-ตอบ", href: "/games/quiz", color: "bg-orange-100" },
  { icon: "🎯", label: "ทายใจ", href: "/games/guess", color: "bg-cyan-100" },
  { icon: "🃏", label: "จับคู่", href: "/games/match", color: "bg-purple-100" },
  { icon: "📚", label: "คำศัพท์", href: "/games/word", color: "bg-rose-100" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }
  if (!data || !session?.user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 text-gray-400 space-y-3">
        <TrendingUp className="w-12 h-12 mx-auto opacity-30" />
        <p>กรุณาเข้าสู่ระบบเพื่อดู Dashboard</p>
        <Link href="/login" className="inline-block px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600">เข้าสู่ระบบ</Link>
      </div>
    );
  }

  const { stats, recentTx, topUsers, onlineCount, totalUsers, recentMessages, me } = data;
  const displayName = me.nickname || me.username;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">สวัสดี, {displayName} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            สมาชิกตั้งแต่ {formatDistanceToNow(new Date(me.createdAt), { addSuffix: true, locale: th })}
          </p>
        </div>
        <Avatar className="w-12 h-12 border-2 border-blue-200">
          <AvatarImage src={me.avatar || ""} />
          <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">{displayName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>

      {/* Online status banner */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 flex items-center gap-3 text-white">
        <Wifi className="w-5 h-5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">มีผู้ใช้ออนไลน์ {onlineCount.toLocaleString()} คน</p>
          <p className="text-xs text-blue-100">จากสมาชิกทั้งหมด {totalUsers.toLocaleString()} คน</p>
        </div>
        <Link href="/" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors">
          ดูทั้งหมด
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Coins className="w-5 h-5 text-yellow-600" />} label="เหรียญของฉัน"
          value={stats.coins.toLocaleString()} sub="คลิกเพื่อดูรายละเอียด" color="bg-yellow-50" href="/coins" />
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="ผู้ติดตาม"
          value={stats.followers.toLocaleString()} sub={`ติดตาม ${stats.following} คน`} color="bg-blue-50" href="/favorites" />
        <StatCard icon={<MessageCircle className="w-5 h-5 text-green-600" />} label="ส่งข้อความ"
          value={stats.messagesSent.toLocaleString()} sub="ข้อความทั้งหมด" color="bg-green-50" />
        <StatCard icon={<Gift className="w-5 h-5 text-pink-600" />} label="ของขวัญที่รับ"
          value={stats.giftsReceived.toLocaleString()} sub={`มูลค่า ${stats.giftsValue} 🪙`} color="bg-pink-50" href="/gifts" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-4">

          {/* Quick games */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-sm">เกมส์วันนี้</span>
              </div>
              <Link href="/games" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">ทั้งหมด<ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LINKS.map((g) => (
                <Link key={g.href} href={g.href}
                  className={`${g.color} rounded-xl p-3 flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity`}>
                  <span className="text-2xl">{g.icon}</span>
                  <span className="text-xs font-medium text-gray-600">{g.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent coin transactions */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-sm">รายการเหรียญล่าสุด</span>
              </div>
              <Link href="/coins" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">ดูเพิ่ม<ChevronRight className="w-3 h-3" /></Link>
            </div>
            {recentTx.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">ยังไม่มีรายการ</p>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-2 text-sm">
                    <span className={`font-bold text-sm w-16 text-right shrink-0 ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount} 🪙
                    </span>
                    <span className="flex-1 text-gray-600 truncate">{tx.description}</span>
                    <span className="text-xs text-gray-300 shrink-0">
                      {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true, locale: th })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Top users */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-sm">ซุปตาร์ประจำสัปดาห์</span>
              </div>
              <Link href="/superstar" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">ดูอันดับ<ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-2">
              {topUsers.map((u, i) => (
                <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-1 py-1 transition-colors">
                  <span className="w-5 text-center text-sm font-bold text-gray-400">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={u.avatar || ""} />
                    <AvatarFallback className="bg-yellow-100 text-yellow-700 text-xs font-bold">
                      {(u.nickname || u.username)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm truncate font-medium">{u.nickname || u.username}</span>
                  <span className="text-xs text-yellow-600 font-bold shrink-0">{u.coins.toLocaleString()} 🪙</span>
                </Link>
              ))}
              {topUsers.length === 0 && <p className="text-sm text-gray-400 text-center py-2">ยังไม่มีข้อมูล</p>}
            </div>
          </div>

          {/* Recent messages */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-sm">แชทล่าสุด</span>
              </div>
            </div>
            {recentMessages.length === 0 ? (
              <div className="text-center py-3 space-y-2">
                <p className="text-sm text-gray-400">ยังไม่มีประวัติแชท</p>
                <Link href="/" className="text-xs text-blue-500 hover:underline">ค้นหาเพื่อนใหม่</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMessages.map((m) => {
                  const other = m.sender.id === session?.user?.id ? m.receiver : m.sender;
                  return (
                    <Link key={m.id} href={`/chat/${other.id}`} className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-1 py-1.5 transition-colors">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={other.avatar || ""} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                          {(other.nickname || other.username)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{other.nickname || other.username}</p>
                        <p className="text-xs text-gray-400 truncate">{m.content}</p>
                      </div>
                      <span className="text-xs text-gray-300 shrink-0">
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: th })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shortcuts */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Bell className="w-4 h-4" />, label: "แจ้งเตือน", href: "/notifications", badge: stats.unreadNotifications, color: "text-orange-500 bg-orange-50" },
              { icon: <Trophy className="w-4 h-4" />, label: "รางวัล", href: "/rewards", color: "text-yellow-500 bg-yellow-50" },
              { icon: <Headphones className="w-4 h-4" />, label: "ดีเจ", href: "/dj", color: "text-purple-500 bg-purple-50" },
            ].map((s) => (
              <Link key={s.href} href={s.href}
                className={`relative ${s.color} rounded-xl p-3 flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity`}>
                {s.icon}
                <span className="text-xs font-medium">{s.label}</span>
                {!!s.badge && s.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {s.badge > 9 ? "9+" : s.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
