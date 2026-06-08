-- CreateTable
CREATE TABLE `AnalyticsEvent` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PAGE_VIEW', 'PRODUCT_VIEW', 'WHATSAPP_CLICK', 'RETAIL_REGISTER', 'RETAIL_APPROVED', 'LOGIN', 'LOGOUT') NOT NULL,
    `path` VARCHAR(191) NULL,
    `productId` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `phone` VARCHAR(32) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AnalyticsEvent_type_createdAt_idx`(`type`, `createdAt`),
    INDEX `AnalyticsEvent_productId_idx`(`productId`),
    INDEX `AnalyticsEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
