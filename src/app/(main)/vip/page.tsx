"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Crown, Check, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VIP_PACKAGES } from "@/lib/packages";

export default function VIPPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function buyVip(packageId: string) {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }
    setLoading(packageId);
    try {
      const res = await fetch("/api/vip/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        <h1 className="text-2xl font-bold">ซื้อแพ็กเกจ VIP</h1>
        <p className="text-gray-500 text-sm mt-1">ปลดล็อคฟีเจอร์พิเศษและสิทธิพิเศษสุดคุ้ม</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {VIP_PACKAGES.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl border-2 overflow-hidden ${
              plan.popular ? "border-yellow-400 shadow-lg shadow-yellow-100" : "border-gray-200"
            }`}
          >
            {plan.popular && (
              <div className="bg-yellow-400 text-white text-xs font-bold text-center py-1">
                ⭐ ยอดนิยม
              </div>
            )}
            <div className={`bg-gradient-to-br ${plan.color} p-5 text-white text-center`}>
              <div className="text-3xl mb-1">{plan.icon}</div>
              <div className="font-bold text-lg">{plan.name}</div>
              <div className="text-2xl font-bold mt-2">
                ฿{(plan.price / 100).toLocaleString("th-TH")}
              </div>
              <div className="text-xs opacity-80">/ {plan.days} วัน</div>
            </div>
            <div className="p-4 space-y-2">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </div>
              ))}
              <Button
                className={`w-full mt-3 bg-gradient-to-r ${plan.color} text-white border-0 hover:opacity-90`}
                onClick={() => buyVip(plan.id)}
                disabled={loading !== null}
              >
                {loading === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "ซื้อเลย"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl border p-4 flex items-start gap-3 text-sm text-gray-500">
        <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-700">ชำระเงินปลอดภัยผ่าน Stripe</p>
          <p className="text-xs mt-0.5">VIP เริ่มต้นทันทีหลังชำระเงิน · เหรียญเข้าบัญชีภายใน 1–2 นาที · ต่ออายุได้ (ระยะเวลาต่อจากวันหมดอายุเดิม)</p>
        </div>
      </div>
    </div>
  );
}
