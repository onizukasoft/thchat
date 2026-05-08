export type Frame = {
  id: string;
  name: string;
  image: string;     // path to SVG overlay image
  minVip: string;    // "bronze"|"silver"|"gold"|"diamond"
};

export const FRAMES: Frame[] = [
  { id: "f01", name: "ดอกไม้ทอง",      image: "/frames/f01.svg", minVip: "bronze" },
  { id: "f02", name: "หัวใจชมพู",       image: "/frames/f02.svg", minVip: "bronze" },
  { id: "f03", name: "อัญมณีน้ำเงิน",   image: "/frames/f03.svg", minVip: "silver" },
  { id: "f04", name: "ดาวม่วง",         image: "/frames/f04.svg", minVip: "silver" },
  { id: "f05", name: "เกล็ดหิมะ",       image: "/frames/f05.svg", minVip: "silver" },
  { id: "f06", name: "เปลวไฟ",          image: "/frames/f06.svg", minVip: "gold" },
  { id: "f07", name: "กาแล็กซี่",        image: "/frames/f07.svg", minVip: "gold" },
  { id: "f08", name: "ธรรมชาติ",        image: "/frames/f08.svg", minVip: "bronze" },
  { id: "f09", name: "คริสตัล",         image: "/frames/f09.svg", minVip: "gold" },
  { id: "f10", name: "ซากุระ",          image: "/frames/f10.svg", minVip: "silver" },
  { id: "f11", name: "นีออนเขียว",      image: "/frames/f11.svg", minVip: "gold" },
  { id: "f12", name: "สายรุ้ง",         image: "/frames/f12.svg", minVip: "silver" },
  { id: "f13", name: "คริสต์มาส",       image: "/frames/f13.svg", minVip: "bronze" },
  { id: "f14", name: "นีออนน้ำเงิน",    image: "/frames/f14.svg", minVip: "gold" },
  { id: "f15", name: "มงกุฎทอง",        image: "/frames/f15.svg", minVip: "diamond" },
  { id: "f16", name: "คลื่นทะเล",       image: "/frames/f16.svg", minVip: "silver" },
  { id: "f17", name: "ทานตะวัน",        image: "/frames/f17.svg", minVip: "bronze" },
  { id: "f18", name: "บับเบิ้ลน่ารัก",  image: "/frames/f18.svg", minVip: "bronze" },
  { id: "f19", name: "เงินหรู",          image: "/frames/f19.svg", minVip: "gold" },
  { id: "f20", name: "นีออนชมพู",       image: "/frames/f20.svg", minVip: "gold" },
];

export const VIP_ORDER = ["bronze", "silver", "gold", "diamond"];

export function canUseFrame(frame: Frame, vipLevel: string | null): boolean {
  if (!vipLevel) return false;
  return VIP_ORDER.indexOf(vipLevel) >= VIP_ORDER.indexOf(frame.minVip);
}

export function getFrame(id: string | null | undefined): Frame | null {
  if (!id) return null;
  const found = FRAMES.find((f) => f.id === id);
  if (found) return found;
  // รองรับ fXX ทุก ID ที่ packages page ใช้ (เช่น f21–f30)
  if (/^f\d+$/.test(id)) {
    return { id, name: id, image: `/frames/${id}.svg`, minVip: "bronze" };
  }
  return null;
}
