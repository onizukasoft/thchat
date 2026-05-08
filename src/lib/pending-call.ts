let pendingCallerId: string | null = null;

export function setPendingAccept(callerId: string) {
  pendingCallerId = callerId;
}

export function consumePendingAccept(): string | null {
  const id = pendingCallerId;
  pendingCallerId = null;
  return id;
}
