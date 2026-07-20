-- CreateTable
CREATE TABLE "plus_order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plus_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plus_order_orderId_key" ON "plus_order"("orderId");

-- CreateIndex
CREATE INDEX "plus_order_userId_idx" ON "plus_order"("userId");

-- AddForeignKey
ALTER TABLE "plus_order" ADD CONSTRAINT "plus_order_userId_id_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
