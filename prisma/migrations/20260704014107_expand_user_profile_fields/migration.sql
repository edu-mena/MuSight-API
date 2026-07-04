-- AlterTable
ALTER TABLE `user` ADD COLUMN `academicArea` VARCHAR(191) NULL,
    ADD COLUMN `academicLevel` VARCHAR(191) NULL,
    ADD COLUMN `appliedForResearcher` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `contributions` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `debatesCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `institution` VARCHAR(191) NULL,
    ADD COLUMN `linkedin` VARCHAR(191) NULL,
    ADD COLUMN `organization` VARCHAR(191) NULL,
    ADD COLUMN `portfolioUrl` VARCHAR(191) NULL,
    ADD COLUMN `profession` VARCHAR(191) NULL,
    ADD COLUMN `researcherFocusArea` VARCHAR(191) NULL,
    ADD COLUMN `researcherMotivation` TEXT NULL,
    ADD COLUMN `suspended` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `website` VARCHAR(191) NULL,
    MODIFY `role` ENUM('user', 'researcher', 'expert', 'admin') NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE `UserExpertise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `level` ENUM('basico', 'intermedio', 'avancado') NOT NULL DEFAULT 'basico',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserExpertise` ADD CONSTRAINT `UserExpertise_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
