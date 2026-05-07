"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Smartphone } from "lucide-react";

type Step = { title: string; desc: string; img?: string };

const IOS_STEPS: Step[] = [
  {
    title: "1. เปิด Safari และไปที่ thchat.com",
    desc: "ต้องใช้ Safari เท่านั้น (Chrome และ Firefox บน iOS ไม่รองรับการติดตั้ง)",
    img: "safari",
  },
  {
    title: "2. กดปุ่ม Share (กล่องมีลูกศรขึ้น)",
    desc: "อยู่ที่แถบด้านล่างของ Safari ตรงกลาง",
    img: "share",
  },
  {
    title: '3. เลื่อนลงและกด "Add to Home Screen"',
    desc: 'หรือ "เพิ่มไปยังหน้าจอโฮม" ในภาษาไทย',
    img: "add",
  },
  {
    title: '4. กด "Add" มุมขวาบน',
    desc: "แอป ThChat จะปรากฏบนหน้าจอโฮมของคุณ",
    img: "confirm",
  },
];

const ANDROID_STEPS: Step[] = [
  {
    title: "1. เปิด Chrome และไปที่ thchat.com",
    desc: "รองรับ Chrome, Edge และ Samsung Internet",
    img: "chrome",
  },
  {
    title: "2. กดเมนู ⋮ มุมขวาบน",
    desc: "จุดสามจุดแนวตั้งด้านบนขวาของ Chrome",
    img: "menu",
  },
  {
    title: '3. กด "Add to Home screen" หรือ "ติดตั้งแอป"',
    desc: "หากมีแบนเนอร์ขึ้นด้านล่าง กดได้เลยโดยไม่ต้องเข้าเมนู",
    img: "install",
  },
  {
    title: '4. กด "Install" หรือ "ติดตั้ง"',
    desc: "แอป ThChat จะติดตั้งและปรากฏในหน้าจอโฮมทันที",
    img: "confirm",
  },
];

const STEP_ICONS: Record<string, string> = {
  safari: "🧭",
  share: "⬆️",
  add: "📌",
  confirm: "✅",
  chrome: "🌐",
  menu: "⋮",
  install: "📲",
};

function StepCard({ step }: { step: Step }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl shrink-0">
          {step.img ? STEP_ICONS[step.img] ?? "📱" : "📱"}
        </div>
        <div>
          <p className="font-semibold text-sm">{step.title}</p>
          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
        </div>
      </div>
    </div>
  );
}

function AccordionSection({
  icon, title, steps, defaultOpen = false,
}: {
  icon: React.ReactNode; title: string; steps: Step[]; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xl">{icon}</span>
        <span className="flex-1 text-left font-semibold">{title}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
          {steps.map((s, i) => <StepCard key={i} step={s} />)}
        </div>
      )}
    </div>
  );
}

export default function InstallPage() {
  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">แอพซอยแชท</h1>
        </div>
      </div>

      {/* App icon preview */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 flex items-center gap-5 text-white shadow-md">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-bold text-4xl shadow-inner shrink-0">
          T
        </div>
        <div>
          <p className="text-xl font-bold">ThChat</p>
          <p className="text-blue-100 text-sm mt-1">แชทหาเพื่อน ใกล้บ้านคุณ</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">ฟรี</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">ไม่มีโฆษณา</span>
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">ออฟไลน์ได้</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 leading-relaxed">
        คุณสามารถติดตั้ง ThChat ได้เหมือนแอปทั่วไป คุณจะได้รับการแจ้งเตือนบนหน้าจอเมื่อมีข้อความส่งถึงคุณ ไม่ต้องโหลดจาก App Store หรือ Play Store
      </div>

      {/* Android */}
      <AccordionSection
        icon={<span>🤖</span>}
        title="ติดตั้ง ThChat แอปบน Android"
        steps={ANDROID_STEPS}
        defaultOpen={false}
      />

      {/* iOS */}
      <AccordionSection
        icon={<span>🍎</span>}
        title="ติดตั้ง ThChat แอปบน iOS"
        steps={IOS_STEPS}
        defaultOpen={true}
      />

      {/* Features */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <p className="font-semibold text-sm text-gray-700">ข้อดีของการติดตั้งแอป</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: "🔔", text: "รับการแจ้งเตือนทันที" },
            { icon: "⚡", text: "เปิดได้เร็วขึ้น" },
            { icon: "📴", text: "ใช้งานได้บางส่วนออฟไลน์" },
            { icon: "🖥️", text: "เหมือนแอปจริงๆ" },
            { icon: "💾", text: "ไม่เปลืองพื้นที่มาก" },
            { icon: "🔒", text: "ปลอดภัย เข้ารหัสทั้งหมด" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-2 text-sm text-gray-600">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">
        ThChat PWA — ติดตั้งได้ทุกอุปกรณ์ ไม่ต้องผ่านสโตร์
      </p>
    </div>
  );
}
