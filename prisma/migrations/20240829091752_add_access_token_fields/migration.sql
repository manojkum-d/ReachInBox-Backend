/*
  Warnings:

  - You are about to drop the column `oauthToken` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `oauthToken`,
    ADD COLUMN `accessTokenExpiry` DATETIME(3) NULL,
    ADD COLUMN `oauthAccessToken` VARCHAR(191) NULL;
