/*
  Warnings:

  - You are about to drop the column `twinWallet` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twinWalletPrivateKey` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "twinWallet",
DROP COLUMN "twinWalletPrivateKey";
