"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getSocket } from "@/lib/socket-client";
import { haversineKm, formatDistance } from "@/lib/distance";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  RefreshCw, User, MapPin, Heart, Search, SlidersHorizontal,
  MessageCircle, Users, X, Loader2, CheckCircle2, UserPlus, ShieldOff,
} from "lucide-react";

type UserCard = {
  id: string;
  username: string;
  nickname: string | null;
  avatar: string | null;
  gender: string | null;
  age: number | null;
  bio: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  isOnline: boolean;
  lastSeen: string;
  distance?: number;
};

const PAGE_SIZE = 24;

// ─── Profile Modal ──────────────────────────────────────────────────────────

function ProfileModal({
  user,
  online,
  myCoords,
  onClose,
}: {
  user: UserCard;
  online: boolean;
  myCoords: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [followed, setFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const distance =
    myCoords && user.latitude && user.longitude
      ? haversineKm(myCoords.lat, myCoords.lng, user.latitude, user.longitude)
      : null;

  const statusText = (() => {
    if (online) return "ออนไลน์อยู่";
    return formatDistanceToNow(new Date(user.lastSeen), { addSuffix: false, locale: th });
  })();

  async function handleFollow() {
    if (!session?.user?.id) { router.push("/login"); return; }
    setFollowLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: user.id }),
      });
      const data = await res.json();
      setFollowed(data.action === "follow");
    } finally {
      setFollowLoading(false);
    }
  }

  function handleBlock() {
    alert(`บล็อก ${user.nickname || user.username} เรียบร้อย`);
    onClose();
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-0 sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="relative w-full h-full sm:h-auto sm:max-w-sm sm:rounded-2xl sm:overflow-hidden bg-white flex flex-col">

        {/* Header — overlays the photo on mobile */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 pb-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-lg leading-tight truncate">
                  {user.nickname || user.username}
                </span>
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${online ? "bg-green-400" : "bg-orange-400"}`} />
                <span className="text-white/90 text-xs">
                  {statusText}
                  {distance != null && ` · ${formatDistance(distance)} จากคุณ`}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="pointer-events-auto ml-3 shrink-0 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Photo */}
        <div className="flex-1 bg-black relative min-h-[65vh] sm:min-h-[420px]">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.nickname || user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
              <Avatar className="w-32 h-32">
                <AvatarFallback className={`text-white text-5xl font-bold ${
                  user.gender === "female" ? "bg-gradient-to-br from-pink-400 to-rose-500"
                  : user.gender === "male" ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                  : "bg-gradient-to-br from-purple-400 to-violet-500"
                }`}>
                  {(user.nickname || user.username)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="bg-white border-t border-gray-100 flex items-center justify-around px-2 py-3 shrink-0">
          <Link
            href={`/profile/${user.id}`}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            <User className="w-6 h-6 text-gray-600" />
            <span className="text-[11px] text-gray-600">โปรไฟล์</span>
          </Link>

          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {followLoading
              ? <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              : <UserPlus className={`w-6 h-6 ${followed ? "text-pink-500" : "text-gray-600"}`} />
            }
            <span className={`text-[11px] ${followed ? "text-pink-500" : "text-gray-600"}`}>
              {followed ? "ติดตามแล้ว" : "เพิ่มเพื่อน"}
            </span>
          </button>

          <Link
            href={`/chat/${user.id}`}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            <MessageCircle className="w-6 h-6 text-gray-600" />
            <span className="text-[11px] text-gray-600">แชท</span>
          </Link>

          <button
            onClick={handleBlock}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ShieldOff className="w-6 h-6 text-gray-600" />
            <span className="text-[11px] text-gray-600">บล็อกผู้เล่น</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserCard[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserCard | null>(null);

  const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male">("all");
  const [locationMode, setLocationMode] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);

  const savedCoordsRef = useRef(false);

  const saveMyLocation = useCallback(async (lat: number, lng: number) => {
    if (savedCoordsRef.current || !session?.user?.id) return;
    savedCoordsRef.current = true;
    await fetch("/api/users/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    });
  }, [session]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocError("เบราว์เซอร์ไม่รองรับ Geolocation"); return; }
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyCoords(coords);
        setLocationMode(true);
        setLocLoading(false);
        saveMyLocation(coords.lat, coords.lng);
      },
      (err) => {
        setLocLoading(false);
        if (err.code === 1) setLocError("กรุณาอนุญาตการเข้าถึงตำแหน่ง");
        else setLocError("ไม่สามารถระบุตำแหน่งได้");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [saveMyLocation]);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (genderFilter !== "all") params.set("gender", genderFilter);
    const res = await fetch(`/api/users?${params}`);
    const data: UserCard[] = await res.json();
    setUsers(data);
    setPage(1);
  }, [genderFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (session?.user?.id) {
      const socket = getSocket();
      socket.emit("user:online", session.user.id);
      socket.on("users:online", (ids: string[]) => setOnlineIds(ids));
      return () => { socket.off("users:online"); };
    }
  }, [session]);

  const usersWithDistance = users
    .filter((u) => u.id !== session?.user?.id)
    .map((u) => ({
      ...u,
      distance:
        locationMode && myCoords && u.latitude && u.longitude
          ? haversineKm(myCoords.lat, myCoords.lng, u.latitude, u.longitude)
          : undefined,
    }));

  const sorted = locationMode
    ? [...usersWithDistance].sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      })
    : usersWithDistance;

  const filtered = sorted.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.username.toLowerCase().includes(q) || (u.nickname || "").toLowerCase().includes(q);
  });

  const onlineCount = users.filter((u) => u.isOnline || onlineIds.includes(u.id)).length;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleGender(g: "female" | "male") {
    setGenderFilter((prev) => (prev === g ? "all" : g));
  }

  function toggleLocation() {
    if (locationMode) {
      setLocationMode(false);
      setMyCoords(null);
      savedCoordsRef.current = false;
    } else {
      requestLocation();
    }
  }

  function clearAll() {
    setGenderFilter("all");
    setLocationMode(false);
    setMyCoords(null);
    setSearch("");
    setShowSearch(false);
    setLocError("");
    savedCoordsRef.current = false;
  }

  const hasFilter = genderFilter !== "all" || locationMode || search;

  return (
    <div className="space-y-3">
      {/* Profile Modal */}
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          online={selectedUser.isOnline || onlineIds.includes(selectedUser.id)}
          myCoords={myCoords}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
        <div className="flex items-center gap-1 flex-wrap">

          <button onClick={fetchUsers} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs text-gray-500 hover:bg-gray-50 min-w-[52px]">
            <RefreshCw className="w-4 h-4 text-gray-400" />
            <span>ไฟฟ้า</span>
          </button>

          <button
            onClick={() => toggleGender("female")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs min-w-[52px] transition-colors ${
              genderFilter === "female"
                ? "bg-pink-50 text-pink-500 font-semibold ring-1 ring-pink-300"
                : "text-gray-500 hover:bg-pink-50 hover:text-pink-400"
            }`}
          >
            <User className={`w-4 h-4 ${genderFilter === "female" ? "text-pink-400" : "text-gray-400"}`} />
            <span>หญิง</span>
          </button>

          <button
            onClick={() => toggleGender("male")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs min-w-[52px] transition-colors ${
              genderFilter === "male"
                ? "bg-blue-50 text-blue-500 font-semibold ring-1 ring-blue-300"
                : "text-gray-500 hover:bg-blue-50 hover:text-blue-400"
            }`}
          >
            <User className={`w-4 h-4 ${genderFilter === "male" ? "text-blue-400" : "text-gray-400"}`} />
            <span>ชาย</span>
          </button>

          <button
            onClick={toggleLocation}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs min-w-[52px] transition-colors ${
              locationMode
                ? "bg-green-50 text-green-600 font-semibold ring-1 ring-green-300"
                : "text-gray-500 hover:bg-green-50 hover:text-green-500"
            }`}
          >
            {locLoading
              ? <Loader2 className="w-4 h-4 animate-spin text-green-400" />
              : <MapPin className={`w-4 h-4 ${locationMode ? "text-green-500" : "text-gray-400"}`} />
            }
            <span>โลเคชัน</span>
          </button>

          <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs text-gray-500 hover:bg-gray-50 min-w-[52px]">
            <Heart className="w-4 h-4 text-gray-400" />
            <span>คนโปรด</span>
          </button>

          <button
            onClick={() => { setShowSearch((v) => !v); }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs min-w-[52px] transition-colors ${
              showSearch || search ? "bg-orange-50 text-orange-500 font-semibold ring-1 ring-orange-300" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Search className={`w-4 h-4 ${showSearch ? "text-orange-400" : "text-gray-400"}`} />
            <span>ค้นหา</span>
          </button>

          <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs text-gray-500 hover:bg-gray-50 min-w-[52px]">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <span>ฟังก์ชัน</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {hasFilter && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
                <X className="w-3 h-3" />ล้าง
              </button>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {onlineCount} ออนไลน์
            </span>
          </div>
        </div>

        {(hasFilter || locError) && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
            {genderFilter !== "all" && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${genderFilter === "female" ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"}`}>
                {genderFilter === "female" ? "♀ หญิง" : "♂ ชาย"}
                <button onClick={() => setGenderFilter("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {locationMode && myCoords && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                📍 ใกล้เคียง — เรียงตามระยะห่าง
                <button onClick={() => { setLocationMode(false); setMyCoords(null); }}><X className="w-3 h-3" /></button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                🔍 &quot;{search}&quot;
                <button onClick={() => setSearch("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {locError && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                ⚠ {locError}
                <button onClick={() => setLocError("")}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาชื่อ หรือ @username..."
            className="flex-1 text-sm outline-none"
          />
          {search && <button onClick={() => setSearch("")}><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
      )}

      {/* User grid */}
      {paged.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">ไม่พบผู้ใช้{hasFilter ? "ที่ตรงกับตัวกรอง" : ""}</p>
          {hasFilter && <button onClick={clearAll} className="mt-2 text-xs text-blue-500 hover:underline">ล้างตัวกรอง</button>}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {paged.map((user) => {
            const online = user.isOnline || onlineIds.includes(user.id);
            return (
              <div
                key={user.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt={user.nickname || user.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className={`text-white text-2xl font-bold ${
                          user.gender === "female" ? "bg-gradient-to-br from-pink-400 to-rose-500"
                          : user.gender === "male" ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                          : "bg-gradient-to-br from-purple-400 to-violet-500"
                        }`}>
                          {(user.nickname || user.username)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  {user.distance != null && (
                    <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      {formatDistance(user.distance)}
                    </span>
                  )}

                  {user.distance == null && (
                    <span className={`absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-gray-400"}`} />
                  )}

                  {user.distance != null && (
                    <span className={`absolute top-1.5 right-7 w-2 h-2 rounded-full ${online ? "bg-green-400" : "bg-gray-400"}`} />
                  )}

                  {user.gender && user.gender !== "other" && (
                    <span className={`absolute top-1.5 right-1.5 text-sm font-bold drop-shadow ${user.gender === "female" ? "text-pink-300" : "text-blue-300"}`}>
                      {user.gender === "female" ? "♀" : "♂"}
                    </span>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent px-1.5 pb-1 pt-4">
                    <p className="text-white text-[11px] font-semibold truncate leading-tight">
                      {user.nickname || user.username}
                    </p>
                    <div className="flex items-center gap-1">
                      {user.age && <span className="text-white/70 text-[10px]">{user.age} ปี</span>}
                      {user.province && !user.distance && (
                        <span className="text-white/60 text-[10px] truncate">· {user.province}</span>
                      )}
                    </div>
                  </div>

                  {/* Hover: "ดู" overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full shadow">
                      ดู
                    </span>
                  </div>
                </div>

                {user.bio && (
                  <div className="px-1.5 py-1 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 truncate">{user.bio}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded border bg-white text-sm disabled:opacity-30 hover:bg-gray-50">‹</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded border text-sm ${page === p ? "bg-blue-500 text-white border-blue-500" : "bg-white hover:bg-gray-50"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded border bg-white text-sm disabled:opacity-30 hover:bg-gray-50">›</button>
        </div>
      )}
    </div>
  );
}
