"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, Plus, MessageSquare, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  createdAt: string;
  user: { id: string; username: string; nickname: string | null; avatar: string | null };
  _count: { comments: number };
};

const CATEGORIES = [
  { value: "general", label: "ทั่วไป" },
  { value: "love", label: "ความรัก ❤️" },
  { value: "joke", label: "ขำขัน 😄" },
  { value: "news", label: "ข่าวสาร 📰" },
  { value: "question", label: "ถามตอบ ❓" },
];

export default function BoardPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [creating, setCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [form, setForm] = useState({ title: "", content: "", category: "general" });

  useEffect(() => {
    const url = activeCategory !== "all" ? `/api/posts?category=${activeCategory}` : "/api/posts";
    fetch(url).then((r) => r.json()).then(setPosts);
  }, [activeCategory]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const post = await res.json();
    setPosts((prev) => [post, ...prev]);
    setCreating(false);
    setForm({ title: "", content: "", category: "general" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-purple-600" />
          กระดาน
        </h1>
        {session?.user?.id && (
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-1" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4" />
            โพสต์ใหม่
          </Button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCategory === "all" ? "bg-purple-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
          }`}
        >
          ทั้งหมด
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.value ? "bg-purple-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Create post form */}
      {creating && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={createPost} className="space-y-3">
              <Input
                placeholder="หัวข้อ *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="เนื้อหา *"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                required
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">โพสต์</Button>
                <Button type="button" variant="outline" onClick={() => setCreating(false)}>ยกเลิก</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีโพสต์</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/board/${post.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="w-9 h-9 shrink-0 mt-0.5">
                        <AvatarImage src={post.user.avatar || ""} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                          {(post.user.nickname || post.user.username)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIES.find((c) => c.value === post.category)?.label || post.category}
                          </Badge>
                        </div>
                        <h2 className="font-semibold text-gray-900 truncate">{post.title}</h2>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{post.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="font-medium text-gray-600">{post.user.nickname || post.user.username}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: th })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post._count.comments}
                          </span>
                        </div>
                      </div>
                    </div>
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
