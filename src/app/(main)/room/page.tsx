"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Hash, Users, MessageSquare, Plus } from "lucide-react";

type Room = {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number; messages: number };
};

export default function RoomListPage() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "" });

  useEffect(() => {
    fetch("/api/rooms").then((r) => r.json()).then(setRooms);
  }, []);

  async function createRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRoom),
    });
    const room = await res.json();
    setRooms((prev) => [...prev, { ...room, _count: { members: 0, messages: 0 } }]);
    setCreating(false);
    setNewRoom({ name: "", description: "" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Hash className="w-5 h-5 text-purple-600" />
          ห้องแชท
        </h1>
        {session?.user?.id && (
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-1" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" />
            สร้างห้อง
          </Button>
        )}
      </div>

      {creating && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={createRoom} className="space-y-3">
              <Input
                placeholder="ชื่อห้อง *"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                required
              />
              <Input
                placeholder="คำอธิบาย (ไม่บังคับ)"
                value={newRoom.description}
                onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">สร้าง</Button>
                <Button type="button" variant="outline" onClick={() => setCreating(false)}>ยกเลิก</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {rooms.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีห้องแชท</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Link key={room.id} href={`/room/${room.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-500" />
                    {room.name}
                  </CardTitle>
                  {room.description && (
                    <p className="text-sm text-gray-500">{room.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {room._count.members}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {room._count.messages}
                    </span>
                    <Badge variant="outline" className="text-xs border-green-400 text-green-600">สาธารณะ</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
