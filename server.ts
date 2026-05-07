import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { prisma } from "./src/lib/prisma";

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

    socket.on("message:send", async (data: { senderId: string; receiverId: string; content: string; type?: string; mediaUrl?: string }) => {
      const message = await prisma.message.create({
        data: {
          content: data.content,
          type: data.type ?? "text",
          mediaUrl: data.mediaUrl ?? null,
          senderId: data.senderId,
          receiverId: data.receiverId,
        },
        include: { sender: { select: { id: true, username: true, nickname: true, avatar: true } } },
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
        include: { user: { select: { id: true, username: true, nickname: true, avatar: true } } },
      });
      io.to(`room:${data.roomId}`).emit("room:message:new", message);
    });

    socket.on("disconnect", async () => {
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
