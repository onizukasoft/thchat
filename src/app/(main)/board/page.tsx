"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare, Eye, Plus, Flame, X, ImageIcon,
  Video, Loader2, LayoutGrid, Heart, Laugh, Newspaper, HelpCircle,
  Play, PenLine, Send, Globe, Users, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import type { LucideIcon } from "lucide-react";

type MediaItem = { url: string; type: "image" | "video" };
type Post = {
  id: string; title: string; content: string; category: string;
  mediaUrls: string | null; views: number; createdAt: string;
  user: { id: string; username: string; nickname: string | null; avatar: string | null };
  _count: { comments: number };
};

function parseMedia(raw: string | null): MediaItem[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
function firstVideo(raw: string | null) {
  return parseMedia(raw).find((m) => m.type === "video")?.url ?? null;
}

function MediaGrid({ items }: { items: MediaItem[] }) {
  if (!items.length) return null;
  if (items.length === 1) {
    const m = items[0];
    return (
      <div className="mt-3 rounded-2xl overflow-hidden bg-black max-h-80">
        {m.type === "video"
          ? <video src={m.url} className="w-full max-h-80 object-cover" muted playsInline />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={m.url} alt="" className="w-full max-h-80 object-cover" />}
      </div>
    );
  }
  const cols = items.length === 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`mt-3 grid ${cols} gap-1 rounded-2xl overflow-hidden`}>
      {items.slice(0, 4).map((m, i) => (
        <div key={i} className="relative aspect-square bg-black overflow-hidden">
          {m.type === "video"
            ? <video src={m.url} className="w-full h-full object-cover" muted playsInline />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={m.url} alt="" className="w-full h-full object-cover" />}
          {i === 3 && items.length > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">+{items.length - 4}</div>
          )}
        </div>
      ))}
    </div>
  );
}

const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "all",      label: "ฟีด",     icon: LayoutGrid },
  { value: "general",  label: "ทั่วไป",  icon: Globe },
  { value: "love",     label: "ความรัก", icon: Heart },
  { value: "joke",     label: "ขำขัน",   icon: Laugh },
  { value: "news",     label: "ข่าวสาร", icon: Newspaper },
  { value: "question", label: "ถามตอบ",  icon: HelpCircle },
];

const CAT_META: Record<string, { color: string; bg: string }> = {
  general:  { color: "text-blue-600",   bg: "bg-blue-50" },
  love:     { color: "text-pink-600",   bg: "bg-pink-50" },
  joke:     { color: "text-amber-600",  bg: "bg-amber-50" },
  news:     { color: "text-green-600",  bg: "bg-green-50" },
  question: { color: "text-violet-600", bg: "bg-violet-50" },
  all:      { color: "text-gray-600",   bg: "bg-gray-100" },
};

// ── Video strip card ──────────────────────────────────────────────────────────
function VideoCard({ post }: { post: Post }) {
  const videoUrl = firstVideo(post.mediaUrls)!;
  const videoRef = useRef<HTMLVideoElement>(null);
  const name = post.user.nickname || post.user.username;
  return (
    <Link href={`/board/${post.id}`} className="shrink-0 w-32 group">
      <div className="relative w-32 h-52 rounded-2xl overflow-hidden shadow-sm">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          muted playsInline loop
          onMouseEnter={() => videoRef.current?.play()}
          onMouseLeave={() => { videoRef.current?.pause(); if (videoRef.current) videoRef.current.currentTime = 0; }}
        />
        {/* dim overlay lifts on hover */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        {/* play button */}
        <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* bottom info */}
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center gap-1.5">
          <Avatar className="w-5 h-5 shrink-0 ring-1 ring-white/60">
            <AvatarImage src={post.user.avatar || ""} />
            <AvatarFallback className="text-[8px] bg-purple-500 text-white">{name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-white/90 text-[10px] font-medium truncate leading-tight">{name}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, isFriend }: { post: Post; isFriend?: boolean }) {
  const cat = CATEGORIES.find((c) => c.value === post.category) ?? CATEGORIES[1];
  const CatIcon = cat.icon;
  const meta = CAT_META[post.category] ?? CAT_META.general;
  const name = post.user.nickname || post.user.username;
  const media = parseMedia(post.mediaUrls);
  const hasMedia = media.length > 0;

  return (
    <Link href={`/board/${post.id}`} className="block group">
      <article className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-shadow duration-200 overflow-hidden">
        <div className="p-4">
          {/* Author row */}
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar className="w-9 h-9 shrink-0 ring-2 ring-gray-100">
              <AvatarImage src={post.user.avatar || ""} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs font-bold">
                {name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
                {isFriend && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-500">
                    <Users className="w-2.5 h-2.5" />เพื่อน
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: th })}
              </p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
              <CatIcon className="w-3 h-3" />{cat.label}
            </span>
          </div>

          {/* Content */}
          <h2 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors leading-snug mb-1">{post.title}</h2>
          <p className={`text-sm text-gray-500 leading-relaxed ${hasMedia ? "line-clamp-2" : "line-clamp-3"}`}>{post.content}</p>
        </div>

        {/* Media (edge-to-edge) */}
        {hasMedia && (
          <div className="px-4 pb-4">
            <MediaGrid items={media} />
          </div>
        )}

        {/* Stats row */}
        <div className="px-4 pb-3.5 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1 hover:text-purple-500 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />{post._count.comments} ความคิดเห็น
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />{post.views} ครั้ง
          </span>
          <span className="ml-auto text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium flex items-center gap-0.5">
            อ่านต่อ <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </article>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BoardPage() {
  const { data: session } = useSession();
  const [feed, setFeed] = useState<Post[]>([]);
  const [friendVideos, setFriendVideos] = useState<Post[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "general" });
  const [submitting, setSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; type: "image" | "video" }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFeed = useCallback(async (category: string) => {
    const url = `/api/posts/feed${category !== "all" ? `?category=${category}` : ""}`;
    const data = await fetch(url).then((r) => r.json());
    if (data.feed) {
      setFeed(data.feed);
      setFriendVideos(data.friendVideos ?? []);
      setFriendIds(new Set<string>((data.friendVideos ?? []).map((p: Post) => p.user.id)));
    }
  }, []);

  useEffect(() => { loadFeed(activeCategory); }, [activeCategory, loadFeed]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).slice(0, 9 - mediaFiles.length).forEach((file) => {
      setMediaFiles((p) => [...p, { file, preview: URL.createObjectURL(file), type: file.type.startsWith("video/") ? "video" : "image" }]);
    });
    e.target.value = "";
  }
  function removeMedia(idx: number) {
    setMediaFiles((p) => { URL.revokeObjectURL(p[idx].preview); return p.filter((_, i) => i !== idx); });
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    let uploadedMedia: MediaItem[] = [];
    if (mediaFiles.length > 0) {
      setUploading(true);
      const fd = new FormData();
      mediaFiles.forEach((m) => fd.append("files", m.file));
      const res = await fetch("/api/upload/post", { method: "POST", body: fd });
      const data = await res.json();
      setUploading(false);
      if (!res.ok) { alert(data.error ?? "อัปโหลดล้มเหลว"); setSubmitting(false); return; }
      uploadedMedia = data.files;
    }
    const res = await fetch("/api/posts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, mediaUrls: uploadedMedia }),
    });
    const post = await res.json();
    setFeed((p) => [post, ...p]);
    setCreating(false);
    setForm({ title: "", content: "", category: "general" });
    mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
    setMediaFiles([]);
    setSubmitting(false);
  }

  const hot = feed.filter((p) => p._count.comments > 0 || p.views > 5).slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between py-1">
        <h1 className="text-xl font-bold text-gray-900">กระดาน</h1>
        {session?.user && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-purple-200">
            <Plus className="w-4 h-4" />โพสต์ใหม่
          </button>
        )}
      </div>

      {/* ── Friend video strip ── */}
      {friendVideos.length > 0 && (
        <section className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-purple-500" />วิดีโอจากเพื่อน
            </h2>
            <span className="text-[11px] text-gray-400">{friendVideos.length} คลิป</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
            {friendVideos.map((p) => <VideoCard key={p.id} post={p} />)}
          </div>
        </section>
      )}

      {/* ── Trending ── */}
      {hot.length > 0 && activeCategory === "all" && (
        <section className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
            <Flame className="w-4 h-4 text-orange-500" />กำลังฮิต
          </h2>
          <div className="space-y-2">
            {hot.map((p, i) => (
              <Link key={p.id} href={`/board/${p.id}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-orange-50 transition-colors group">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="truncate flex-1 text-sm text-gray-700 group-hover:text-orange-600 transition-colors">{p.title}</span>
                <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />{p._count.comments}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Category tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.value;
          return (
            <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                active ? "bg-gray-900 text-white shadow-sm" : "bg-white text-gray-500 hover:text-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              }`}>
              <Icon className="w-3.5 h-3.5" />{cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Create post modal ── */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setCreating(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">โพสต์ใหม่</h2>
              <button onClick={() => setCreating(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={createPost} className="p-5 space-y-3">
              {/* Category */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter((c) => c.value !== "all").map((c) => {
                  const Icon = c.icon;
                  const m = CAT_META[c.value];
                  return (
                    <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        form.category === c.value ? `${m.bg} ${m.color} ring-1 ring-current/30` : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      <Icon className="w-3 h-3" />{c.label}
                    </button>
                  );
                })}
              </div>
              <input placeholder="หัวข้อโพสต์ *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="w-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" />
              <textarea placeholder="เขียนเนื้อหา..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} required
                className="w-full border border-gray-200 bg-gray-50 focus:bg-white focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none" />

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaFiles.map((m, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                      {m.type === "video"
                        ? <video src={m.preview} className="w-full h-full object-cover" muted />
                        // eslint-disable-next-line @next/next/no-img-element
                        : <img src={m.preview} alt="" className="w-full h-full object-cover" />}
                      <button type="button" onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                      {m.type === "video" && (
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Play className="w-2.5 h-2.5 fill-white" />วิดีโอ
                        </div>
                      )}
                    </div>
                  ))}
                  {mediaFiles.length < 9 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-purple-300 hover:text-purple-400 transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={onFileChange} />
              {mediaFiles.length === 0 && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); } }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors">
                    <ImageIcon className="w-4 h-4" />รูปภาพ
                  </button>
                  <button type="button" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "video/mp4,video/webm,video/quicktime"; fileInputRef.current.click(); } }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors">
                    <Video className="w-4 h-4" />วิดีโอ
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setCreating(false); mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview)); setMediaFiles([]); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={submitting || uploading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังอัปโหลด...</>
                    : submitting ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังโพสต์...</>
                    : <><Send className="w-4 h-4" />โพสต์เลย</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Feed ── */}
      {feed.length === 0 ? (
        <div className="text-center py-24 text-gray-300">
          <PenLine className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-gray-500 font-medium">ยังไม่มีโพสต์</p>
          {session?.user && (
            <button onClick={() => setCreating(true)} className="mt-2 text-purple-500 hover:text-purple-600 text-sm font-medium">
              เป็นคนแรกที่โพสต์!
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((post) => (
            <PostCard key={post.id} post={post} isFriend={friendIds.has(post.user.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
