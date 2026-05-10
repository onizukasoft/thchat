let pendingMode: "video" | "post" | null = null;

export function setPendingCreate(mode: "video" | "post") {
  pendingMode = mode;
}

export function consumePendingCreate(): "video" | "post" | null {
  const m = pendingMode;
  pendingMode = null;
  return m;
}
