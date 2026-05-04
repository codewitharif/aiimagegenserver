-- CreateTable
CREATE TABLE `images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` TEXT NOT NULL,
    `prompt` TEXT NOT NULL,
    `style` VARCHAR(191) NULL,
    `aspectRatio` VARCHAR(191) NULL,
    `format` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
