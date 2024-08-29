/*
  Warnings:

  - You are about to drop the column `body` on the `email` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[messageId]` on the table `Email` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `messageId` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `snippet` to the `Email` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `email` DROP COLUMN `body`,
    ADD COLUMN `messageId` VARCHAR(191) NOT NULL,
    ADD COLUMN `snippet` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `oauthRefreshToken` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Email_messageId_key` ON `Email`(`messageId`);
