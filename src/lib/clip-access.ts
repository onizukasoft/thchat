import { prisma } from "@/lib/prisma";

type AccessSets = {
  subscribedCreatorIds: Set<string>;
  purchasedClipIds: Set<string>;
};

export async function getAccessSets(userId: string | undefined): Promise<AccessSets> {
  if (!userId) return { subscribedCreatorIds: new Set(), purchasedClipIds: new Set() };

  const [subs, purchases] = await Promise.all([
    prisma.clipSubscription.findMany({
      where: { subscriberId: userId, expiresAt: { gt: new Date() } },
      select: { creatorId: true },
    }),
    prisma.clipPurchase.findMany({
      where: { userId },
      select: { clipId: true },
    }),
  ]);

  return {
    subscribedCreatorIds: new Set(subs.map((s) => s.creatorId)),
    purchasedClipIds: new Set(purchases.map((p) => p.clipId)),
  };
}

export function resolveAccess(
  clip: { id: string; creatorId: string; isSubscriberOnly: boolean; lockedPrice: number | null },
  userId: string | undefined,
  { subscribedCreatorIds, purchasedClipIds }: AccessSets,
): boolean {
  // Creator always has access to own clips
  if (userId && clip.creatorId === userId) return true;

  // PPV clip: must be purchased individually (subscription not enough)
  if (clip.lockedPrice && clip.lockedPrice > 0) {
    return purchasedClipIds.has(clip.id);
  }

  // Subscriber-only: requires active subscription
  if (clip.isSubscriberOnly) {
    return subscribedCreatorIds.has(clip.creatorId);
  }

  // Free clip
  return true;
}
