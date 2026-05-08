"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getSocket } from "@/lib/socket-client";
import { haversineKm, formatDistance } from "@/lib/distance";
import { getFrame } from "@/lib/frames";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { PROVINCES } from "@/lib/provinces";
import {
  RefreshCw, User, MapPin, Heart, Search, SlidersHorizontal,
  MessageCircle, Users, X, Loader2, CheckCircle2, ShieldOff,
  BookmarkCheck, RotateCcw,
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
  profileFrameId: string | null;
  showProfileFrame: boolean;
  vipLevel: string | null;
  lookingFor: string | null;
  hashtags: string | null;
  distance?: number;
};

// ─── Filter Panel (Bottom Sheet) ─────────────────────────────────────────────

const LOOKING_FOR_OPTIONS = [
  "หาแฟน", "หาเพื่อนคุย", "หาเพื่อนเที่ยว", "หากิ๊ก", "โสด",
  "หาเพื่อนไลน์", "แชทเปิดกล้อง", "แชทสด", "นัดเจอ", "นัดเดท",
  "นัดบอด", "ฟิวแฟน",
];

type FilterState = {
  genders: string[];       // "female" | "male" | "lgbtq"
  statuses: string[];      // from LOOKING_FOR_OPTIONS
  hashtags: string;        // raw input
  province: string;
  includeOffline: boolean;
  showBlurred: boolean;
};

const DEFAULT_FILTER: FilterState = {
  genders: [], statuses: [], hashtags: "", province: "",
  includeOffline: false, showBlurred: false,
};

function FilterPanel({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (f: FilterState) => void;
}) {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [provinceQuery, setProvinceQuery] = useState("");

  // Load saved filter
  useEffect(() => {
    try {
      const saved = localStorage.getItem("search_filter");
      if (saved) setFilter(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function toggleGender(g: string) {
    setFilter((f) => ({
      ...f,
      genders: f.genders.includes(g) ? f.genders.filter((x) => x !== g) : [...f.genders, g],
    }));
  }

  function toggleStatus(s: string) {
    setFilter((f) => ({
      ...f,
      statuses: f.statuses.includes(s) ? f.statuses.filter((x) => x !== s) : [...f.statuses, s],
    }));
  }

  function handleSave() {
    localStorage.setItem("search_filter", JSON.stringify(filter));
  }

  function handleReset() {
    setFilter(DEFAULT_FILTER);
    setProvinceQuery("");
  }

  const filteredProvinces = PROVINCES.filter((p) =>
    !provinceQuery || p.toLowerCase().includes(provinceQuery.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">ตั้งค่าการค้นหา</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-5">

          {/* Gender */}
          <div className="space-y-2">
            <div className="flex gap-3">
              {[
                { key: "female", emoji: "♀", label: "หญิง", activeClass: "bg-pink-500 text-white ring-pink-400" },
                { key: "male",   emoji: "♂", label: "ชาย",  activeClass: "bg-blue-500 text-white ring-blue-400" },
                { key: "lgbtq",  emoji: "🌈", label: "LGBTQ+", activeClass: "bg-purple-500 text-white ring-purple-400" },
              ].map(({ key, emoji, label, activeClass }) => {
                const active = filter.genders.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleGender(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                      active
                        ? `${activeClass} border-transparent ring-2`
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full ${active ? "bg-white/20" : "bg-gray-200 dark:bg-gray-600"} flex items-center justify-center text-xs`}>
                      {emoji}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Status chips */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">สถานะ</p>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((s) => {
                const active = filter.statuses.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                      active
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Hashtag */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">แฮชแท็ก</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-400 text-sm">#</span>
              <input
                value={filter.hashtags}
                onChange={(e) => setFilter((f) => ({ ...f, hashtags: e.target.value }))}
                placeholder="เพิ่มแฮชแท็ก"
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Province */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">ที่อยู่</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={provinceQuery || filter.province}
                onChange={(e) => {
                  setProvinceQuery(e.target.value);
                  if (!e.target.value) setFilter((f) => ({ ...f, province: "" }));
                }}
                placeholder="ค้นหาจังหวัด"
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
              />
              {filter.province && (
                <button onClick={() => { setFilter((f) => ({ ...f, province: "" })); setProvinceQuery(""); }}>
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
            {provinceQuery && !filter.province && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg max-h-40 overflow-y-auto">
                {filteredProvinces.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-3">ไม่พบจังหวัด</p>
                ) : (
                  filteredProvinces.slice(0, 10).map((p) => (
                    <button
                      key={p}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => { setFilter((f) => ({ ...f, province: p })); setProvinceQuery(""); }}
                    >
                      {p}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Toggles */}
          <div className="space-y-3">
            {[
              { key: "includeOffline" as const, label: "ค้นหาทั้งออนไลน์และออฟไลน์" },
              { key: "showBlurred" as const, label: "แสดงรูปภาพที่ถูกเบลอ" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
                <button
                  onClick={() => setFilter((f) => ({ ...f, [key]: !f[key] }))}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    filter[key] ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: filter[key] ? "translateX(24px)" : "translateX(0)" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 flex gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> รีเซ็ต
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <BookmarkCheck className="w-4 h-4" /> ดูบันทึก
          </button>
          <button
            onClick={() => { onApply(filter); onClose(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            <Search className="w-4 h-4" /> ค้นหา
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 30;

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
  const distance =
    myCoords && user.latitude && user.longitude
      ? haversineKm(myCoords.lat, myCoords.lng, user.latitude, user.longitude)
      : null;

  const statusText = (() => {
    if (online) return "ออนไลน์อยู่";
    return formatDistanceToNow(new Date(user.lastSeen), { addSuffix: false, locale: th });
  })();


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

  const [onlineTab, setOnlineTab] = useState<"online" | "offline">("online");
  const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male">("all");
  const [locationMode, setLocationMode] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterState>(DEFAULT_FILTER);

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

  const fetchUsers = useCallback(async (filter?: FilterState) => {
    const f = filter ?? activeFilter;
    const params = new URLSearchParams();
    if (genderFilter !== "all") params.set("gender", genderFilter);
    if (f.genders.length === 1) params.set("gender", f.genders[0]);
    if (f.province) params.set("province", f.province);
    if (f.statuses.length) params.set("lookingFor", f.statuses.join(","));
    if (f.hashtags.trim()) params.set("hashtag", f.hashtags.trim());
    if (!f.includeOffline) {} // default: show all, tab handles online/offline
    const res = await fetch(`/api/users?${params}`);
    const data: UserCard[] = await res.json();
    setUsers(data);
    setPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genderFilter, activeFilter]);

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
    const matchSearch = !q || u.username.toLowerCase().includes(q) || (u.nickname || "").toLowerCase().includes(q);
    const isOnline = u.isOnline || onlineIds.includes(u.id);
    const matchTab = onlineTab === "online" ? isOnline : !isOnline;
    return matchSearch && matchTab;
  });

  const onlineCount = users.filter((u) => u.id !== session?.user?.id && (u.isOnline || onlineIds.includes(u.id))).length;
  const offlineCount = users.filter((u) => u.id !== session?.user?.id && !(u.isOnline || onlineIds.includes(u.id))).length;
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
    setActiveFilter(DEFAULT_FILTER);
    savedCoordsRef.current = false;
  }

  const hasAdvancedFilter = activeFilter.genders.length > 0 || activeFilter.statuses.length > 0
    || !!activeFilter.hashtags || !!activeFilter.province;
  const hasFilter = genderFilter !== "all" || locationMode || search || hasAdvancedFilter;

  return (
    <div className="space-y-3">
      {/* Filter Panel */}
      <FilterPanel
        open={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApply={(f) => { setActiveFilter(f); fetchUsers(f); }}
      />

      {/* Profile Modal */}
      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          online={selectedUser.isOnline || onlineIds.includes(selectedUser.id)}
          myCoords={myCoords}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Online / Offline tabs */}
      <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => { setOnlineTab("online"); setPage(1); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            onlineTab === "online"
              ? "bg-green-50 text-green-600 border-b-2 border-green-500"
              : "text-gray-400 hover:bg-gray-50"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-400" />
          ออนไลน์
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${onlineTab === "online" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {onlineCount}
          </span>
        </button>
        <button
          onClick={() => { setOnlineTab("offline"); setPage(1); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            onlineTab === "offline"
              ? "bg-gray-100 text-gray-600 border-b-2 border-gray-400"
              : "text-gray-400 hover:bg-gray-50"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          ออฟไลน์
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${onlineTab === "offline" ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-500"}`}>
            {offlineCount}
          </span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Top row: count + clear */}
        <div className="flex items-center justify-between px-3 pt-1.5 pb-0.5">
          <span className="text-xs font-medium text-gray-500">{filtered.length} คน</span>
          {hasFilter && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
              <X className="w-3 h-3" />ล้างตัวกรอง
            </button>
          )}
        </div>
        {/* Scrollable button row */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide px-1 pb-1">

          <button onClick={() => fetchUsers()} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs text-gray-500 hover:bg-gray-50 shrink-0">
            <RefreshCw className="w-4 h-4 text-gray-400" />
            <span>ไฟฟ้า</span>
          </button>

          <button
            onClick={() => toggleGender("female")}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs transition-colors shrink-0 ${
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
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs transition-colors shrink-0 ${
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
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs transition-colors shrink-0 ${
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

          <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs text-gray-500 hover:bg-gray-50 shrink-0">
            <Heart className="w-4 h-4 text-gray-400" />
            <span>คนโปรด</span>
          </button>

          <button
            onClick={() => { setShowSearch((v) => !v); }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs transition-colors shrink-0 ${
              showSearch || search ? "bg-orange-50 text-orange-500 font-semibold ring-1 ring-orange-300" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Search className={`w-4 h-4 ${showSearch ? "text-orange-400" : "text-gray-400"}`} />
            <span>ค้นหา</span>
          </button>

          <button
            onClick={() => setShowFilterPanel(true)}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-xs transition-colors shrink-0 ${
              hasAdvancedFilter
                ? "bg-blue-50 text-blue-500 font-semibold ring-1 ring-blue-300"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className={`w-4 h-4 ${hasAdvancedFilter ? "text-blue-400" : "text-gray-400"}`} />
            <span>ฟังก์ชัน</span>
            {hasAdvancedFilter && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
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
            {activeFilter.genders.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {activeFilter.genders.join(" · ")}
                <button onClick={() => setActiveFilter((f) => ({ ...f, genders: [] }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeFilter.statuses.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {activeFilter.statuses.length} สถานะ
                <button onClick={() => setActiveFilter((f) => ({ ...f, statuses: [] }))}><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeFilter.province && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                📍 {activeFilter.province}
                <button onClick={() => setActiveFilter((f) => ({ ...f, province: "" }))}><X className="w-3 h-3" /></button>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
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

                  {/* Profile frame overlay */}
                  {user.showProfileFrame && user.profileFrameId && getFrame(user.profileFrameId) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/frames/${user.profileFrameId}.svg`}
                      alt=""
                      className="absolute inset-0 w-full h-full pointer-events-none select-none"
                      style={{ zIndex: 5 }}
                      aria-hidden
                    />
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
