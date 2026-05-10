"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

const CATEGORIES: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก ❤️",
  joke: "ขำขัน 😄",
  news: "ข่าวสาร 📰",
  question: "ถามตอบ ❓",
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; nickname: string | null; avatar: string | null };
};

type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  createdAt: string;
  user: { id: string; username: string; nickname: string | null; avatar: string | null };
  comments: Comment[];
};

export default function PostPage() {
  const { data: session } = useSession();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}`);
    const data = await res.json();
    setPost(data);
  }, [postId]);

  useEffect(() => {
    fetchPost();
    // Count view once per session per post
    const key = `viewed_post_${postId}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      fetch(`/api/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "view" }),
      }).catch(() => {});
    }
  }, [fetchPost, postId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !session?.user?.id) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    const newComment = await res.json();
    setPost((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev);
    setComment("");
    setSubmitting(false);
  }

  if (!post) return <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href="/board" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft className="w-4 h-4" />
        กลับกระดาน
      </Link>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Link href={`/profile/${post.user.id}`}>
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={post.user.avatar || ""} />
                <AvatarFallback className="bg-purple-100 text-purple-700">
                  {(post.user.nickname || post.user.username)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Link href={`/profile/${post.user.id}`} className="font-semibold hover:underline text-sm">
                  {post.user.nickname || post.user.username}
                </Link>
                <Badge variant="outline" className="text-xs">{CATEGORIES[post.category] || post.category}</Badge>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h1>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
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
                  {post.comments.length} ความคิดเห็น
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700">ความคิดเห็น ({post.comments.length})</h2>

        {session?.user?.id && (
          <form onSubmit={submitComment} className="space-y-2">
            <Textarea
              placeholder="เขียนความคิดเห็น..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700" disabled={!comment.trim() || submitting}>
              ส่งความคิดเห็น
            </Button>
          </form>
        )}
        {!session?.user?.id && (
          <p className="text-sm text-gray-500">
            <Link href="/login" className="text-purple-600 hover:underline">เข้าสู่ระบบ</Link> เพื่อแสดงความคิดเห็น
          </p>
        )}

        {post.comments.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-start gap-3">
                <Link href={`/profile/${c.user.id}`}>
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={c.user.avatar || ""} />
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                      {(c.user.nickname || c.user.username)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${c.user.id}`} className="text-sm font-semibold hover:underline">
                      {c.user.nickname || c.user.username}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: th })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
