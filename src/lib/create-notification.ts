import { prisma } from "@/lib/prisma";
import { notificationBus } from "@/lib/notification-event";

type NotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
};

export async function createNotification(data: NotificationInput) {
  const notif = await prisma.notification.create({ data });
  notificationBus.emit("new", { userId: data.userId });
  return notif;
}
