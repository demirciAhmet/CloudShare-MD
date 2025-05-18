/*
  Warnings:

  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_userId_fkey";

-- DropTable
DROP TABLE "Todo";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "content" TEXT,
    "creatorToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Note_uniqueId_key" ON "Note"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_creatorToken_key" ON "Note"("creatorToken");

-- CreateIndex
CREATE INDEX "Note_uniqueId_idx" ON "Note"("uniqueId");

-- CreateIndex
CREATE INDEX "Note_creatorToken_idx" ON "Note"("creatorToken");

-- CreateIndex
CREATE INDEX "Note_expiresAt_idx" ON "Note"("expiresAt");
