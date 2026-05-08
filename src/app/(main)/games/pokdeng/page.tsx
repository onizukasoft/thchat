"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Users } from "lucide-react";
import { getSocket } from "@/lib/socket-client";

type SeatUser = { userId: string; username: string; nickname: string | null };
type LobbyRow = { id: string; count: number; max: number; dealerName: string | null; minBet: number; pot: number };

type PokState = {
  roomId: string;
  seats: (SeatUser | null)[];
  max: number;
  dealerUserId: string;
  minBet: number;
  pot: number;
  contributions: Record<string, number>;
  round: {
    startedAt: number;
    hands: Record<string, { cards: { label: string; points: number }[]; revealed: boolean; canDraw: boolean; drewThird: boolean }>;
  } | null;
};

type PokOpResult =
  | { op: "create"; ok: true; roomId: string; userId: string }
  | { op: "create"; ok: false; error: string; userId: string }
  | { op: "join"; ok: true; seat: number; userId: string }
  | { op: "join"; ok: false; error: string; userId: string };

export default function PokdengPage() {
  const { data: session, status } = useSession();
  const [lobby, setLobby] = useState<LobbyRow[]>([]);
  const [room, setRoom] = useState<PokState | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [minBetInput, setMinBetInput] = useState("10");
  const [hostStakeInput, setHostStakeInput] = useState("50");
  const [joinBetInput, setJoinBetInput] = useState<Record<string, string>>({});
  const pendingOpRef = useRef<"create" | "join" | null>(null);

  const refreshLobby = useCallback(() => {
    const s = getSocket();
    s.emit("pokdeng:list", (rooms: LobbyRow[]) => setLobby(rooms ?? []));
  }, []);

  useEffect(() => {
    const s = getSocket();
    const onState = (st: PokState) => setRoom(st);
    const onDenied = () => setErr("มีแค่เจ้ามือแจกไพ่ได้");
    const onConnect = () => setSocketReady(true);
    const onDisconnect = () => {
      setSocketReady(false);
      if (pendingOpRef.current) {
        pendingOpRef.current = null;
        setBusy(false);
        setErr("การเชื่อมต่อขาดหาย แล้วลองอีกครั้งหลังเชื่อมต่อแล้ว");
      }
    };
    const onOpResult = (msg: PokOpResult) => {
      if (pendingOpRef.current !== msg.op) return;
      pendingOpRef.current = null;
      setBusy(false);
      if (!msg.ok) {
        const map: Record<string, string> = {
          full: "โต๊ะเต็ม (สูงสุด 6 คน)",
          not_found: "ไม่พบห้อง",
          invalid: "ข้อมูลไม่ครบ",
          invalid_bet: "จำนวนเดิมพันไม่ถูกต้อง",
          bet_too_low: "เดิมพันต่ำกว่าขั้นต่ำของโต๊ะ",
          insufficient_coins: "เหรียญไม่พอ",
          server_error: "เซิร์ฟเวอร์มีปัญหา ลองใหม่",
        };
        setErr(map[msg.error] ?? "ดำเนินการไม่สำเร็จ");
        return;
      }
      if (msg.op === "create") refreshLobby();
      if (msg.op === "join") refreshLobby();
    };
    s.on("pokdeng:state", onState);
    s.on("pokdeng:deal_denied", onDenied);
    s.on("pokdeng:op_result", onOpResult);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    setSocketReady(s.connected);
    refreshLobby();
    return () => {
      s.off("pokdeng:state", onState);
      s.off("pokdeng:deal_denied", onDenied);
      s.off("pokdeng:op_result", onOpResult);
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [refreshLobby]);

  const playerPayload = () => {
    const id = session?.user?.id;
    if (!id) return null;
    const username = session?.user?.email?.split("@")[0] ?? "guest";
    const nickname = session?.user?.name ?? null;
    return { userId: id, username, nickname };
  };

  const createRoom = () => {
    const p = playerPayload();
    if (!p) return;
    const s = getSocket();
    if (!s.connected) {
      setErr("ยังไม่เชื่อมต่อเซิร์ฟเวอร์ ลองรอสักครู่แล้วกดใหม่");
      return;
    }
    pendingOpRef.current = "create";
    setBusy(true);
    setErr(null);
    const minBet = Number(minBetInput);
    const hostStake = Number(hostStakeInput);
    // ใช้ pokdeng:op_result จากเซิร์ฟเวอร์ ไม่พึ่ง ack (เสถียรกว่าเมื่อร่วมกับ custom server)
    s.emit("pokdeng:create", { ...p, minBet, hostStake });
  };

  const joinRoom = (roomId: string, minBet: number) => {
    const p = playerPayload();
    if (!p) return;
    const s = getSocket();
    if (!s.connected) {
      setErr("ยังไม่เชื่อมต่อเซิร์ฟเวอร์ ลองใหม่อีกครั้ง");
      return;
    }
    pendingOpRef.current = "join";
    setBusy(true);
    setErr(null);
    const betAmount = Number(joinBetInput[roomId] ?? minBet);
    s.emit("pokdeng:join", { roomId, betAmount, ...p });
  };

  const leaveRoom = () => {
    const p = playerPayload();
    if (!p || !room) return;
    getSocket().emit("pokdeng:leave", { roomId: room.roomId, userId: p.userId });
    setRoom(null);
    refreshLobby();
  };

  const deal = () => {
    const p = playerPayload();
    if (!p || !room) return;
    getSocket().emit("pokdeng:deal", { roomId: room.roomId, userId: p.userId });
  };

  const revealSelf = () => {
    const p = playerPayload();
    if (!p || !room) return;
    getSocket().emit("pokdeng:reveal", { roomId: room.roomId, userId: p.userId });
  };

  const drawSelf = () => {
    const p = playerPayload();
    if (!p || !room) return;
    getSocket().emit("pokdeng:draw", { roomId: room.roomId, userId: p.userId });
  };

  if (status === "loading") {
    return <div className="max-w-lg mx-auto p-6 text-gray-400 text-sm">กำลังโหลด…</div>;
  }
  if (!session?.user?.id) {
    return (
      <div className="max-w-lg mx-auto space-y-4 text-center py-16">
        <p className="text-gray-500">เข้าสู่ระบบก่อนเพื่อเข้าห้องป็อกเด้ง</p>
        <Link href="/login" className="inline-block px-5 py-2 rounded-xl bg-green-600 text-white font-semibold">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const displayName = (u: SeatUser) => u.nickname || u.username;
  const me = session.user.id;
  const isDealerInRoom = room ? room.dealerUserId === me : false;
  const myHand = room?.round?.hands[me];

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-10">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">ป็อกเด้ง</h1>
        <span className={`text-xs ml-auto ${socketReady ? "text-emerald-600" : "text-red-500"}`}>
          {socketReady ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
        </span>
      </div>

      {!room?.roomId ? (
        <>
          <p className="text-sm text-gray-500">
            เลือกห้องหรือเปิดโต๊ะใหม่เป็นเจ้ามือ — มี 6 เก้าอี้ต่อห้อง ผู้ที่สร้างห้องคือเจ้าและเป็นคนแจกไพ่เท่านั้น
            ถ้าเจ้ออกจากโต๊ะขณะยังมีคนนั่ง เจ้าจะย้ายไปที่คนแรกตามเลขเก้าอี้ 1→6 โดยอัตโนมัติ
          </p>
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-500">
              ขั้นต่ำต่อคน
              <input
                value={minBetInput}
                onChange={(e) => setMinBetInput(e.target.value)}
                inputMode="numeric"
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500">
              ทุนตั้งโต๊ะเจ้ามือ
              <input
                value={hostStakeInput}
                onChange={(e) => setHostStakeInput(e.target.value)}
                inputMode="numeric"
                className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={createRoom}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow disabled:opacity-50"
          >
            สร้างห้องเป็นเจ้ามือ
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>ห้องที่เปิดอยู่</span>
            <button type="button" onClick={refreshLobby} className="ml-auto text-xs text-blue-600 hover:underline">
              รีเฟรช
            </button>
          </div>
          <ul className="space-y-2">
            {lobby.length === 0 && <li className="text-sm text-gray-400 py-6 text-center border rounded-xl">ยังไม่มีห้อง — สร้างห้องแรกได้เลย</li>}
            {lobby.map((r) => (
              <li key={r.id} className="flex items-center gap-3 bg-white border rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-gray-400 truncate">{r.id}</p>
                  <p className="text-sm font-medium">
                    {r.count}/{r.max} ที่นั่ง
                    {r.dealerName && (
                      <span className="block text-xs font-normal text-amber-700 mt-0.5">เจ้า: {r.dealerName}</span>
                    )}
                    <span className="block text-xs font-normal text-blue-700 mt-0.5">
                      ขั้นต่ำ {r.minBet} | กองกลาง {r.pot}
                    </span>
                  </p>
                </div>
                <div className="w-24">
                  <input
                    value={joinBetInput[r.id] ?? String(r.minBet)}
                    onChange={(e) => setJoinBetInput((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    inputMode="numeric"
                    className="w-full rounded-md border px-2 py-1 text-xs"
                    title={`ขั้นต่ำ ${r.minBet}`}
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || r.count >= r.max}
                  onClick={() => joinRoom(r.id, r.minBet)}
                  className="shrink-0 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-40"
                >
                  {r.count >= r.max ? "เต็ม" : "เข้าห้อง"}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" onClick={leaveRoom} className="px-4 py-2 rounded-xl border text-sm hover:bg-gray-50">
              ออกจากห้อง
            </button>
            <button
              type="button"
              onClick={deal}
              disabled={!isDealerInRoom}
              title={!isDealerInRoom ? "มีแค่เจ้ามือแจกไพ่ได้" : undefined}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              แจกไพ่รอบนี้ (เจ้ามือ)
            </button>
            {!isDealerInRoom && (
              <span className="text-xs text-gray-500">คุณเป็นผู้เล่น — รอเจ้ามือแจกไพ่</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={revealSelf}
              disabled={!myHand || myHand.revealed}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
            >
              เปิดไพ่ของฉัน
            </button>
            <button
              type="button"
              onClick={drawSelf}
              disabled={!myHand || myHand.revealed || !myHand.canDraw || myHand.drewThird}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
              title="ขอไพ่เพิ่มได้เมื่อแต้ม 2 ใบแรกน้อยกว่า 8"
            >
              ขอไพ่เพิ่ม 1 ใบ (ต้องหงาย)
            </button>
          </div>
          <p className="text-xs text-gray-400">
            เจ้าแจกไพ่คว่ำก่อน แล้วผู้เล่นแต่ละคนต้องกดเปิดไพ่เอง; ถ้าแต้ม 2 ใบแรกน้อยกว่า 8 ขอไพ่เพิ่มได้ 1 ใบและต้องหงายทันที
          </p>
          <p className="text-xs text-indigo-700">
            ขั้นต่ำโต๊ะ: {room.minBet} | กองกลาง: {room.pot} | เดิมพันของคุณ: {room.contributions[me] ?? 0}
          </p>

          <div className="relative aspect-square max-w-md mx-auto rounded-3xl border-2 border-amber-800/40 bg-gradient-to-b from-amber-100 to-amber-200/80 p-4 shadow-inner">
            <div className="absolute inset-8 rounded-2xl border border-amber-900/20 bg-emerald-900/10 flex flex-col items-center justify-center gap-1">
              <span className="text-amber-900/50 text-sm font-medium">โต๊ะ</span>
              {room.seats.some((s) => s?.userId === room.dealerUserId) ? (
                <span className="text-[11px] text-amber-900/65 font-medium">
                  เจ้า:{" "}
                  {displayName(room.seats.find((s) => s?.userId === room.dealerUserId)!)}
                </span>
              ) : null}
            </div>
            {room.seats.map((s, i) => {
              const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
              const radius = 42;
              const left = 50 + radius * Math.cos(angle);
              const top = 50 + radius * Math.sin(angle);
              const hand = s ? room.round?.hands[s.userId] : null;
              const showCards = !!s && !!hand && (s.userId === me || hand.revealed);
              const points = hand ? hand.cards.reduce((sum, c) => sum + c.points, 0) % 10 : null;
              return (
                <div
                  key={i}
                  className="absolute w-[28%] -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <div
                    className={`rounded-xl border-2 p-2 text-center shadow-sm ${
                      s?.userId === me ? "border-green-600 bg-green-50" : "border-white bg-white/90"
                    } ${!s ? "opacity-50 border-dashed" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-0.5">
                      <p className="text-[10px] text-gray-400">ที่ {i + 1}</p>
                      {s?.userId === room.dealerUserId ? (
                        <span className="text-[9px] font-bold uppercase bg-amber-500 text-white px-1 rounded">เจ้า</span>
                      ) : null}
                    </div>
                    {s ? (
                      <>
                        <p className="text-xs font-semibold truncate">{displayName(s)}</p>
                        {hand && (
                          <p className="text-lg font-mono font-bold mt-1 tracking-tight">
                            {showCards ? hand.cards.map((c) => c.label).join(" ") : hand.cards.map(() => "🂠").join(" ")}
                          </p>
                        )}
                        {hand && (showCards ? (
                          <p className="text-xs text-amber-800 font-bold">แต้ม {points}</p>
                        ) : (
                          <p className="text-[10px] text-gray-400">ยังไม่เปิดไพ่</p>
                        ))}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 py-2">ว่าง</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <ul className="text-xs text-gray-500 space-y-1">
            <li>• เมื่อครบคนเข้ามาแล้ว ให้เจ้ามือกดแจกไพ่ให้ทุกคนที่มีที่นั่ง</li>
            <li>• ผู้เล่นคนสุดท้ายในโต๊ะออกครบ ห้องจะถูกปิดโดยอัตโนมัติ</li>
          </ul>
        </>
      )}
    </div>
  );
}
