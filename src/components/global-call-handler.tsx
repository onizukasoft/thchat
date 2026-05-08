"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket-client";
import { UserAvatar } from "@/components/user-avatar";
import { Phone, PhoneOff, Video } from "lucide-react";
import { setPendingAccept } from "@/lib/pending-call";

type CallType = "video" | "audio";

type IncomingCallData = {
  callerId: string;
  callerName: string;
  callerAvatar: string | null;
  calleeId: string;
  callType?: CallType;
};

export function GlobalCallHandler() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [incoming, setIncoming] = useState<IncomingCallData | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const socket = getSocket();

    const onIncoming = (data: IncomingCallData) => {
      // VideoCall component on the chat page handles it directly
      if (pathname === `/chat/${data.callerId}`) return;
      setIncoming(data);
    };

    const onEnded = () => setIncoming(null);

    socket.on("call:incoming", onIncoming);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:ended", onEnded);
    };
  }, [session?.user?.id, pathname]);

  function accept() {
    if (!incoming || !session?.user?.id) return;
    setPendingAccept(incoming.callerId);
    setIncoming(null);
    router.push(`/chat/${incoming.callerId}`);
  }

  function reject() {
    if (!incoming || !session?.user?.id) return;
    getSocket().emit("call:reject", { callerId: incoming.callerId, calleeId: session.user.id });
    getSocket().emit("message:send", {
      senderId: session.user.id,
      receiverId: incoming.callerId,
      content: "rejected:ปฏิเสธการโทร",
      type: "call",
    });
    setIncoming(null);
  }

  if (!incoming) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl w-72">
        <div className="relative">
          <UserAvatar
            src={incoming.callerAvatar}
            fallback={incoming.callerName[0] ?? "?"}
            className="w-20 h-20"
          />
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 animate-pulse flex items-center justify-center">
            {incoming.callType === "audio"
              ? <Phone className="w-3 h-3 text-white" />
              : <Video className="w-3 h-3 text-white" />}
          </span>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold dark:text-white">{incoming.callerName}</p>
          <p className="text-sm text-gray-500">
          {incoming.callType === "audio" ? "กำลังโทรหาคุณ..." : "กำลังโทรวิดีโอหาคุณ..."}
        </p>
        </div>
        <div className="flex gap-10">
          <button
            onClick={reject}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
            title="ปฏิเสธ"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={accept}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors"
            title="รับสาย"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
