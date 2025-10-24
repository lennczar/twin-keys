-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('wallet', 'token');

-- CreateTable
CREATE TABLE "MiningTarget" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "twinAddress" TEXT,
    "twinPrivateKey" TEXT,
    "type" "TargetType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiningTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MiningTarget_address_key" ON "MiningTarget"("address");
