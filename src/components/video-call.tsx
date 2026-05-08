"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket-client";
import { UserAvatar } from "@/components/user-avatar";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { consumePendingAccept } from "@/lib/pending-call";

type CallState = "idle" | "calling" | "incoming" | "active";
type CallType = "video" | "audio";

interface VideoCallProps {
  myId: string;
  myName: string;
  myAvatar: string | null;
  otherUser: { id: string; username: string; nickname: string | null; avatar: string | null };
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function VideoCall({ myId, myName, myAvatar, otherUser }: VideoCallProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("video");
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callStateRef = useRef<CallState>("idle");
  const callTypeRef = useRef<CallType>("video");
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

  const otherName = otherUser.nickname || otherUser.username;

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { callTypeRef.current = callType; }, [callType]);

  useEffect(() => {
    if (callState === "active") {
      if (callTypeRef.current === "video") {
        if (localVideoRef.current && localStreamRef.current)
          localVideoRef.current.srcObject = localStreamRef.current;
        if (remoteVideoRef.current && remoteStreamRef.current)
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
      } else {
        if (remoteAudioRef.current && remoteStreamRef.current)
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }
    }
  }, [callState]);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    iceCandidateQueue.current = [];
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setRemoteConnected(false);
    setIsMuted(false);
    setIsCamOff(false);
  }, []);

  async function getMedia(type: CallType) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === "video",
      audio: true,
    });
    localStreamRef.current = stream;
    if (type === "video" && localVideoRef.current)
      localVideoRef.current.srcObject = stream;
    return stream;
  }

  function sendCallMsg(content: string) {
    getSocket().emit("message:send", { senderId: myId, receiverId: otherUser.id, content, type: "call" });
  }

  function createPeer(targetId: string) {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    iceCandidateQueue.current = [];

    localStreamRef.current!.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    pc.ontrack = (e) => {
      const tracks = e.streams?.[0]?.getTracks() ?? [e.track];
      tracks.forEach((t) => {
        if (!remoteStream.getTrackById(t.id)) remoteStream.addTrack(t);
      });
      if (callTypeRef.current === "video") {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(() => {});
        }
      } else {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(() => {});
        }
      }
      setRemoteConnected(true);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        getSocket().emit("call:signal", {
          senderId: myId, targetId,
          signal: { type: "ice", candidate: e.candidate.toJSON() },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setRemoteConnected(true);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        getSocket().emit("call:end", { senderId: myId, targetId });
        cleanup();
        setCallState("idle");
      }
    };

    return pc;
  }

  async function drainIceCandidateQueue() {
    const pc = pcRef.current;
    if (!pc || pc.remoteDescription === null) return;
    for (const c of iceCandidateQueue.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    }
    iceCandidateQueue.current = [];
  }

  function startCall(type: CallType) {
    setCallType(type);
    callTypeRef.current = type;
    setCallState("calling");
    getSocket().emit("call:request", {
      callerId: myId, calleeId: otherUser.id,
      callerName: myName, callerAvatar: myAvatar,
      callType: type,
    });
  }

  const acceptCall = useCallback(async () => {
    setCallState("active");
    const type = callTypeRef.current;
    try {
      await getMedia(type);
    } catch {
      getSocket().emit("call:reject", { callerId: otherUser.id, calleeId: myId });
      setCallState("idle");
      return;
    }
    getSocket().emit("call:accept", { callerId: otherUser.id, calleeId: myId });
  }, [myId, otherUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function rejectCall() {
    getSocket().emit("call:reject", { callerId: otherUser.id, calleeId: myId });
    sendCallMsg("rejected:ปฏิเสธการโทร");
    setCallState("idle");
  }

  function endCall() {
    const state = callStateRef.current;
    const type = callTypeRef.current;
    getSocket().emit("call:end", { senderId: myId, targetId: otherUser.id });
    if (state === "active")
      sendCallMsg(type === "audio" ? "ended:สิ้นสุดการโทร" : "ended:สิ้นสุดการโทรวิดีโอ");
    else if (state === "calling")
      sendCallMsg(type === "audio" ? "missed:โทรที่ไม่ได้รับ" : "missed:โทรวิดีโอที่ไม่ได้รับ");
    cleanup();
    setCallState("idle");
  }

  function toggleMute() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
    setIsMuted(!isMuted);
  }

  function toggleCamera() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = isCamOff; });
    setIsCamOff(!isCamOff);
  }

  useEffect(() => {
    const pending = consumePendingAccept();
    if (pending === otherUser.id) acceptCall();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const socket = getSocket();

    const onIncoming = (data: { callerId: string; callType?: CallType }) => {
      if (data.callerId !== otherUser.id) return;
      const type = data.callType ?? "video";
      setCallType(type);
      callTypeRef.current = type;
      setCallState("incoming");
    };

    const onAccepted = async () => {
      setCallState("active");
      const type = callTypeRef.current;
      try {
        await getMedia(type);
        const pc = createPeer(otherUser.id);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === "video",
        });
        await pc.setLocalDescription(offer);
        socket.emit("call:signal", {
          senderId: myId, targetId: otherUser.id,
          signal: { type: "offer", sdp: offer.sdp },
        });
      } catch (err) {
        console.error("call setup error", err);
        endCall();
      }
    };

    const onRejected = () => { cleanup(); setCallState("idle"); };

    const onSignal = async (data: {
      senderId: string;
      signal: { type: string; sdp?: string; candidate?: RTCIceCandidateInit };
    }) => {
      if (data.senderId !== otherUser.id) return;
      const { signal } = data;

      if (signal.type === "offer") {
        const pc = createPeer(otherUser.id);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: signal.sdp! }));
        await drainIceCandidateQueue();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:signal", {
          senderId: myId, targetId: otherUser.id,
          signal: { type: "answer", sdp: answer.sdp },
        });
      } else if (signal.type === "answer" && pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: signal.sdp! })
        );
        await drainIceCandidateQueue();
      } else if (signal.type === "ice" && signal.candidate) {
        const pc = pcRef.current;
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
        } else {
          iceCandidateQueue.current.push(signal.candidate);
        }
      }
    };

    const onEnded = () => { cleanup(); setCallState("idle"); };

    const onUnavailable = () => {
      const type = callTypeRef.current;
      sendCallMsg(type === "audio" ? "offline:โทรไม่ถึง (ออฟไลน์)" : "offline:โทรวิดีโอไม่ถึง (ออฟไลน์)");
      cleanup();
      setCallState("idle");
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:signal", onSignal);
    socket.on("call:ended", onEnded);
    socket.on("call:unavailable", onUnavailable);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:signal", onSignal);
      socket.off("call:ended", onEnded);
      socket.off("call:unavailable", onUnavailable);
    };
  }, [myId, otherUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (pcRef.current || localStreamRef.current) {
        getSocket().emit("call:end", { senderId: myId, targetId: otherUser.id });
        cleanup();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* ─── Call buttons in header ─── */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => startCall("audio")}
          disabled={callState !== "idle"}
          title="โทรเสียง"
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-30"
        >
          <Phone className="w-4.5 h-4.5" />
        </button>
        <button
          type="button"
          onClick={() => startCall("video")}
          disabled={callState !== "idle"}
          title="โทรวิดีโอ"
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-30"
        >
          <Video className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* ─── Hidden audio element (audio call) ─── */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* ─── Incoming call ─── */}
      {callState === "incoming" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl w-72">
            <div className="relative">
              <UserAvatar src={otherUser.avatar} fallback={otherName[0]} className="w-20 h-20" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold dark:text-white">{otherName}</p>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                {callType === "audio"
                  ? <><Phone className="w-3.5 h-3.5" /> กำลังโทรหาคุณ...</>
                  : <><Video className="w-3.5 h-3.5" /> กำลังโทรวิดีโอหาคุณ...</>
                }
              </p>
            </div>
            <div className="flex gap-10">
              <button onClick={rejectCall} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors">
                <PhoneOff className="w-6 h-6" />
              </button>
              <button onClick={acceptCall} className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors">
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Calling (outgoing) ─── */}
      {callState === "calling" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl w-72">
            <UserAvatar src={otherUser.avatar} fallback={otherName[0]} className="w-20 h-20" />
            <div className="text-center">
              <p className="text-lg font-bold dark:text-white">{otherName}</p>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5 animate-pulse">
                {callType === "audio"
                  ? <><Phone className="w-3.5 h-3.5" /> กำลังโทร...</>
                  : <><Video className="w-3.5 h-3.5" /> กำลังโทรวิดีโอ...</>
                }
              </p>
            </div>
            <button onClick={endCall} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors">
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Active: VIDEO call ─── */}
      {callState === "active" && callType === "video" && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video ref={remoteVideoRef} autoPlay playsInline className="flex-1 w-full object-cover" />
          {!remoteConnected && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white/70">
                <UserAvatar src={otherUser.avatar} fallback={otherName[0]} className="w-20 h-20 mx-auto mb-3 opacity-60" />
                <p className="text-sm animate-pulse">กำลังเชื่อมต่อ...</p>
              </div>
            </div>
          )}
          <div className="absolute top-4 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 bg-gray-900 shadow-xl">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {isCamOff && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-6">
            <button onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${isMuted ? "bg-gray-600" : "bg-white/20 hover:bg-white/30"}`}>
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg">
              <PhoneOff className="w-7 h-7" />
            </button>
            <button onClick={toggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${isCamOff ? "bg-gray-600" : "bg-white/20 hover:bg-white/30"}`}>
              {isCamOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}

      {/* ─── Active: AUDIO call ─── */}
      {callState === "active" && callType === "audio" && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col items-center justify-between py-16">
          {/* Top: avatar + name */}
          <div className="flex flex-col items-center gap-5">
            <div className="relative">
              {/* Pulse rings */}
              <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: "1.5s" }} />
              <span className="absolute -inset-3 rounded-full bg-green-500/10 animate-ping" style={{ animationDuration: "2s" }} />
              <UserAvatar src={otherUser.avatar} fallback={otherName[0]} className="w-28 h-28 relative z-10 ring-4 ring-white/10" />
            </div>
            <div className="text-center mt-2">
              <p className="text-2xl font-bold text-white">{otherName}</p>
              <p className="text-sm text-gray-400 mt-1">
                {remoteConnected ? "กำลังคุย..." : "กำลังเชื่อมต่อ..."}
              </p>
            </div>
          </div>

          {/* Bottom: controls */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <button onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${isMuted ? "bg-gray-600" : "bg-white/15 hover:bg-white/25"}`}>
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <span className="text-xs text-gray-400">{isMuted ? "เปิดไมค์" : "ปิดไมค์"}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg">
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs text-gray-400">วางสาย</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
