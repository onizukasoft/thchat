import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, type Socket } from "socket.io";
import { prisma } from "./src/lib/prisma";
import { getPackageLimits } from "./src/lib/packages";
import { notificationBus } from "./src/lib/notification-event";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  await prisma.user.updateMany({ where: { isOnline: true }, data: { isOnline: false } });

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map<string, { userId: string; socketId: string }>();

  // ─── DJ Session ─────────────────────────────────────────────────────────────
  type DJSession = {
    djUserId: string;
    djName: string;
    djAvatar: string | null;
    songTitle: string;
    songUrl: string;
    startedAt: number;   // Date.now() when play was issued
    positionAtStart: number; // seconds offset when play was issued
    isPlaying: boolean;
    pausedAt: number | null; // Date.now() when paused
    pausedPosition: number;  // position in seconds when paused
    listenerCount: number;
  };
  let djSession: DJSession | null = null;
  let djSocketId: string | null = null;
  const djListeners = new Set<string>(); // socket IDs in DJ room

  const POKDENG_MAX = 6;
  type PokCard = { rank: number; suit: number; label: string; points: number };
  type PokHand = { cards: PokCard[]; revealed: boolean; canDraw: boolean; drewThird: boolean };
  type PokRound = { startedAt: number; hands: Record<string, PokHand> };
  type PokSeat = { userId: string; username: string; nickname: string | null } | null;
  type PokdengRoom = {
    id: string;
    seats: PokSeat[];
    /** ผู้สร้างห้องเป็นเจ้ามือเริ่มต้น; ถ้าเจ้ออกจากโต๊ะจะเลื่อนเป็นเจ้าใหม่ตามเก้าอี้ 1→6 */
    dealerUserId: string;
    minBet: number;
    pot: number;
    contributions: Record<string, number>;
    round: PokRound | null;
  };
  const pokdengRooms = new Map<string, PokdengRoom>();
  /** socket id -> room + user (for cleanup) */
  const socketPokdeng = new Map<string, { roomId: string; userId: string }>();

  function pokdengBroadcast(roomId: string) {
    const room = pokdengRooms.get(roomId);
    if (!room) return;
    io.to(`pokdeng:${roomId}`).emit("pokdeng:state", {
      roomId,
      seats: room.seats,
      max: POKDENG_MAX,
      dealerUserId: room.dealerUserId,
      minBet: room.minBet,
      pot: room.pot,
      contributions: room.contributions,
      round: room.round,
    });
  }

  function leavePokdengRoom(socketId: string, socketRef: Socket) {
    const meta = socketPokdeng.get(socketId);
    if (!meta) return;
    socketPokdeng.delete(socketId);
    const room = pokdengRooms.get(meta.roomId);
    if (!room) return;
    socketRef.leave(`pokdeng:${meta.roomId}`);
    room.seats = room.seats.map((s) => (s?.userId === meta.userId ? null : s));
    if (room.contributions[meta.userId]) delete room.contributions[meta.userId];
    if (room.round?.hands[meta.userId]) {
      delete room.round.hands[meta.userId];
    }
    const anyLeft = room.seats.some((s) => s !== null);
    if (!anyLeft) pokdengRooms.delete(meta.roomId);
    else {
      const dealerStillHere = room.seats.some((s) => s?.userId === room.dealerUserId);
      if (!dealerStillHere) {
        const next = room.seats.find((s) => s !== null);
        if (next) room.dealerUserId = next.userId;
      }
      pokdengBroadcast(meta.roomId);
    }
  }

  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
  const SUITS = ["♠", "♥", "♦", "♣"] as const;

  function cardPoints(rankIndex: number): number {
    const r = rankIndex + 1;
    if (r >= 10) return 0;
    return r;
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildDeck(): PokCard[] {
    const deck: PokCard[] = [];
    for (let r = 0; r < 13; r++) {
      for (let su = 0; su < 4; su++) {
        deck.push({ rank: r, suit: su, label: `${RANKS[r]}${SUITS[su]}`, points: cardPoints(r) });
      }
    }
    return deck;
  }

  function totalPoints(cards: PokCard[]): number {
    return cards.reduce((sum, c) => sum + c.points, 0) % 10;
  }

  function drawAvailableThirdCard(room: PokdengRoom): PokCard | null {
    const used = new Set<string>();
    const hands = room.round?.hands ?? {};
    for (const h of Object.values(hands)) {
      for (const c of h.cards) used.add(c.label);
    }
    const available = buildDeck().filter((c) => !used.has(c.label));
    if (available.length === 0) return null;
    return shuffle(available)[0] ?? null;
  }

  async function trySpendCoins(userId: string, amount: number, type: string, description: string): Promise<boolean> {
    if (amount <= 0) return true;
    const res = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, coins: { gte: amount } },
        data: { coins: { decrement: amount } },
      });
      if (updated.count === 0) return false;
      await tx.coinTransaction.create({
        data: { userId, amount: -amount, type, description },
      });
      return true;
    });
    return res;
  }

  // Forward notification events to the target user's socket
  notificationBus.on("new", ({ userId }: { userId: string }) => {
    const entry = Array.from(onlineUsers.entries()).find(([, v]) => v.userId === userId);
    if (entry) io.to(entry[0]).emit("notification:new");
  });

  io.on("connection", (socket) => {
    socket.emit("users:online", Array.from(onlineUsers.values()).map((u) => u.userId));

    socket.on("request:online", () => {
      socket.emit("users:online", Array.from(onlineUsers.values()).map((u) => u.userId));
    });

    socket.on("user:online", async (userId: string) => {
      onlineUsers.set(socket.id, { userId, socketId: socket.id });
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() },
      });
      io.emit("users:online", Array.from(onlineUsers.values()).map((u) => u.userId));
    });

    socket.on("user:typing", (data: { senderId: string; receiverId: string }) => {
      const receiverSocket = Array.from(onlineUsers.entries()).find(([, v]) => v.userId === data.receiverId);
      if (receiverSocket) io.to(receiverSocket[0]).emit("typing:start", data.senderId);
    });

    socket.on("user:stop_typing", (data: { senderId: string; receiverId: string }) => {
      const receiverSocket = Array.from(onlineUsers.entries()).find(([, v]) => v.userId === data.receiverId);
      if (receiverSocket) io.to(receiverSocket[0]).emit("typing:stop", data.senderId);
    });

    socket.on("message:send", async (data: { senderId: string; receiverId: string; content: string; type?: string; mediaUrl?: string }) => {
      // Call-type messages bypass chat limits (system notifications)
      if (data.type === "call") {
        const message = await prisma.message.create({
          data: { content: data.content, type: "call", mediaUrl: null, senderId: data.senderId, receiverId: data.receiverId },
          include: { sender: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } } },
        });
        const receiverSocket = Array.from(onlineUsers.entries()).find(([, v]) => v.userId === data.receiverId);
        if (receiverSocket) io.to(receiverSocket[0]).emit("message:receive", message);
        socket.emit("message:sent", message);
        return;
      }

      // Check daily chat limit
      const me = await prisma.user.findUnique({
        where: { id: data.senderId },
        select: { vipLevel: true, vipUntil: true },
      });
      const limits = getPackageLimits(me?.vipLevel, me?.vipUntil);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const chatCountToday = await prisma.message.groupBy({
        by: ["receiverId"],
        where: { senderId: data.senderId, createdAt: { gte: today } },
      });
      const alreadyChatted = chatCountToday.some((m) => m.receiverId === data.receiverId);
      if (!alreadyChatted && chatCountToday.length >= limits.chatPerDay) {
        socket.emit("message:error", {
          error: "chat_limit",
          message: `คุณแชทครบ ${limits.chatPerDay} คนแล้ววันนี้`,
          limit: limits.chatPerDay,
          package: limits.label,
          upgrade: limits.chatPerDay < 50,
        });
        return;
      }

      const message = await prisma.message.create({
        data: {
          content: data.content,
          type: data.type ?? "text",
          mediaUrl: data.mediaUrl ?? null,
          senderId: data.senderId,
          receiverId: data.receiverId,
        },
        include: { sender: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } } },
      });

      // Send to receiver if online
      const receiverSocket = Array.from(onlineUsers.entries()).find(
        ([, v]) => v.userId === data.receiverId
      );
      if (receiverSocket) {
        io.to(receiverSocket[0]).emit("message:receive", message);
      }
      socket.emit("message:sent", message);
    });

    socket.on("room:join", (roomId: string) => {
      socket.join(`room:${roomId}`);
    });

    socket.on("room:leave", (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on("room:message", async (data: { userId: string; roomId: string; content: string }) => {
      const message = await prisma.roomMessage.create({
        data: {
          content: data.content,
          userId: data.userId,
          roomId: data.roomId,
        },
        include: { user: { select: { id: true, username: true, nickname: true, avatar: true, profileFrameId: true, showProfileFrame: true } } },
      });
      io.to(`room:${data.roomId}`).emit("room:message:new", message);
    });

    socket.on(
      "pokdeng:list",
      (
        cb?: (
          rooms: { id: string; count: number; max: number; dealerName: string | null; minBet: number; pot: number }[],
        ) => void,
      ) => {
        const list = [...pokdengRooms.values()].map((r) => {
          const d = r.seats.find((s) => s?.userId === r.dealerUserId);
          const dealerName = d ? d.nickname || d.username : null;
          return {
            id: r.id,
            count: r.seats.filter(Boolean).length,
            max: POKDENG_MAX,
            dealerName,
            minBet: r.minBet,
            pot: r.pot,
          };
        });
        cb?.(list);
      },
    );

    socket.on("pokdeng:create", async (data: { userId: string; username: string; nickname: string | null; minBet?: number; hostStake?: number }) => {
      try {
        if (!data?.userId) {
          socket.emit("pokdeng:op_result", { op: "create" as const, ok: false as const, error: "invalid", userId: data?.userId ?? "" });
          return;
        }
        const minBet = Math.floor(Number(data.minBet ?? 10));
        const hostStake = Math.floor(Number(data.hostStake ?? minBet));
        if (!Number.isFinite(minBet) || !Number.isFinite(hostStake) || minBet < 1 || hostStake < minBet) {
          socket.emit("pokdeng:op_result", {
            op: "create" as const,
            ok: false as const,
            error: "invalid_bet",
            userId: data.userId,
          });
          return;
        }
        const spent = await trySpendCoins(
          data.userId,
          hostStake,
          "pokdeng_host_stake",
          `ตั้งโต๊ะป็อกเด้งขั้นต่ำ ${minBet} เหรียญ`,
        );
        if (!spent) {
          socket.emit("pokdeng:op_result", {
            op: "create" as const,
            ok: false as const,
            error: "insufficient_coins",
            userId: data.userId,
          });
          return;
        }
        leavePokdengRoom(socket.id, socket);
        const roomId = `pok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        const seats: PokSeat[] = Array.from({ length: POKDENG_MAX }, () => null);
        seats[0] = {
          userId: data.userId,
          username: data.username || "ผู้เล่น",
          nickname: data.nickname ?? null,
        };
        pokdengRooms.set(roomId, {
          id: roomId,
          seats,
          dealerUserId: data.userId,
          minBet,
          pot: hostStake,
          contributions: { [data.userId]: hostStake },
          round: null,
        });
        socket.join(`pokdeng:${roomId}`);
        socketPokdeng.set(socket.id, { roomId, userId: data.userId });
        pokdengBroadcast(roomId);
        socket.emit("pokdeng:op_result", { op: "create" as const, ok: true as const, roomId, userId: data.userId });
      } catch {
        socket.emit("pokdeng:op_result", {
          op: "create" as const,
          ok: false as const,
          error: "server_error",
          userId: data?.userId ?? "",
        });
      }
    });

    socket.on("pokdeng:join", async (data: { roomId: string; userId: string; username: string; nickname: string | null; betAmount?: number }) => {
      try {
        const room = data?.roomId ? pokdengRooms.get(data.roomId) : undefined;
        if (!room || !data?.userId) {
          socket.emit("pokdeng:op_result", {
            op: "join" as const,
            ok: false as const,
            error: "not_found",
            userId: data?.userId ?? "",
          });
          return;
        }
        const seatIdx = room.seats.findIndex((s) => s?.userId === data.userId);
        if (seatIdx >= 0) {
          const meta = socketPokdeng.get(socket.id);
          if (meta?.roomId === data.roomId && meta.userId === data.userId) {
            socket.join(`pokdeng:${data.roomId}`);
            pokdengBroadcast(data.roomId);
            socket.emit("pokdeng:op_result", { op: "join" as const, ok: true as const, seat: seatIdx, userId: data.userId });
            return;
          }
          if (meta) leavePokdengRoom(socket.id, socket);
          socket.join(`pokdeng:${data.roomId}`);
          socketPokdeng.set(socket.id, { roomId: data.roomId, userId: data.userId });
          pokdengBroadcast(data.roomId);
          socket.emit("pokdeng:op_result", { op: "join" as const, ok: true as const, seat: seatIdx, userId: data.userId });
          return;
        }
        const betAmount = Math.floor(Number(data.betAmount ?? room.minBet));
        if (!Number.isFinite(betAmount) || betAmount < room.minBet) {
          socket.emit("pokdeng:op_result", {
            op: "join" as const,
            ok: false as const,
            error: "bet_too_low",
            userId: data.userId,
          });
          return;
        }
        const free = room.seats.findIndex((s) => s === null);
        if (free < 0) {
          socket.emit("pokdeng:op_result", { op: "join" as const, ok: false as const, error: "full", userId: data.userId });
          return;
        }
        const spent = await trySpendCoins(
          data.userId,
          betAmount,
          "pokdeng_join_bet",
          `เข้าห้องป็อกเด้ง ${room.id} เดิมพัน ${betAmount} เหรียญ`,
        );
        if (!spent) {
          socket.emit("pokdeng:op_result", {
            op: "join" as const,
            ok: false as const,
            error: "insufficient_coins",
            userId: data.userId,
          });
          return;
        }
        leavePokdengRoom(socket.id, socket);
        room.seats[free] = {
          userId: data.userId,
          username: data.username || "ผู้เล่น",
          nickname: data.nickname ?? null,
        };
        room.pot += betAmount;
        room.contributions[data.userId] = betAmount;
        socket.join(`pokdeng:${data.roomId}`);
        socketPokdeng.set(socket.id, { roomId: data.roomId, userId: data.userId });
        pokdengBroadcast(data.roomId);
        socket.emit("pokdeng:op_result", { op: "join" as const, ok: true as const, seat: free, userId: data.userId });
      } catch {
        socket.emit("pokdeng:op_result", {
          op: "join" as const,
          ok: false as const,
          error: "server_error",
          userId: data?.userId ?? "",
        });
      }
    });

    socket.on("pokdeng:leave", (data?: { roomId: string; userId: string }) => {
      if (!data?.roomId || !data?.userId) return;
      const meta = socketPokdeng.get(socket.id);
      if (!meta || meta.userId !== data.userId || meta.roomId !== data.roomId) return;
      leavePokdengRoom(socket.id, socket);
    });

    socket.on("pokdeng:deal", (data?: { roomId: string; userId: string }) => {
      if (!data?.roomId || !data?.userId) return;
      const room = pokdengRooms.get(data.roomId);
      if (!room) return;
      const requesterSeat = room.seats.findIndex((s) => s?.userId === data.userId);
      if (requesterSeat < 0) return;
      if (data.userId !== room.dealerUserId) {
        socket.emit("pokdeng:deal_denied");
        return;
      }
      const seated = room.seats.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
      if (seated.length === 0) return;
      const shuffled = shuffle(buildDeck());
      let k = 0;
      const hands: PokRound["hands"] = {};
      for (const seat of seated) {
        const user = room.seats[seat]!;
        const c1 = shuffled[k++]!;
        const c2 = shuffled[k++]!;
        const cards = [c1, c2];
        hands[user.userId] = {
          cards,
          revealed: false,
          canDraw: totalPoints(cards) < 8,
          drewThird: false,
        };
      }
      room.round = { startedAt: Date.now(), hands };
      pokdengBroadcast(data.roomId);
    });

    socket.on("pokdeng:reveal", (data?: { roomId: string; userId: string }) => {
      if (!data?.roomId || !data?.userId) return;
      const room = pokdengRooms.get(data.roomId);
      if (!room?.round) return;
      const hand = room.round.hands[data.userId];
      if (!hand) return;
      hand.revealed = true;
      pokdengBroadcast(data.roomId);
    });

    socket.on("pokdeng:draw", (data?: { roomId: string; userId: string }) => {
      if (!data?.roomId || !data?.userId) return;
      const room = pokdengRooms.get(data.roomId);
      if (!room?.round) return;
      const hand = room.round.hands[data.userId];
      if (!hand) return;
      if (hand.drewThird || !hand.canDraw) return;
      const card = drawAvailableThirdCard(room);
      if (!card) return;
      hand.cards.push(card);
      hand.drewThird = true;
      hand.canDraw = false;
      hand.revealed = true;
      pokdengBroadcast(data.roomId);
    });

    // ─── DJ Events ──────────────────────────────────────────────────────────────

    socket.on("dj:start", (data: { userId: string; name: string; avatar: string | null; songTitle: string; songUrl: string; position?: number }) => {
      djSession = {
        djUserId: data.userId,
        djName: data.name,
        djAvatar: data.avatar,
        songTitle: data.songTitle,
        songUrl: data.songUrl,
        startedAt: Date.now(),
        positionAtStart: data.position ?? 0,
        isPlaying: true,
        pausedAt: null,
        pausedPosition: 0,
        listenerCount: djListeners.size,
      };
      djSocketId = socket.id;
      socket.join("dj:room");
      djListeners.add(socket.id);
      io.emit("dj:state", { ...djSession, listenerCount: djListeners.size });
    });

    socket.on("dj:pause", (data: { userId: string; position: number }) => {
      if (!djSession || djSession.djUserId !== data.userId) return;
      djSession.isPlaying = false;
      djSession.pausedAt = Date.now();
      djSession.pausedPosition = data.position;
      io.emit("dj:state", { ...djSession, listenerCount: djListeners.size });
    });

    socket.on("dj:resume", (data: { userId: string; position: number }) => {
      if (!djSession || djSession.djUserId !== data.userId) return;
      djSession.isPlaying = true;
      djSession.startedAt = Date.now();
      djSession.positionAtStart = data.position;
      djSession.pausedAt = null;
      io.emit("dj:state", { ...djSession, listenerCount: djListeners.size });
    });

    socket.on("dj:stop", (data: { userId: string }) => {
      if (!djSession || djSession.djUserId !== data.userId) return;
      djSession = null;
      djSocketId = null;
      io.emit("dj:state", null);
    });

    socket.on("dj:join", () => {
      socket.join("dj:room");
      djListeners.add(socket.id);
      if (djSession) djSession.listenerCount = djListeners.size;
      // Send current state to the joining client
      socket.emit("dj:state", djSession ? { ...djSession, listenerCount: djListeners.size } : null);
      // Broadcast updated listener count
      if (djSession) io.to("dj:room").emit("dj:listeners", djListeners.size);
    });

    socket.on("dj:leave", () => {
      socket.leave("dj:room");
      djListeners.delete(socket.id);
      if (djSession) io.to("dj:room").emit("dj:listeners", djListeners.size);
    });

    socket.on("dj:chat", (data: { userId: string; name: string; avatar: string | null; message: string }) => {
      io.to("dj:room").emit("dj:chat:new", {
        userId: data.userId,
        name: data.name,
        avatar: data.avatar,
        message: data.message,
        at: Date.now(),
      });
    });

    // ─── Video Call Signaling ────────────────────────────────────────────────
    socket.on("call:request", async (data: { callerId: string; calleeId: string; callerName: string; callerAvatar: string | null; callType?: string }) => {
      const [friendship, callee] = await Promise.all([
        prisma.follow.findFirst({
          where: { followerId: data.callerId, followingId: data.calleeId, status: "accepted" },
        }),
        prisma.user.findUnique({
          where: { id: data.calleeId },
          select: { allowCalls: true },
        }),
      ]);
      if (!friendship) {
        socket.emit("call:blocked", { reason: "not_friends" });
        return;
      }
      if (!callee?.allowCalls) {
        socket.emit("call:blocked", { reason: "calls_disabled" });
        return;
      }
      const calleeSocket = [...onlineUsers.entries()].find(([, v]) => v.userId === data.calleeId);
      if (calleeSocket) io.to(calleeSocket[0]).emit("call:incoming", data);
      else socket.emit("call:unavailable");
    });

    socket.on("call:accept", (data: { callerId: string; calleeId: string }) => {
      const callerSocket = [...onlineUsers.entries()].find(([, v]) => v.userId === data.callerId);
      if (callerSocket) io.to(callerSocket[0]).emit("call:accepted", { calleeId: data.calleeId });
    });

    socket.on("call:reject", (data: { callerId: string; calleeId: string }) => {
      const callerSocket = [...onlineUsers.entries()].find(([, v]) => v.userId === data.callerId);
      if (callerSocket) io.to(callerSocket[0]).emit("call:rejected");
    });

    socket.on("call:signal", (data: { senderId: string; targetId: string; signal: unknown }) => {
      const targetSocket = [...onlineUsers.entries()].find(([, v]) => v.userId === data.targetId);
      if (targetSocket) io.to(targetSocket[0]).emit("call:signal", data);
    });

    socket.on("call:end", (data: { senderId: string; targetId: string }) => {
      const targetSocket = [...onlineUsers.entries()].find(([, v]) => v.userId === data.targetId);
      if (targetSocket) io.to(targetSocket[0]).emit("call:ended");
    });

    socket.on("disconnect", async () => {
      leavePokdengRoom(socket.id, socket);
      djListeners.delete(socket.id);
      if (djSession && socket.id === djSocketId) {
        djSession = null;
        djSocketId = null;
        io.emit("dj:state", null);
      } else if (djSession) {
        io.to("dj:room").emit("dj:listeners", djListeners.size);
      }
      const user = onlineUsers.get(socket.id);
      if (user) {
        onlineUsers.delete(socket.id);
        await prisma.user.update({
          where: { id: user.userId },
          data: { isOnline: false, lastSeen: new Date() },
        }).catch(() => {});
        io.emit("users:online", Array.from(onlineUsers.values()).map((u) => u.userId));
      }
    });
  });

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
