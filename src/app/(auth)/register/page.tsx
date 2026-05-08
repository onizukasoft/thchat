"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        email,
        password,
        nickname: form.get("nickname"),
        gender: form.get("gender"),
        age: form.get("age") ? Number(form.get("age")) : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "เกิดข้อผิดพลาด");
      setLoading(false);
      return;
    }

    // Auto login then go to avatar setup
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/register/avatar?uid=${data.id}`,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ThChat" className="w-24 h-24 object-contain mx-auto mb-2" />
          <CardTitle className="text-2xl font-bold text-purple-700">สมัครสมาชิก ThChat</CardTitle>
          <p className="text-gray-500 text-sm">เข้าร่วมชุมชนของเรา</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username">ชื่อผู้ใช้ *</Label>
              <Input id="username" name="username" placeholder="username" required minLength={3} maxLength={20} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nickname">ชื่อที่แสดง</Label>
              <Input id="nickname" name="nickname" placeholder="ชื่อเล่น" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">อีเมล *</Label>
              <Input id="email" name="email" type="email" placeholder="your@email.com" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">รหัสผ่าน *</Label>
              <Input id="password" name="password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gender">เพศ</Label>
                <select id="gender" name="gender" className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  <option value="other">ไม่ระบุ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="age">อายุ</Label>
                <Input id="age" name="age" type="number" placeholder="อายุ" min={13} max={100} />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 mt-2" disabled={loading}>
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            มีบัญชีแล้ว?{" "}
            <Link href="/login" className="text-purple-600 hover:underline font-medium">
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
