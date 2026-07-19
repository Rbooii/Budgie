import { prisma } from "@/lib/prisma";
import type { CreateSubscription, UpdateSubscription } from "@/server/schemas/subscription";

export async function listSubscriptions(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSubscription(userId: string, id: string) {
  return prisma.subscription.findFirst({ where: { id, userId } });
}

export async function createSubscription(
  userId: string,
  input: CreateSubscription,
) {
  const existing = await prisma.subscription.findFirst({
    where: { userId, name: input.name },
  });
  if (existing) throw new Error("Subscription with this name already exists");
  return prisma.subscription.create({ data: { ...input, userId } });
}

export async function updateSubscription(
  userId: string,
  id: string,
  input: UpdateSubscription,
) {
  const owned = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("Not found");
  if (owned.name !== input.name) {
    const clash = await prisma.subscription.findFirst({
      where: { userId, name: input.name, NOT: { id } },
    });
    if (clash) throw new Error("Subscription with this name already exists");
  }
  return prisma.subscription.update({ where: { id }, data: input });
}

export async function deleteSubscription(userId: string, id: string) {
  const owned = await prisma.subscription.findFirst({ where: { id, userId } });
  if (!owned) throw new Error("Not found");
  return prisma.subscription.delete({ where: { id } });
}
