"use client";
import { useEffect, useState } from "react";
import { Users, MessageCircle, FileText, Gift, UserX, UserCheck } from "lucide-react";

type Stats = { totalUsers: number; onlineUsers: number; newUsersMonth: number; totalPosts: number; totalMessages: number; totalGifts: number; bannedUsers: number };

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="text-gray-400 text-center py-20">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="ผู้ใช้ทั้งหมด" value={stats.totalUsers} icon={Users} color="bg-blue-500" />
        <StatCard label="ออนไลน์ตอนนี้" value={stats.onlineUsers} icon={UserCheck} color="bg-green-500" />
        <StatCard label="สมาชิกใหม่เดือนนี้" value={stats.newUsersMonth} icon={Users} color="bg-purple-500" />
        <StatCard label="ถูกแบน" value={stats.bannedUsers} icon={UserX} color="bg-red-500" />
        <StatCard label="โพสต์ทั้งหมด" value={stats.totalPosts} icon={FileText} color="bg-orange-500" />
        <StatCard label="ข้อความทั้งหมด" value={stats.totalMessages} icon={MessageCircle} color="bg-cyan-500" />
        <StatCard label="ของขวัญที่ส่ง" value={stats.totalGifts} icon={Gift} color="bg-pink-500" />
      </div>
    </div>
  );
}
