/** รายการแลกจากหัวใจโปรไฟล์ (ไม่ใช้เหรียญ) */
export type HeartRedeemOffer = {
  id: string;
  title: string;
  subtitle: string;
  costHearts: number;
  coinsReward: number;
  voteMonthBonus: number;
  voteTotalBonus: number;
};

export const HEART_REDEEM_OFFERS: HeartRedeemOffer[] = [
  {
    id: "hearts_coins_s",
    title: "แลกเหรียญ",
    subtitle: "เหมาะสำหรับเริ่มต้น",
    costHearts: 100,
    coinsReward: 80,
    voteMonthBonus: 0,
    voteTotalBonus: 0,
  },
  {
    id: "hearts_vote_m",
    title: "แลกคะแนนโหวต",
    subtitle: "+200 คะแนนโหวตเดือนนี้และสะสมรวม",
    costHearts: 500,
    coinsReward: 0,
    voteMonthBonus: 200,
    voteTotalBonus: 200,
  },
  {
    id: "hearts_combo_l",
    title: "แพ็กซุปตาร์",
    subtitle: "เหรียญ + คะแนนโหวต",
    costHearts: 27000,
    coinsReward: 5000,
    voteMonthBonus: 800,
    voteTotalBonus: 800,
  },
];

export function getHeartRedeemOffer(id: string): HeartRedeemOffer | undefined {
  return HEART_REDEEM_OFFERS.find((o) => o.id === id);
}
