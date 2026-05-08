"use client";
import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Gift, Heart, Coins, Loader2 } from "lucide-react";
import { GiftThumb } from "@/components/gift-thumb";
import type { HeartRedeemOffer } from "@/lib/heart-redeem";

type GiftItem = {
  id: string;
  giftType: string;
  coins: number;
  message: string | null;
  createdAt: string;
  sender: { id: string; username: string; nickname: string | null; avatar: string | null };
};

type GiftsPayload = {
  gifts: GiftItem[];
  heartsReceivedTotal: number;
  profileHeartsSpent: number;
  heartsAvailable: number;
  coins: number;
  voteTotalScore: number;
  redeemOffers: HeartRedeemOffer[];
};

export default function GiftsPage() {
  const [payload, setPayload] = useState<GiftsPayload | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemMsg, setRedeemMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(() => {
    fetch("/api/gifts")
      .then((r) => {
        if (r.status === 401) {
          setUnauthorized(true);
          return null;
        }
        return r.json();
      })
      .then((d: GiftsPayload | null) => {
        if (!d || !Array.isArray(d.gifts)) return;
        setPayload({
          gifts: d.gifts,
          heartsReceivedTotal: d.heartsReceivedTotal ?? 0,
          profileHeartsSpent: d.profileHeartsSpent ?? 0,
          heartsAvailable: d.heartsAvailable ?? Math.max(0, (d.heartsReceivedTotal ?? 0) - (d.profileHeartsSpent ?? 0)),
          coins: d.coins ?? 0,
          voteTotalScore: d.voteTotalScore ?? 0,
          redeemOffers: Array.isArray(d.redeemOffers) ? d.redeemOffers : [],
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function redeem(offerId: string) {
    setRedeemMsg(null);
    setRedeemingId(offerId);
    try {
      const r = await fetch("/api/gifts/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const data = await r.json();
      if (!r.ok) {
        setRedeemMsg({ type: "err", text: data.error ?? "แลกไม่สำเร็จ" });
        return;
      }
      setRedeemMsg({ type: "ok", text: "แลกสำเร็จแล้ว" });
      load();
    } catch {
      setRedeemMsg({ type: "err", text: "เครือข่ายผิดพลาด" });
    } finally {
      setRedeemingId(null);
    }
  }

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-lg px-2 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        กรุณาเข้าสู่ระบบเพื่อดูของขวัญของคุณ
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="mx-auto max-w-lg space-y-4 animate-pulse px-2 py-8">
        <div className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const { gifts, heartsReceivedTotal, profileHeartsSpent, heartsAvailable, coins, voteTotalScore, redeemOffers } = payload;

  return (
    <div className="mx-auto max-w-lg space-y-5 px-2 pb-10">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">ของขวัญของคุณ</h1>
      </div>

      {/* Balance strip */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Coins className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">เหรียญ</p>
            <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{coins.toLocaleString()}</p>
          </div>
        </div>
        <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-2 text-right">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-gray-400">หัวใจพร้อมแลก</p>
            <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{heartsAvailable.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">
              ได้รับ {heartsReceivedTotal.toLocaleString()} · ใช้แลกแล้ว {profileHeartsSpent.toLocaleString()}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Heart className="h-4 w-4 fill-amber-400 text-amber-400" />
          </span>
        </div>
      </div>

      {/* กติกา */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
        <p className="flex items-start gap-2 font-medium text-gray-900 dark:text-white">
          <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
          <span>แลกรางวัลจากหัวใจโปรไฟล์</span>
        </p>
        <p className="mt-2 pl-6 text-xs text-gray-600 dark:text-gray-400">
          ใช้เฉพาะ<b className="font-semibold text-gray-800 dark:text-gray-200">หัวใจที่ได้จากคนกดให้ที่หน้าโปรไฟล์</b>
          เท่านั้น — ไม่หักเหรียญ และไม่เกี่ยวกับของขวัญจากเหรียญด้านล่าง
        </p>
        <p className="mt-2 pl-6 text-xs text-gray-500">
          คะแนนโหวตสะสมโปรไฟล์ (จากหัวใจ + โบนัสแลก):{" "}
          <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-200">{voteTotalScore.toLocaleString()}</span>
        </p>
      </div>

      {/* แลกของขวัญ */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">แลกจากหัวใจโปรไฟล์</h2>
        {redeemMsg && (
          <p
            className={`mb-3 rounded-xl px-3 py-2 text-xs font-medium ${
              redeemMsg.type === "ok"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {redeemMsg.text}
          </p>
        )}
        <div className="space-y-3">
          {redeemOffers.map((offer) => {
            const canAfford = heartsAvailable >= offer.costHearts;
            const busy = redeemingId === offer.id;
            const voteEqual = offer.voteMonthBonus > 0 && offer.voteMonthBonus === offer.voteTotalBonus;

            return (
              <div
                key={offer.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{offer.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{offer.subtitle}</p>
                    <ul className="mt-2 space-y-0.5 text-xs text-gray-700 dark:text-gray-300">
                      {offer.coinsReward > 0 && (
                        <li>• เหรียญ +{offer.coinsReward.toLocaleString()}</li>
                      )}
                      {(offer.voteMonthBonus > 0 || offer.voteTotalBonus > 0) && (
                        <li>
                          • คะแนนโหวต +
                          {voteEqual
                            ? offer.voteMonthBonus.toLocaleString()
                            : `${offer.voteMonthBonus.toLocaleString()} เดือนนี้ / ${offer.voteTotalBonus.toLocaleString()} สะสม`}
                          {voteEqual ? " (เดือนนี้และสะสม)" : ""}
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">ใช้หัวใจ</p>
                    <p className="text-lg font-bold tabular-nums text-pink-600 dark:text-pink-400">{offer.costHearts.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canAfford || busy}
                  onClick={() => redeem(offer.id)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {canAfford ? "แลกเลย" : "หัวใจไม่พอ"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ของขวัญจากเหรียญ */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">ของขวัญจากเหรียญที่ผู้อื่นส่งให้</h2>
        <span className="text-xs text-gray-400">{gifts.length} ชิ้น</span>
      </div>

      {gifts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 text-5xl">🎁</div>
          <p className="text-sm text-gray-600 dark:text-gray-400">ยังไม่มีของขวัญจากเหรียญ</p>
          <p className="mx-auto mt-2 max-w-xs px-4 text-xs leading-relaxed text-gray-400">
            ของในรายการนี้มาจากเมื่อมีคนซื้อของขวัญด้วยเหรียญและส่งให้คุณ — แยกจากการแลกด้วยหัวใจโปรไฟล์ด้านบน
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gifts.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <GiftThumb giftType={g.giftType} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={g.sender.avatar || ""} />
                    <AvatarFallback className="bg-gray-100 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {(g.sender.nickname || g.sender.username)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {g.sender.nickname || g.sender.username}
                  </span>
                </div>
                {g.message && (
                  <p className="mt-1 text-xs italic text-gray-600 dark:text-gray-400">&quot;{g.message}&quot;</p>
                )}
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(g.createdAt), { addSuffix: true, locale: th })}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold tabular-nums text-gray-800 dark:text-gray-200">
                  +{Math.floor(g.coins * 0.7)} 🪙
                </p>
                <p className="text-[10px] text-gray-400">เหรียญที่ได้รับ</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
