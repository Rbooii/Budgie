import { prisma } from "@/lib/prisma";
import type { UpdateUser } from "@/server/schemas/user";

export async function getPlusStatus(userId: string): Promise<{ plus: boolean } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plus: true },
  });
  if (!user) return null;
  return { plus: user.plus };
}

export async function updatePlusStatus(
  userId: string,
  input: UpdateUser,
): Promise<{ plus: boolean }> {
  const owned = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!owned) throw new Error("Not found");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { plus: input.plus },
    select: { plus: true },
  });
  return { plus: updated.plus };
}
