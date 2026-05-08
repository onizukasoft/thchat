"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socket-client";
import { UserAvatar } from "@/components/user-avatar";
import {
  Headphones, Radio, Play, Pause, Square, Upload, Music,
  Users, Send, Loader2, Volume2, VolumeX,
} from "lucide-react";

type DJState = {
  djUserId: string;
  djName: string;
  djAvatar: string | null;
  songTitle: string;
  songUrl: string;
  startedAt: number;
  positionAtStart: number;
  isPlaying: boolean;
  pausedAt: number | null;
  pausedPosition: number;
  listenerCount: number;
} | null;

type ChatMsg = {
  userId: string;
  name: string;
  avatar: string | null;
  message: string;
  at: number;
};

function UrlSwapButton({ onSwap }: { onSwap: (url: string, title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    setErr("");
    const u = url.trim();
    if (!u) { setErr("ใส่ลิงก์ก่อน"); return; }
    try { new URL(u); } catch { setErr("ลิงก์ไม่ถูกต้อง"); return; }
    const ext = u.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    if (!["mp3","ogg","wav","m4a","aac","flac","opus","webm"].includes(ext)) {
      setErr("ต้องเป็นลิงก์ตรงไปยังไฟล์เสียง");
      return;
    }
    const t = title.trim() || u.split("/").pop()?.replace(/\.[^.]+$/, "") || "Track";
    onSwap(u, t);
    setUrl(""); setTitle(""); setOpen(false); setErr("");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Music className="w-3.5 h-3.5" /> ลิงก์
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 rounded-xl bg-white shadow-xl border border-gray-100 p-4 z-50">
          <p className="text-sm font-semibold text-gray-800 mb-3">เปลี่ยนเพลงจาก URL</p>
          <input
            type="url" value={url} onChange={e => { setUrl(e.target.value); setErr(""); }}
            placeholder="https://example.com/song.mp3"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 mb-2"
          />
          <input
            type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="ชื่อเพลง (ไม่บังคับ)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 mb-2"
          />
          {err && <p className="text-xs text-red-500 mb-2">{err}</p>}
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              เปลี่ยนเพลง
            </button>
            <button onClick={() => { setOpen(false); setErr(""); }} className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DJPage() {
  const { data: session } = useSession();
  const [djState, setDjState] = useState<DJState>(null);
  const [listenerCount, setListenerCount] = useState(0);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [startMode, setStartMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [djAvatar, setDjAvatar] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const iAmDJ = djState?.djUserId === session?.user?.id;

  // Fetch own avatar
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/users/${session.user.id}`)
      .then((r) => r.json())
      .then((u) => setDjAvatar(u.avatar ?? null))
      .catch(() => {});
  }, [session?.user?.id]);

  // Sync audio position from DJ state
  const syncAudio = useCallback((state: DJState) => {
    const audio = audioRef.current;
    if (!audio || !state) return;
    if (audio.src !== state.songUrl) {
      audio.src = state.songUrl;
      audio.load();
    }
    if (state.isPlaying) {
      const elapsed = (Date.now() - state.startedAt) / 1000;
      const target = state.positionAtStart + elapsed;
      if (Math.abs(audio.currentTime - target) > 1.5) {
        audio.currentTime = target;
      }
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = state.pausedPosition;
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("dj:join");

    socket.on("dj:state", (state: DJState) => {
      setDjState(state);
      if (state) {
        setListenerCount(state.listenerCount);
        setIsPlaying(state.isPlaying);
        syncAudio(state);
      } else {
        audioRef.current?.pause();
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      }
    });

    socket.on("dj:listeners", (count: number) => setListenerCount(count));

    socket.on("dj:chat:new", (msg: ChatMsg) => {
      setChatMsgs((prev) => [...prev.slice(-99), msg]);
    });

    return () => {
      socket.emit("dj:leave");
      socket.off("dj:state");
      socket.off("dj:listeners");
      socket.off("dj:chat:new");
    };
  }, [syncAudio]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/audio", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { alert(data.error); return; }
    e.target.value = "";

    // Start DJ session
    const socket = getSocket();
    socket.emit("dj:start", {
      userId: session.user.id,
      name: session.user.name || "DJ",
      avatar: djAvatar,
      songTitle: file.name.replace(/\.[^.]+$/, ""),
      songUrl: data.url,
      position: 0,
    });
  }

  function handleStartFromUrl() {
    setUrlError("");
    const url = urlInput.trim();
    if (!url) { setUrlError("กรุณาใส่ลิงก์เพลง"); return; }
    try { new URL(url); } catch { setUrlError("ลิงก์ไม่ถูกต้อง"); return; }
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["mp3", "ogg", "wav", "m4a", "aac", "flac", "opus", "webm"];
    if (!allowed.includes(ext)) {
      setUrlError("รองรับเฉพาะลิงก์ตรงไปยังไฟล์เสียง (.mp3, .ogg, .m4a ฯลฯ) — ลิงก์ YouTube ไม่รองรับ");
      return;
    }
    const title = urlTitle.trim() || url.split("/").pop()?.replace(/\.[^.]+$/, "") || "Unknown Track";
    const socket = getSocket();
    socket.emit("dj:start", {
      userId: session!.user!.id,
      name: session!.user!.name || "DJ",
      avatar: djAvatar,
      songTitle: title,
      songUrl: url,
      position: 0,
    });
    setUrlInput("");
    setUrlTitle("");
  }

  function handlePlayPause() {
    const audio = audioRef.current;
    const socket = getSocket();
    if (!audio || !djState || !iAmDJ) return;
    if (isPlaying) {
      audio.pause();
      socket.emit("dj:pause", { userId: session!.user!.id, position: audio.currentTime });
    } else {
      audio.play();
      socket.emit("dj:resume", { userId: session!.user!.id, position: audio.currentTime });
    }
  }

  function handleStop() {
    if (!session?.user?.id) return;
    const socket = getSocket();
    socket.emit("dj:stop", { userId: session.user.id });
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const pos = parseFloat(e.target.value);
    if (!audioRef.current || !iAmDJ) return;
    audioRef.current.currentTime = pos;
    setCurrentTime(pos);
    const socket = getSocket();
    if (isPlaying) {
      socket.emit("dj:resume", { userId: session!.user!.id, position: pos });
    } else {
      socket.emit("dj:pause", { userId: session!.user!.id, position: pos });
    }
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !session?.user) return;
    const socket = getSocket();
    socket.emit("dj:chat", {
      userId: session.user.id,
      name: session.user.name || "ผู้ใช้",
      avatar: djAvatar,
      message: chatInput.trim(),
    });
    setChatInput("");
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-6">
      <audio ref={audioRef} preload="metadata" />

      {/* Header */}
      <div className="flex items-center gap-2">
        <Headphones className="w-5 h-5 text-purple-500" />
        <h1 className="text-xl font-bold">ดีเจ</h1>
        {djState && (
          <span className="ml-2 flex items-center gap-1 text-xs text-red-500 font-medium">
            <Radio className="w-3 h-3 animate-pulse" /> LIVE
          </span>
        )}
      </div>

      {/* No session — prompt to become DJ */}
      {!djState && !session?.user && (
        <div className="text-center py-20 text-gray-400">
          <Headphones className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีดีเจออนไลน์</p>
        </div>
      )}

      {/* Become DJ button (no active session + logged in) */}
      {!djState && session?.user && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center">
            <Music className="w-12 h-12 mx-auto mb-3 text-purple-300" />
            <h2 className="text-lg font-bold text-gray-800">ยังไม่มีดีเจออนไลน์</h2>
            <p className="text-sm text-gray-500 mt-1">เริ่มออกอากาศให้ทุกคนฟังได้เลย</p>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-purple-100 mx-6">
            {(["upload", "url"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setStartMode(mode); setUrlError(""); }}
                className="flex-1 py-2.5 text-sm font-medium transition-colors"
                style={startMode === mode
                  ? { color: "#7c3aed", borderBottom: "2px solid #7c3aed" }
                  : { color: "#9ca3af", borderBottom: "2px solid transparent" }}
              >
                {mode === "upload" ? "📁 อัพโหลดไฟล์" : "🔗 ใส่ลิงก์เพลง"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {startMode === "upload" ? (
              <div className="text-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  {uploading ? "กำลังอัพโหลด..." : "เลือกไฟล์เพลง"}
                </button>
                <p className="text-xs text-gray-400 mt-3">รองรับ MP3, OGG, WAV, M4A · สูงสุด 30 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    ลิงก์เพลง <span className="text-gray-400">(ตรงไปยังไฟล์เสียง .mp3 / .m4a / .ogg)</span>
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
                    placeholder="https://example.com/song.mp3"
                    className="w-full rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    ชื่อเพลง <span className="text-gray-400">(ไม่บังคับ)</span>
                  </label>
                  <input
                    type="text"
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    placeholder="ชื่อเพลงที่จะแสดง..."
                    className="w-full rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                {urlError && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{urlError}</p>
                )}
                <button
                  onClick={handleStartFromUrl}
                  disabled={!urlInput.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <Play className="w-4 h-4" />
                  เริ่มออกอากาศ
                </button>
                <p className="text-xs text-gray-400 text-center">
                  ลิงก์ YouTube / Spotify ไม่รองรับ — ใช้ลิงก์ตรงไปยังไฟล์เสียงเท่านั้น
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active DJ session */}
      {djState && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* DJ banner */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-4 flex items-center gap-3">
            <UserAvatar src={djState.djAvatar} fallback={djState.djName[0]} className="w-12 h-12 ring-2 ring-white/40" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </span>
                <span className="text-white font-bold truncate">{djState.djName}</span>
              </div>
              <p className="text-purple-200 text-sm truncate mt-0.5">🎵 {djState.songTitle}</p>
            </div>
            <div className="flex items-center gap-1 text-purple-200 text-sm shrink-0">
              <Users className="w-4 h-4" />
              <span>{listenerCount}</span>
            </div>
          </div>

          {/* Player controls */}
          <div className="px-5 py-4 space-y-3">
            {/* Progress bar */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={iAmDJ ? handleSeek : undefined}
                readOnly={!iAmDJ}
                className="w-full accent-purple-600"
                style={{ cursor: iAmDJ ? "pointer" : "default" }}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              {/* Volume */}
              <button onClick={() => setMuted(!muted)} className="text-gray-400 hover:text-gray-600">
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                className="w-20 accent-purple-600"
              />

              <div className="flex-1" />

              {/* DJ controls */}
              {iAmDJ ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayPause}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleStop}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                    title="หยุดออกอากาศ"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    ไฟล์
                  </button>
                  <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                  <UrlSwapButton onSwap={(url, title) => {
                    const socket = getSocket();
                    socket.emit("dj:start", {
                      userId: session!.user!.id,
                      name: session!.user!.name || "DJ",
                      avatar: djAvatar,
                      songTitle: title,
                      songUrl: url,
                      position: 0,
                    });
                  }} />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const audio = audioRef.current;
                      if (!audio) return;
                      if (audio.paused) {
                        // Re-sync before playing
                        if (djState.isPlaying) {
                          const elapsed = (Date.now() - djState.startedAt) / 1000;
                          audio.currentTime = djState.positionAtStart + elapsed;
                        }
                        audio.play().catch(() => {});
                      } else {
                        audio.pause();
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <span className="text-xs text-gray-400">
                    {djState.isPlaying ? "กำลังออกอากาศ" : "หยุดชั่วคราว"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live chat */}
      {djState && (
        <div className="bg-white rounded-2xl border shadow-sm flex flex-col" style={{ height: 320 }}>
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">แชทสด</span>
            <span className="text-xs text-gray-400">({listenerCount} คนฟังอยู่)</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {chatMsgs.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">ยังไม่มีข้อความ — เริ่มพูดคุยได้เลย!</p>
            )}
            {chatMsgs.map((msg, i) => (
              <div key={i} className="flex items-start gap-2">
                <UserAvatar src={msg.avatar} fallback={msg.name[0]} className="w-7 h-7 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-purple-600">{msg.name} </span>
                  <span className="text-sm text-gray-700 break-words">{msg.message}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {session?.user && (
            <form onSubmit={sendChat} className="border-t px-3 py-2 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                maxLength={200}
                className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg px-3 py-2 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Not logged in but session active — listener */}
      {djState && !session?.user && (
        <p className="text-center text-sm text-gray-400">
          <a href="/login" className="text-purple-600 underline">เข้าสู่ระบบ</a> เพื่อพูดคุยในแชทสด
        </p>
      )}
    </div>
  );
}
