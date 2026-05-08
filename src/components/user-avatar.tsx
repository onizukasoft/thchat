"use client";
import { cn } from "@/lib/utils";
import { getFrame } from "@/lib/frames";

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
}

interface UserAvatarProps {
  src?: string | null;
  fallback?: string;
  className?: string;
  online?: boolean;
  frameId?: string | null;
}

export function UserAvatar({ src, fallback, className, online, frameId }: UserAvatarProps) {
  const isVideo = isVideoUrl(src);
  const sizeClass = className ?? "w-10 h-10";
  const frame = getFrame(frameId);

  return (
    <div className={cn("relative shrink-0 rounded-xl overflow-visible", sizeClass)}>
      <div className="w-full h-full rounded-xl overflow-hidden bg-purple-100 flex items-center justify-center">
        {src ? (
          isVideo ? (
            <video
              src={src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <span className="text-purple-700 font-bold text-sm select-none">
            {fallback?.toUpperCase() ?? "?"}
          </span>
        )}
      </div>

      {frame && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frame.image}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ zIndex: 10 }}
          aria-hidden
        />
      )}

      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white w-2.5 h-2.5",
            online ? "bg-green-500" : "bg-gray-300"
          )}
          style={{ zIndex: 11 }}
        />
      )}
    </div>
  );
}
